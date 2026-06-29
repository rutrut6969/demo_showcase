import type { ComplexityLevel, Promotion } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { defaultPricingRules, MINIMUM_PROJECT_PRICE } from "@/lib/pricing-config";

export { MINIMUM_PROJECT_PRICE };

export type PricingCategory = "basic_website" | "business_website" | "ecommerce_website" | "custom_web_app" | "complex_system";

export async function getPricingRules() {
  const records = await prisma.pricingRule.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }).catch(() => []);
  return records.length ? records : defaultPricingRules;
}

export async function getActivePromotion(now = new Date()) {
  const promotions = await prisma.promotion
    .findMany({
      where: {
        active: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }]
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
    .catch(() => null);

  return promotions?.find((promotion) => promotion.maxUses === null || promotion.currentUses < promotion.maxUses) || null;
}

export function inferPricingCategory(input: { businessType?: string; demoCategory?: string; selectedDemo?: string; desiredFeatures?: string[]; notes?: string }, complexity: ComplexityLevel): PricingCategory {
  const text = `${input.businessType || ""} ${input.demoCategory || ""} ${input.selectedDemo || ""} ${(input.desiredFeatures || []).join(" ")} ${input.notes || ""}`.toLowerCase();
  if (complexity === "CUSTOM_ENTERPRISE" || text.includes("enterprise") || text.includes("multi-location")) return "complex_system";
  if (complexity === "HIGH" || text.includes("portal") || text.includes("dashboard") || text.includes("workflow") || text.includes("repair") || text.includes("medical")) return "custom_web_app";
  if (text.includes("ecommerce") || text.includes("commerce") || text.includes("store") || text.includes("shop") || text.includes("payment") || text.includes("square")) return "ecommerce_website";
  if (complexity === "MODERATE" || text.includes("booking") || text.includes("crm") || text.includes("business")) return "business_website";
  return "basic_website";
}

export async function resolveQuotePricing(input: { businessType?: string; demoCategory?: string; selectedDemo?: string; desiredFeatures?: string[]; notes?: string }, complexity: ComplexityLevel) {
  const rules = await getPricingRules();
  const category = inferPricingCategory(input, complexity);
  const rule = rules.find((item) => item.key === category) || rules[0] || defaultPricingRules[0];
  const activePromotion = await getActivePromotion();
  const featureAdjustment = Math.min((input.desiredFeatures?.length || 0) * 25000, 200000);
  const normalPrice = Math.max(MINIMUM_PROJECT_PRICE, rule.basePrice + featureAdjustment);
  const promotionalPrice = activePromotion ? Math.max(MINIMUM_PROJECT_PRICE, activePromotion.promoPrice) : null;
  const selectedBuildPrice = promotionalPrice ?? normalPrice;
  const normalRetainer = rule.retainerMin ?? activePromotion?.normalRetainer ?? null;
  const promotionalRetainer = activePromotion?.promoRetainer ?? null;
  const selectedRetainer = promotionalRetainer ?? normalRetainer;

  return {
    category,
    rule,
    promotion: activePromotion,
    normalPrice,
    promotionalPrice,
    selectedBuildPrice,
    normalRetainer,
    promotionalRetainer,
    selectedRetainer,
    retainerTier: rule.retainerTier || "Essential Retainer"
  };
}

export function normalizeCents(value: unknown, minimum = MINIMUM_PROJECT_PRICE) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return minimum;
  const cents = numeric > 0 && numeric < 10000 ? Math.round(numeric * 100) : Math.round(numeric);
  return Math.max(minimum, cents);
}

export function promotionIsUsable(promotion: Promotion | null | undefined) {
  if (!promotion || !promotion.active) return false;
  const now = new Date();
  if (promotion.startDate && promotion.startDate > now) return false;
  if (promotion.endDate && promotion.endDate < now) return false;
  if (promotion.maxUses !== null && promotion.currentUses >= promotion.maxUses) return false;
  return true;
}
