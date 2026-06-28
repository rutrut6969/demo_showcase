import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSquareDepositPayment, getSquareFrontendConfig } from "@/lib/square";

const paymentSchema = z.object({
  invoiceId: z.string(),
  sourceId: z.string().min(1),
  idempotencyKey: z.string().min(8).optional()
});

export async function GET() {
  return NextResponse.json(getSquareFrontendConfig());
}

export async function POST(request: Request) {
  const body = paymentSchema.parse(await request.json());
  const invoice = await prisma.invoice.findUnique({
    where: { id: body.invoiceId },
    include: { payments: true }
  });

  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });
  }

  const alreadyPaid = invoice.payments.find((payment) => payment.status === "PAID" && payment.amount >= invoice.depositDue);
  if (alreadyPaid) {
    return NextResponse.json({ ok: true, alreadyPaid: true, squarePaymentId: alreadyPaid.squarePaymentId });
  }

  const idempotencyKey = body.idempotencyKey || `${invoice.id}-${invoice.updatedAt.getTime()}`;
  const result = await createSquareDepositPayment({
    invoiceId: invoice.id,
    sourceId: body.sourceId,
    amount: invoice.depositDue,
    currency: "USD",
    idempotencyKey
  });

  await prisma.paymentRecord.create({
    data: {
      invoiceId: invoice.id,
      amount: invoice.depositDue,
      status: result.ok ? "PAID" : "FAILED",
      squarePaymentId: result.squarePaymentId,
      paymentMethod: "Square",
      metadata: { ...result, idempotencyKey } as object
    }
  }).catch(() => undefined);

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: result.ok ? "DEPOSIT_PAID" : "SENT" }
  }).catch(() => undefined);

  if (!result.ok) {
    return NextResponse.json({ ...result, error: result.message || "Square payment failed" }, { status: 402 });
  }

  return NextResponse.json(result);
}
