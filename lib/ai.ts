import OpenAI from "openai";
import { z } from "zod";
import type { ComplexityLevel } from "@prisma/client";
import { resolveQuotePricing } from "@/lib/pricing";

export const quoteInputSchema = z.object({
  businessType: z.string().optional(),
  selectedDemo: z.string().optional(),
  demoCategory: z.string().optional(),
  recommendedPackage: z.string().optional(),
  estimatedComplexity: z.enum(["LOW", "MODERATE", "HIGH", "CUSTOM_ENTERPRISE"]).optional(),
  desiredFeatures: z.array(z.string()).default([]),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional()
});

export type QuoteInput = z.infer<typeof quoteInputSchema>;

export type GeneratedQuote = {
  buildCostMin: number;
  buildCostMax: number;
  normalPrice: number;
  promotionalPrice?: number | null;
  selectedBuildPrice: number;
  normalRetainer?: number | null;
  promotionalRetainer?: number | null;
  selectedRetainer?: number | null;
  promotionId?: string | null;
  pricingExplanation: string;
  timeframe: string;
  complexityLevel: ComplexityLevel;
  recommendedPackage: string;
  suggestedRetainerTier: string;
  suggestedAddOns: string[];
  scopeSummary: string;
  notesForManualReview: string;
  budgetAssessment: string;
  recommendationOptions: QuoteRecommendationOption[];
  paymentRecommendations: string[];
  rawResponse?: unknown;
};

export type QuoteRecommendationOption = {
  label: string;
  fit: "FULL" | "BUDGET" | "PHASED";
  estimatedBuildPrice: number;
  summary: string;
  includedFeatures: string[];
  deferredFeatures: string[];
  nextStep: string;
};

const complexityDefaults: Record<ComplexityLevel, { timeframe: string }> = {
  LOW: { timeframe: "1-3 weeks" },
  MODERATE: { timeframe: "3-6 weeks" },
  HIGH: { timeframe: "6-10 weeks" },
  CUSTOM_ENTERPRISE: { timeframe: "Custom timeline after discovery" }
};

export async function generateAIQuote(input: QuoteInput): Promise<GeneratedQuote> {
  const parsed = quoteInputSchema.parse(input);
  const complexity = parsed.estimatedComplexity ?? inferComplexity(parsed);
  const fallback = await buildFallbackQuote(parsed, complexity);

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_QUOTE_MODEL || "gpt-4o-mini",
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior Obsidian Systems solutions consultant. Server pricing is authoritative, so do not invent final prices. Return only JSON with timeframe, complexityLevel, recommendedPackage, suggestedRetainerTier, suggestedAddOns, scopeSummary, notesForManualReview, budgetAssessment, paymentRecommendations. Include practical risks, phased implementation guidance, and budget concerns when relevant."
        },
        {
          role: "user",
          content: JSON.stringify(parsed)
        }
      ]
    });

    const content = completion.choices[0]?.message.content;
    if (!content) return fallback;
    const json = JSON.parse(content) as GeneratedQuote;
    return {
      ...fallback,
      suggestedAddOns: Array.isArray(json.suggestedAddOns) ? json.suggestedAddOns : fallback.suggestedAddOns,
      scopeSummary: json.scopeSummary || fallback.scopeSummary,
      notesForManualReview: json.notesForManualReview || fallback.notesForManualReview,
      budgetAssessment: typeof json.budgetAssessment === "string" ? json.budgetAssessment : fallback.budgetAssessment,
      paymentRecommendations: Array.isArray(json.paymentRecommendations)
        ? json.paymentRecommendations.filter((item) => typeof item === "string").slice(0, 4)
        : fallback.paymentRecommendations,
      timeframe: json.timeframe || fallback.timeframe,
      recommendedPackage: json.recommendedPackage || fallback.recommendedPackage,
      complexityLevel: normalizeComplexity(json.complexityLevel) ?? fallback.complexityLevel,
      recommendationOptions: fallback.recommendationOptions,
      rawResponse: {
        openAiCompletion: completion,
        budgetAssessment: typeof json.budgetAssessment === "string" ? json.budgetAssessment : fallback.budgetAssessment,
        recommendationOptions: fallback.recommendationOptions,
        paymentRecommendations: Array.isArray(json.paymentRecommendations)
          ? json.paymentRecommendations.filter((item) => typeof item === "string").slice(0, 4)
          : fallback.paymentRecommendations
      }
    };
  } catch (error) {
    return {
      ...fallback,
      notesForManualReview: `${fallback.notesForManualReview} OpenAI generation failed and fallback pricing was used. ${error instanceof Error ? error.message : ""}`.trim()
    };
  }
}

