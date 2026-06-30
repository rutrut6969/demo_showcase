import { NextResponse } from "next/server";
import { z } from "zod";
import type { InvoiceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createSquareDepositPayment, getSquareFrontendConfig } from "@/lib/square";

const paymentSchema = z.object({
  invoiceId: z.string(),
  sourceId: z.string().min(1),
  idempotencyKey: z.string().min(8).optional(),
  retainerSelected: z.boolean().optional(),
  retainerTier: z.string().nullable().optional(),
  retainerMonthlyAmount: z.number().int().nullable().optional()
});

const checkoutAllowedStatuses: InvoiceStatus[] = ["APPROVED"];
const blockedStatuses: InvoiceStatus[] = ["DENIED", "REVISION_REQUESTED", "CANCELLED", "DRAFT", "AI_GENERATED"];

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

  if (invoice.archivedAt) {
    return NextResponse.json({ ok: false, error: "Archived invoices cannot be paid." }, { status: 409 });
  }

  const alreadyPaid = invoice.payments.find((payment) => payment.status === "PAID" && payment.amount >= invoice.depositDue);
  if (alreadyPaid) {
    return NextResponse.json({ ok: true, alreadyPaid: true, invoiceStatus: invoice.status, amount: alreadyPaid.amount, squarePaymentId: alreadyPaid.squarePaymentId });
  }

  if (blockedStatuses.includes(invoice.status) || !checkoutAllowedStatuses.includes(invoice.status)) {
    return NextResponse.json(
      { ok: false, error: `Invoice status ${invoice.status} is not eligible for deposit payment. Please approve the invoice before paying.` },
      { status: 409 }
    );
  }

  if (invoice.depositDue <= 0 || invoice.depositDue > invoice.total) {
    return NextResponse.json({ ok: false, error: "Invoice deposit amount is invalid. Please request manual review." }, { status: 409 });
  }

  const retainerSelected = body.retainerSelected ?? invoice.retainerSelected;
  const retainerTier = body.retainerTier ?? invoice.retainerTier;
  const retainerMonthlyAmount = retainerSelected ? body.retainerMonthlyAmount ?? invoice.retainerMonthlyAmount : null;
  const idempotencyKey = body.idempotencyKey || `${invoice.id}-${invoice.updatedAt.getTime()}`;
  const existingAttempt = await prisma.paymentRecord.findFirst({
    where: { idempotencyKey }
  }).catch(() => null);

  if (existingAttempt?.status === "PAID") {
    return NextResponse.json({ ok: true, alreadyPaid: true, amount: existingAttempt.amount, squarePaymentId: existingAttempt.squarePaymentId });
  }

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
      idempotencyKey,
      squarePaymentId: result.squarePaymentId,
      paymentMethod: "Square",
      metadata: { ...result, idempotencyKey } as object
    }
  }).catch(() => undefined);

  if (!result.ok) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        retainerSelected,
        retainerTier,
        retainerMonthlyAmount
      }
    }).catch(() => undefined);
    await prisma.siteLog.create({
      data: {
        severity: "ERROR",
        source: "payments",
        message: "Square deposit payment failed",
        metadata: { invoiceId: invoice.id, idempotencyKey, message: result.message, mode: result.mode }
      }
    }).catch(() => undefined);
    return NextResponse.json({ ...result, error: result.message || "Square payment failed" }, { status: 402 });
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "DEPOSIT_PAID",
      retainerSelected,
      retainerTier,
      retainerMonthlyAmount
    }
  }).catch(() => null);

  if (invoice.requestId) {
    await prisma.projectRequest.update({
      where: { id: invoice.requestId },
      data: { status: "DEPOSIT_PAID" }
    }).catch(() => undefined);
  }

  await prisma.siteLog.create({
    data: {
      source: "payments",
      message: "Deposit payment completed",
      metadata: { invoiceId: invoice.id, idempotencyKey, amount: invoice.depositDue, squarePaymentId: result.squarePaymentId }
    }
  }).catch(() => undefined);

  return NextResponse.json({ ...result, ok: true, amount: invoice.depositDue, invoice: updatedInvoice });
}
