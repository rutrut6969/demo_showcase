import { NextResponse } from "next/server";
import { z } from "zod";
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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = updateSchema.parse(await request.json());
  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: body
  });
  return NextResponse.json({ invoice });
}
