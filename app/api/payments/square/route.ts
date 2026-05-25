import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSquareDepositPayment } from "@/lib/square";

const paymentSchema = z.object({
  invoiceId: z.string(),
  sourceId: z.string().optional(),
  amount: z.number().int()
});

export async function POST(request: Request) {
  const body = paymentSchema.parse(await request.json());
  const result = await createSquareDepositPayment(body);

  await prisma.paymentRecord.create({
    data: {
      invoiceId: body.invoiceId,
      amount: body.amount,
      status: result.ok ? "PAID" : "FAILED",
      squarePaymentId: result.squarePaymentId,
      paymentMethod: "Square",
      metadata: result as object
    }
  }).catch(() => undefined);

  await prisma.invoice.update({
    where: { id: body.invoiceId },
    data: { status: result.ok ? "DEPOSIT_PAID" : "SENT" }
  }).catch(() => undefined);

  return NextResponse.json(result);
}
