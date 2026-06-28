import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["DRAFT", "AI_GENERATED", "ADMIN_REVIEWED", "SENT", "VIEWED", "APPROVED", "REVISION_REQUESTED", "DENIED", "DEPOSIT_PAID", "PAID", "CANCELLED"]).optional(),
  projectSummary: z.string().optional(),
  scopeBreakdown: z.array(z.string()).optional(),
  depositDue: z.number().int().optional(),
  total: z.number().int().optional(),
  retainerRecommendation: z.string().optional(),
  timelineEstimate: z.string().optional(),
  terms: z.string().optional()
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        request: true,
        lineItems: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ invoice: null }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json({
      invoice: null,
      warning: error instanceof Error ? error.message : "Invoice unavailable"
    }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession("requests:view");
  if (auth.response) return auth.response;
  const body = updateSchema.parse(await request.json());
  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: body
  });
  return NextResponse.json({ invoice });
}
