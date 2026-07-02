import { NextResponse } from "next/server";
import { z } from "zod";
import { MINIMUM_PROJECT_PRICE, resolveQuotePricing } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  requestId: z.string().optional(),
  selectedDemo: z.string().optional(),
  includeRetainer: z.boolean().default(false),
  quote: z.object({
    buildCostMin: z.number().int(),
    buildCostMax: z.number().int(),
    selectedBuildPrice: z.number().int().optional(),
    selectedRetainer: z.number().int().nullable().optional(),
    promotionId: z.string().nullable().optional(),
    timeframe: z.string(),
    complexityLevel: z.enum(["LOW", "MODERATE", "HIGH", "CUSTOM_ENTERPRISE"]).optional(),
    recommendedPackage: z.string(),
    suggestedRetainerTier: z.string(),
    suggestedAddOns: z.array(z.string()).default([]),
    scopeSummary: z.string(),
    budgetAssessment: z.string().optional(),
    paymentRecommendations: z.array(z.string()).optional(),
    recommendationOptions: z.array(z.object({
      label: z.string(),
      fit: z.enum(["FULL", "BUDGET", "PHASED"]),
      estimatedBuildPrice: z.number().int(),
      summary: z.string(),
      includedFeatures: z.array(z.string()).default([]),
      deferredFeatures: z.array(z.string()).default([]),
      nextStep: z.string()
    })).optional()
  })
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const requestId = body.requestId?.startsWith("local-") ? undefined : body.requestId;

  try {
    const projectRequest = requestId
      ? await prisma.projectRequest.update({
          where: { id: requestId },
          data: { status: "CLIENT_ACCEPTED_ESTIMATE" },
          include: { client: true, aiQuote: true }
        })
      : null;

    const serverPricing = projectRequest?.aiQuote
      ? {
          buildPrice: projectRequest.aiQuote.selectedBuildPrice || projectRequest.aiQuote.promotionalPrice || projectRequest.aiQuote.normalPrice || projectRequest.aiQuote.buildCostMin,
          normalPrice: projectRequest.aiQuote.normalPrice || projectRequest.aiQuote.buildCostMin,
          retainerPrice: projectRequest.aiQuote.selectedRetainer,
          promotionId: projectRequest.aiQuote.promotionId
        }
      : await resolveQuotePricing(
          {
            selectedDemo: body.selectedDemo,
            desiredFeatures: body.quote.suggestedAddOns,
            notes: body.quote.scopeSummary
          },
          body.quote.complexityLevel || "MODERATE"
        ).then((pricing) => ({
          buildPrice: pricing.selectedBuildPrice,
          normalPrice: pricing.normalPrice,
          retainerPrice: pricing.selectedRetainer,
          promotionId: pricing.promotion?.id
        }));

    const buildPrice = Math.max(MINIMUM_PROJECT_PRICE, serverPricing.buildPrice);
    const retainerPrice = body.includeRetainer && serverPricing.retainerPrice ? serverPricing.retainerPrice : null;
    const total = buildPrice;
    const depositDue = Math.max(50000, Math.round(buildPrice * 0.25));

    const scopeBreakdown = [
      body.quote.scopeSummary,
      `Recommended package: ${body.quote.recommendedPackage}`,
      `One-time build price: ${formatMoney(buildPrice)}`,
      retainerPrice ? `Optional retainer selected for follow-up setup: ${body.quote.suggestedRetainerTier} at ${formatMoney(retainerPrice)}/month` : `Optional retainer declined at checkout: ${body.quote.suggestedRetainerTier}`,
      ...(body.quote.budgetAssessment ? [`Budget assessment: ${body.quote.budgetAssessment}`] : []),
      ...(body.quote.recommendationOptions || []).map((option) => `${option.label}: ${option.summary}`),
      ...(body.quote.paymentRecommendations || []).map((recommendation) => `Payment recommendation: ${recommendation}`),
      ...body.quote.suggestedAddOns.map((addOn) => `Suggested add-on: ${addOn}`)
    ];

    const invoice = await prisma.invoice.create({
      data: {
        clientId: projectRequest?.clientId,
        requestId,
        invoiceNumber: `CHK-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        status: "SENT",
        projectSummary: `${body.selectedDemo || projectRequest?.selectedDemo || "Custom platform"} accepted AI estimate checkout.`,
        scopeBreakdown,
        depositDue,
        total,
        retainerRecommendation: retainerPrice ? `${body.quote.suggestedRetainerTier}: ${formatMoney(retainerPrice)}/month selected` : `${body.quote.suggestedRetainerTier}: optional, not included`,
        retainerSelected: Boolean(retainerPrice),
        retainerTier: body.quote.suggestedRetainerTier,
        retainerMonthlyAmount: retainerPrice,
        timelineEstimate: body.quote.timeframe,
        terms:
          "This estimate is AI-generated and may be adjusted after manual review depending on scope, integrations, content, timeline, and technical requirements.",
        lineItems: {
          create: [
            {
              description: `${body.quote.recommendedPackage} - Project Build`,
              quantity: 1,
              unitAmount: buildPrice,
              totalAmount: buildPrice
            },
          ]
        }
      }
    });

    if (requestId) {
      await prisma.projectRequest.update({
        where: { id: requestId },
        data: { status: "CHECKOUT_PENDING" }
      });
    }

    if (serverPricing.promotionId) {
      await prisma.promotion.update({
        where: { id: serverPricing.promotionId },
        data: { currentUses: { increment: 1 } }
      }).catch(() => undefined);
    }

    await prisma.siteLog.create({
      data: {
        source: "checkout",
        message: "Client accepted AI estimate and checkout was created",
        metadata: { requestId, invoiceId: invoice.id }
      }
    }).catch(() => undefined);

    return NextResponse.json({ checkoutUrl: `/invoices/${invoice.id}`, invoiceId: invoice.id, persisted: true });
  } catch (error) {
    const localId = `local-checkout-${Date.now()}`;
    return NextResponse.json({
      checkoutUrl: `/invoices/${localId}`,
      invoiceId: localId,
      persisted: false,
      warning: error instanceof Error ? error.message : "Checkout persistence unavailable"
    });
  }
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