function inferComplexity(input: QuoteInput): ComplexityLevel {
  const text = `${input.demoCategory ?? ""} ${input.notes ?? ""} ${input.desiredFeatures.join(" ")}`.toLowerCase();
  if (text.includes("enterprise") || text.includes("client portal") || text.includes("multi-location")) return "CUSTOM_ENTERPRISE";
  if (text.includes("medical") || text.includes("payment") || text.includes("inventory") || text.includes("crm") || text.includes("invoice")) return "HIGH";
  if (text.includes("ecommerce") || text.includes("booking") || text.includes("dashboard")) return "MODERATE";
  return "LOW";
}

function normalizeComplexity(value: unknown): ComplexityLevel | null {
  if (value === "LOW" || value === "MODERATE" || value === "HIGH" || value === "CUSTOM_ENTERPRISE") return value;
  return null;
}

async function buildFallbackQuote(input: QuoteInput, complexity: ComplexityLevel): Promise<GeneratedQuote> {
  const defaults = complexityDefaults[complexity];
  const pricing = await resolveQuotePricing(input, complexity);
  const buildCostMin = pricing.selectedBuildPrice;
  const buildCostMax = pricing.rule.maxPrice ? Math.max(buildCostMin, pricing.rule.maxPrice) : Math.max(buildCostMin, pricing.normalPrice);
  const requestedFeatures = input.desiredFeatures.length
    ? input.desiredFeatures
    : ["Landing page", "Lead capture", "Analytics", "Invoice workflow"];
  const budgetCeiling = parseBudgetCeiling(input.budgetRange);
  const budgetAssessment = buildBudgetAssessment(input.budgetRange, buildCostMin, budgetCeiling);
  const recommendationOptions = buildRecommendationOptions({
    selectedBuildPrice: buildCostMin,
    budgetCeiling,
    features: requestedFeatures,
    recommendedPackage: input.recommendedPackage || pricing.rule.label || "Custom Platform Build"
  });
  const paymentRecommendations = buildPaymentRecommendations(buildCostMin, budgetCeiling, pricing.selectedRetainer);
  const pricingExplanation = pricing.promotionalPrice
    ? `Normally this project would be approximately ${formatMoney(pricing.normalPrice)}. Because of the current promotion, this project qualifies for a ${formatMoney(pricing.promotionalPrice)} promotional build price. ${pricing.selectedRetainer ? `We recommend the optional ${pricing.retainerTier} at ${formatMoney(pricing.selectedRetainer)}/month.` : `We recommend the optional ${pricing.retainerTier} with custom monthly pricing.`}`
    : `This project is priced from the configured ${pricing.rule.label} rule at approximately ${formatMoney(pricing.normalPrice)}. ${pricing.selectedRetainer ? `We recommend the optional ${pricing.retainerTier} at ${formatMoney(pricing.selectedRetainer)}/month.` : `We recommend the optional ${pricing.retainerTier} with custom monthly pricing.`}`;
  return {
    buildCostMin,
    buildCostMax,
    normalPrice: pricing.normalPrice,
    promotionalPrice: pricing.promotionalPrice,
    selectedBuildPrice: pricing.selectedBuildPrice,
    normalRetainer: pricing.normalRetainer,
    promotionalRetainer: pricing.promotionalRetainer,
    selectedRetainer: pricing.selectedRetainer,
    promotionId: pricing.promotion?.id,
    pricingExplanation,
    budgetAssessment,
    recommendationOptions,
    paymentRecommendations,
    timeframe: defaults.timeframe,
    complexityLevel: complexity,
    recommendedPackage: input.recommendedPackage || "Custom Platform Build",
    suggestedRetainerTier: pricing.retainerTier,
    suggestedAddOns: [
      "Analytics event mapping",
      "Branded proposal and invoice workflow",
      "Operations dashboard training",
      "Managed Platform Retainer onboarding"
    ],
    scopeSummary: `A ${input.businessType || "business"} platform inspired by ${input.selectedDemo || "the selected demo"} with ${input.desiredFeatures.length ? input.desiredFeatures.join(", ") : "core lead capture, polished pages, and operations-ready workflows"}.`,
    notesForManualReview:
      "Review integrations, content readiness, payment flow requirements, legal/healthcare compliance needs, timeline pressure, and any imported assets before final pricing.",
    rawResponse: {
      budgetAssessment,
      recommendationOptions,
      paymentRecommendations
    }
  };
}

