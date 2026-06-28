import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const invoiceSchema = z.object({
  clientId: z.string().optional(),
  requestId: z.string().optional(),
  projectSummary: z.string(),
  scopeBreakdown: z.array(z.string()).default([]),
  depositDue: z.number().int(),
  total: z.number().int(),
  retainerRecommendation: z.string().optional(),
  timelineEstimate: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().default(1),
    unitAmount: z.number().int()
  })).default([])
});

export async function POST(request: Request) {
  const auth = await requireAdminSession("requests:view");
  if (auth.response) return auth.response;
  const body = invoiceSchema.parse(await request.json());
  const invoice = await prisma.invoice.create({
    data: {
      clientId: body.clientId,
      requestId: body.requestId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
      status: "AI_GENERATED",
      projectSummary: body.projectSummary,
      scopeBreakdown: body.scopeBreakdown,
      depositDue: body.depositDue,
      total: body.total,
      retainerRecommendation: body.retainerRecommendation,
      timelineEstimate: body.timelineEstimate,
      terms: "Final pricing may vary after manual review. Deposit starts production after acceptance.",
      lineItems: {
        create: body.lineItems.map((item) => ({
          ...item,
          totalAmount: item.quantity * item.unitAmount
        }))
      }
    },
    include: { lineItems: true }
  });

  return NextResponse.json({ invoice });
}
