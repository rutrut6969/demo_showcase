import OpenAI from "openai";
import { z } from "zod";
import type { ComplexityLevel } from "@prisma/client";

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
  timeframe: string;
  complexityLevel: ComplexityLevel;
  recommendedPackage: string;
  suggestedRetainerTier: string;
  suggestedAddOns: string[];
  scopeSummary: string;
  notesForManualReview: string;
  rawResponse?: unknown;
};

const complexityDefaults: Record<ComplexityLevel, { min: number; max: number; timeframe: string; retainer: string }> = {
  LOW: { min: 1800, max: 4200, timeframe: "2-4 weeks", retainer: "Essential Retainer" },
  MODERATE: { min: 4500, max: 9500, timeframe: "4-7 weeks", retainer: "Commerce Retainer" },
  HIGH: { min: 10000, max: 22000, timeframe: "8-12 weeks", retainer: "Enterprise Retainer" },
  CUSTOM_ENTERPRISE: { min: 22000, max: 55000, timeframe: "12+ weeks", retainer: "Enterprise Retainer" }
};

export async function generateAIQuote(input: QuoteInput): Promise<GeneratedQuote> {
  const parsed = quoteInputSchema.parse(input);
  const complexity = parsed.estimatedComplexity ?? inferComplexity(parsed);
  const fallback = buildFallbackQuote(parsed, complexity);

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
      ...json,
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

function buildFallbackQuote(input: QuoteInput, complexity: ComplexityLevel): GeneratedQuote {
  const defaults = complexityDefaults[complexity];
  const featureCount = input.desiredFeatures.length;
  const featureAdjustment = Math.min(featureCount * 350, 3500);
  return {
    buildCostMin: defaults.min + Math.round(featureAdjustment * 0.5),
    buildCostMax: defaults.max + featureAdjustment,
    timeframe: defaults.timeframe,
    complexityLevel: complexity,
    recommendedPackage: input.recommendedPackage || "Custom Platform Build",
    suggestedRetainerTier: defaults.retainer,
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