function parseBudgetCeiling(budgetRange?: string) {
  if (!budgetRange) return null;
  const normalized = budgetRange.toLowerCase();
  if (normalized.includes("under")) return 250000;
  const matches = [...budgetRange.matchAll(/\$?([\d,]+)/g)].map((match) => Number(match[1].replace(/,/g, "")) * 100);
  if (normalized.includes("+")) return matches[0] ?? null;
  return matches.length ? Math.max(...matches) : null;
}

function buildBudgetAssessment(budgetRange: string | undefined, selectedBuildPrice: number, budgetCeiling: number | null) {
  if (!budgetRange || !budgetCeiling) {
    return `No firm budget was provided. The recommended build is currently priced at ${formatMoney(selectedBuildPrice)}, with scope still subject to manual review.`;
  }

  if (selectedBuildPrice <= budgetCeiling) {
    return `The selected budget range (${budgetRange}) can support the recommended ${formatMoney(selectedBuildPrice)} build, assuming integrations and content are ready.`;
  }

  return `The requested scope prices at ${formatMoney(selectedBuildPrice)}, which is above the selected budget range (${budgetRange}). Consider a smaller launch scope or phased implementation.`;
}

function buildRecommendationOptions({
  selectedBuildPrice,
  budgetCeiling,
  features,
  recommendedPackage
}: {
  selectedBuildPrice: number;
  budgetCeiling: number | null;
  features: string[];
  recommendedPackage: string;
}): QuoteRecommendationOption[] {
  const requiredFeatures = features.slice(0, Math.max(2, Math.ceil(features.length * 0.55)));
  const deferredFeatures = features.filter((feature) => !requiredFeatures.includes(feature));
  const budgetPrice = budgetCeiling && budgetCeiling < selectedBuildPrice ? Math.max(50000, budgetCeiling) : selectedBuildPrice;
  const phaseOnePrice = budgetCeiling && budgetCeiling < selectedBuildPrice ? Math.max(50000, Math.min(budgetCeiling, Math.round(selectedBuildPrice * 0.6))) : Math.round(selectedBuildPrice * 0.65);

  return [
    {
      label: "Full recommended solution",
      fit: "FULL",
      estimatedBuildPrice: selectedBuildPrice,
      summary: `Build the complete ${recommendedPackage} scope with the requested launch features and production-ready workflow foundations.`,
      includedFeatures: features,
      deferredFeatures: [],
      nextStep: "Best when the goal is to launch the full system in one production pass."
    },
    {
      label: "Budget-fit launch",
      fit: "BUDGET",
      estimatedBuildPrice: budgetPrice,
      summary: "Prioritize the smallest useful production launch and hold lower-priority automation or polish for a later upgrade.",
      includedFeatures: requiredFeatures,
      deferredFeatures: deferredFeatures.length ? deferredFeatures : ["Advanced automation", "Secondary dashboard views", "Expanded integrations"],
      nextStep: "Best when the current budget is firm and speed matters more than complete scope."
    },
    {
      label: "Phased build plan",
      fit: "PHASED",
      estimatedBuildPrice: phaseOnePrice,
      summary: "Launch phase one with the core customer path, then schedule follow-up phases for deeper operations, automations, and integrations.",
      includedFeatures: requiredFeatures.slice(0, Math.max(2, Math.ceil(requiredFeatures.length * 0.75))),
      deferredFeatures: Array.from(new Set([...deferredFeatures, "Advanced reporting", "Additional integrations", "Post-launch optimization"])),
      nextStep: "Best when the full solution is right, but the timeline or budget works better in milestones."
    }
  ];
}

function buildPaymentRecommendations(selectedBuildPrice: number, budgetCeiling: number | null, selectedRetainer?: number | null) {
  const deposit = Math.max(50000, Math.round(selectedBuildPrice * 0.25));
  const recommendations = [
    `Deposit path: reserve the production window with an estimated ${formatMoney(deposit)} deposit, then settle the remaining balance before or at completion.`,
    "Payment plan path: split the remaining balance across project milestones after manual approval.",
    "Afterpay/Clearpay path: available only when Square account, region, transaction amount, and eligibility rules allow it."
  ];

  if (budgetCeiling && budgetCeiling < selectedBuildPrice) {
    recommendations.unshift("Budget note: selected scope exceeds the stated budget, so the budget-fit or phased option should be reviewed before checkout.");
  }

  if (selectedRetainer) {
    recommendations.push(`Retainer path: optional managed platform care can be added separately at ${formatMoney(selectedRetainer)}/month when selected.`);
  }

  return recommendations;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
