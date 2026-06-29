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
  rawResponse?: unknown;
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
            "You generate conservative software project estimates for Obsidian Systems LLC. Return only JSON with buildCostMin, buildCostMax, timeframe, complexityLevel, recommendedPackage, suggestedRetainerTier, suggestedAddOns, scopeSummary, notesForManualReview."
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
      timeframe: json.timeframe || fallback.timeframe,
      recommendedPackage: json.recommendedPackage || fallback.recommendedPackage,
      complexityLevel: normalizeComplexity(json.complexityLevel) ?? fallback.complexityLevel,
      rawResponse: completion
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
      "Review integrations, content readiness, payment flow requirements, legal/healthcare compliance needs, timeline pressure, and any imported assets before final pricing."
  };
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
