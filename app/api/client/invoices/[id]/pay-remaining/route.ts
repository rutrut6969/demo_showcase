import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";
import { createSquareDepositPayment } from "@/lib/square";

const schema = z.object({
  savedPaymentMethodId: z.string().optional()
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireClientSession();
  if (auth.response) return auth.response;
  const body = schema.parse(await request.json().catch(() => ({})));

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, clientId: auth.session.clientId, archivedAt: null },
    include: { payments: true }
  });
  if (!invoice) return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 });
  if (!["DEPOSIT_PAID", "APPROVED"].includes(invoice.status)) {
    return NextResponse.json({ ok: false, error: "This invoice is not eligible for remaining balance payment." }, { status: 409 });
  }
  const paid = invoice.payments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = Math.max(0, invoice.total - paid);
  if (remaining <= 0 || invoice.status === "PAID") {
    return NextResponse.json({ ok: true, alreadyPaid: true, amount: 0 });
  }

  const card = body.savedPaymentMethodId
    ? await prisma.savedPaymentMethod.findFirst({ where: { id: body.savedPaymentMethodId, clientId: auth.session.clientId, disabledAt: null } })
    : await prisma.savedPaymentMethod.findFirst({ where: { clientId: auth.session.clientId, disabledAt: null }, orderBy: [{ defaultCard: "desc" }, { createdAt: "desc" }] });
  if (!card) return NextResponse.json({ ok: false, error: "A saved card is required for remaining balance payment." }, { status: 409 });

  const idempotencyKey = `remaining-${invoice.id}-${randomUUID()}`;
  const result = await createSquareDepositPayment({
    invoiceId: invoice.id,
    sourceId: card.squareCardId,
    amount: remaining,
    idempotencyKey,
    note: `Obsidian Systems invoice ${invoice.invoiceNumber} remaining balance`
  });
  await prisma.paymentRecord.create({
    data: {
      invoiceId: invoice.id,
      amount: remaining,
      status: result.ok ? "PAID" : "FAILED",
      idempotencyKey,
      squarePaymentId: result.squarePaymentId,
      squareCardId: card.squareCardId,
      paymentMethod: "Square saved card",
      metadata: { kind: "remaining_balance", squarePaymentId: result.squarePaymentId, status: result.status } as object
    }
  }).catch(() => undefined);

  if (!result.ok) return NextResponse.json({ ok: false, error: result.message || "Remaining balance payment failed." }, { status: 402 });
  await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
  return NextResponse.json({ ok: true, amount: remaining, status: "PAID" });
}
