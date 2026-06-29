import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { defaultPricingRules } from "@/lib/pricing-config";

const pricingRuleSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  description: z.string().nullable().optional(),
  basePrice: z.number().int().min(50000).optional(),
  minPrice: z.number().int().min(50000).optional(),
  maxPrice: z.number().int().nullable().optional(),
  retainerTier: z.string().nullable().optional(),
  retainerMin: z.number().int().nullable().optional(),
  retainerMax: z.number().int().nullable().optional(),
  active: z.boolean().optional()
});

export async function GET() {
  const auth = await requireAdminSession("*");
  if (auth.response) return auth.response;
  const pricingRules = await prisma.pricingRule.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => defaultPricingRules);
  return NextResponse.json({ pricingRules });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession("*", request);
  if (auth.response) return auth.response;
  const body = pricingRuleSchema.parse(await request.json());
  const fallback = defaultPricingRules.find((rule) => rule.key === body.key);
  const pricingRule = await prisma.pricingRule.upsert({
    where: { key: body.key },
    update: body,
    create: {
      key: body.key,
      label: body.label || fallback?.label || body.key.replaceAll("_", " "),
      description: body.description ?? fallback?.description,
      complexityLevel: fallback?.complexityLevel,
      basePrice: body.basePrice ?? fallback?.basePrice ?? 50000,
      minPrice: body.minPrice ?? fallback?.minPrice ?? 50000,
      maxPrice: body.maxPrice ?? fallback?.maxPrice,
      retainerTier: body.retainerTier ?? fallback?.retainerTier,
      retainerMin: body.retainerMin ?? fallback?.retainerMin,
      retainerMax: body.retainerMax ?? fallback?.retainerMax,
      active: body.active ?? true,
      sortOrder: fallback?.sortOrder ?? 99
    }
  });
  return NextResponse.json({ pricingRule });
}
