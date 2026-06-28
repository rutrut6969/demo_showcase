import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const responseSchema = z.object({
  status: z.enum(["APPROVED", "REVISION_REQUESTED", "DENIED"])
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = responseSchema.parse(await request.json());
  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      status: body.status,
      approvedAt: body.status === "APPROVED" ? new Date() : undefined
    }
  });

  if (invoice.requestId) {
    await prisma.projectRequest.update({
      where: { id: invoice.requestId },
      data: { status: body.status === "APPROVED" ? "CHECKOUT_PENDING" : body.status }
    }).catch(() => undefined);
  }

  await prisma.siteLog.create({
    data: {
      source: "invoice",
      message: "Client responded to invoice",
      metadata: { invoiceId: invoice.id, status: body.status }
    }
  }).catch(() => undefined);

  return NextResponse.json({ invoice });
}
