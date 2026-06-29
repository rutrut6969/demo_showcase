import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAIQuote } from "@/lib/ai";

const requestSchema = z.object({
  name: z.string().min(1),
  businessName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  businessType: z.string().optional(),
  selectedDemo: z.string().optional(),
  demoCategory: z.string().optional(),
  recommendedPackage: z.string().optional(),
  sourcePage: z.string().optional(),
  estimatedComplexity: z.enum(["LOW", "MODERATE", "HIGH", "CUSTOM_ENTERPRISE"]).optional(),
  desiredFeatures: z.array(z.string()).default([]),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
  marketingConsent: z.boolean().default(false),
  termsAcknowledged: z.boolean().default(false)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.parse(body);
  const quote = await generateAIQuote(parsed);

  try {
    const client = await prisma.client.upsert({
      where: { email: parsed.email },
      update: {
        name: parsed.name,
        businessName: parsed.businessName,
        phone: parsed.phone,
        marketingConsent: parsed.marketingConsent,
        linkedDemoInterest: parsed.selectedDemo
      },
      create: {
        name: parsed.name,
        businessName: parsed.businessName,
        email: parsed.email,
        phone: parsed.phone,
        marketingConsent: parsed.marketingConsent,
        linkedDemoInterest: parsed.selectedDemo,
        source: parsed.sourcePage
      }
    });

    const projectRequest = await prisma.projectRequest.create({
      data: {
        clientId: client.id,
        name: parsed.name,
        businessName: parsed.businessName,
        email: parsed.email,
        phone: parsed.phone,
        businessType: parsed.businessType,
        selectedDemo: parsed.selectedDemo,
        demoCategory: parsed.demoCategory,
        recommendedPackage: parsed.recommendedPackage,
        sourcePage: parsed.sourcePage,
        estimatedComplexity: quote.complexityLevel,
        desiredFeatures: parsed.desiredFeatures,
        budgetRange: parsed.budgetRange,
        timeline: parsed.timeline,
        notes: parsed.notes,
        marketingConsent: parsed.marketingConsent,
        termsAcknowledged: parsed.termsAcknowledged,
        status: "AI_QUOTED",
        aiQuote: {
          create: {
            buildCostMin: quote.buildCostMin,
            buildCostMax: quote.buildCostMax,
            normalPrice: quote.normalPrice,
            promotionalPrice: quote.promotionalPrice,
            selectedBuildPrice: quote.selectedBuildPrice,
            normalRetainer: quote.normalRetainer,
            promotionalRetainer: quote.promotionalRetainer,
            selectedRetainer: quote.selectedRetainer,
            promotionId: quote.promotionId,
            timeframe: quote.timeframe,
            complexityLevel: quote.complexityLevel,
            recommendedPackage: quote.recommendedPackage,
            suggestedRetainerTier: quote.suggestedRetainerTier,
            suggestedAddOns: quote.suggestedAddOns,
            scopeSummary: quote.scopeSummary,
            notesForManualReview: quote.notesForManualReview,
            rawResponse: quote.rawResponse as object
          }
        }
      },
      include: { aiQuote: true }
    });

    await prisma.siteLog.create({
      data: {
        source: "request",
        message: "New project request submitted and AI quote generated",
        metadata: { requestId: projectRequest.id, notify: process.env.ADMIN_NOTIFY_EMAIL }
      }
    }).catch(() => undefined);

    return NextResponse.json({ requestId: projectRequest.id, quote: projectRequest.aiQuote, persisted: true });
  } catch (error) {
    return NextResponse.json({
      requestId: `local-${Date.now()}`,
      quote,
      persisted: false,
      warning: error instanceof Error ? error.message : "Database persistence unavailable"
    });
  }
}
