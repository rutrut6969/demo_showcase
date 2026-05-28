import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  requestId: z.string().optional(),
  selectedDemo: z.string().optional(),
  quote: z.object({
    buildCostMin: z.number().int(),
    buildCostMax: z.number().int(),
    timeframe: z.string(),
    recommendedPackage: z.string(),
    suggestedRetainerTier: z.string(),
    suggestedAddOns: z.array(z.string()).default([]),
    scopeSummary: z.string()
  })
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const requestId = body.requestId?.startsWith("local-") ? undefined : body.requestId;
  const depositDue = Math.max(50000, Math.round(body.quote.buildCostMin * 0.25));

  try {
    const projectRequest = requestId
      ? await prisma.projectRequest.update({
          where: { id: requestId },
          data: { status: "CLIENT_ACCEPTED_ESTIMATE" },
          include: { client: true }
        })
      : null;

    const scopeBreakdown = [
      body.quote.scopeSummary,
      `Recommended package: ${body.quote.recommendedPackage}`,
      `Suggested retainer: ${body.quote.suggestedRetainerTier}`,
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
        total: body.quote.buildCostMin,
        retainerRecommendation: body.quote.suggestedRetainerTier,
        timelineEstimate: body.quote.timeframe,
        terms:
          "This estimate is AI-generated and may be adjusted after manual review depending on scope, integrations, content, timeline, and technical requirements.",
        lineItems: {
          create: [
            {
              description: body.quote.recommendedPackage,
              quantity: 1,
              unitAmount: body.quote.buildCostMin,
              totalAmount: body.quote.buildCostMin
            },
            {
              description: "Deposit due to reserve production window",
              quantity: 1,
              unitAmount: depositDue,
              totalAmount: depositDue
            }
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
