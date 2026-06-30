import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSquareWebhookSignatureKey } from "@/lib/square";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature") || "";
  const signatureKey = getSquareWebhookSignatureKey();
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/square/sync`;

  if (signatureKey && !verifySquareSignature(notificationUrl, rawBody, signature, signatureKey)) {
    return NextResponse.json({ ok: false, error: "Invalid Square webhook signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload?.type as string | undefined;
  const object = payload?.data?.object;
  const payment = object?.payment;
  const subscription = object?.subscription;
  const squareSubscriptionId = subscription?.id as string | undefined;
  const squarePaymentId = payment?.id as string | undefined;
  const status = mapSquarePaymentStatus(payment?.status);

  if (squarePaymentId && status) {
    const record = await prisma.paymentRecord
      .updateMany({
        where: { squarePaymentId },
        data: { status, metadata: sanitizedPaymentMetadata(eventType, payment) }
      })
      .catch(() => ({ count: 0 }));

    if (record.count > 0) {
      const paymentRecord = await prisma.paymentRecord.findFirst({ where: { squarePaymentId }, include: { invoice: true } }).catch(() => null);
      if (paymentRecord) {
        await prisma.invoice.update({
          where: { id: paymentRecord.invoiceId },
          data: { status: status === "PAID" ? "DEPOSIT_PAID" : status === "REFUNDED" ? "CANCELLED" : paymentRecord.invoice.status }
        }).catch(() => undefined);
      }
    }
  }

  if (squareSubscriptionId) {
    await syncRetainerSubscription(squareSubscriptionId, eventType, subscription);
  }

  const invoice = object?.invoice;
  const invoiceSubscriptionId = invoice?.subscription_id as string | undefined;
  if (invoiceSubscriptionId) {
    await syncRetainerInvoice(invoiceSubscriptionId, eventType, invoice);
  }

  if (squarePaymentId && payment?.customer_id) {
    await syncRetainerPayment(payment.customer_id, eventType, payment);
  }

  await prisma.siteLog.create({
    data: {
      source: "square",
      message: "Square webhook payload received",
      metadata: { eventType, squarePaymentId, squareSubscriptionId, status }
    }
  }).catch(() => undefined);
  return NextResponse.json({ ok: true, synced: true });
}

function verifySquareSignature(notificationUrl: string, rawBody: string, signature: string, signatureKey: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", signatureKey).update(notificationUrl + rawBody).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

function mapSquarePaymentStatus(status: unknown) {
  if (status === "COMPLETED") return "PAID";
  if (status === "APPROVED") return "AUTHORIZED";
  if (status === "PENDING") return "PENDING";
  if (status === "CANCELED" || status === "FAILED") return "FAILED";
  if (status === "REFUNDED") return "REFUNDED";
  return null;
}

async function syncRetainerSubscription(squareSubscriptionId: string, eventType: string | undefined, subscription: any) {
  const subscriptionStatus = mapSubscriptionStatus(subscription?.status, eventType);
  await prisma.retainer.updateMany({
    where: { squareSubscriptionId },
    data: {
      subscriptionStatus,
      lastPaymentStatus: subscription?.charged_through_date ? "CURRENT" : undefined,
      nextBillingDate: subscription?.charged_through_date ? new Date(subscription.charged_through_date) : undefined,
      canceledAt: subscriptionStatus === "CANCELED" ? new Date() : undefined
    }
  }).catch(() => undefined);

  if (subscriptionStatus === "CANCELED") {
    const retainer = await prisma.retainer.findFirst({ where: { squareSubscriptionId } }).catch(() => null);
    if (retainer) {
      await createRetainerNotification(retainer.clientId, "retainer_canceled", "Retainer canceled", "Square reported this retainer subscription was canceled.", { retainerId: retainer.id, squareSubscriptionId });
    }
  }
}

async function syncRetainerInvoice(squareSubscriptionId: string, eventType: string | undefined, invoice: any) {
  const failure = eventType?.includes("payment_failed") || invoice?.status === "PAYMENT_FAILED";
  const paid = eventType?.includes("payment_made") || invoice?.status === "PAID";
  const retainer = await prisma.retainer.findFirst({ where: { squareSubscriptionId } }).catch(() => null);
  if (!retainer) return;

  if (failure) {
    await prisma.retainer.update({
      where: { id: retainer.id },
      data: {
        subscriptionStatus: "PAST_DUE",
        paymentStatus: "FAILED",
        lastPaymentStatus: "FAILED",
        lastFailureReason: invoice?.payment_requests?.[0]?.computed_amount_money ? "Square reported a failed invoice payment." : "Retainer payment failed.",
        failedPaymentCount: { increment: 1 }
      }
    }).catch(() => undefined);
    await createRetainerNotification(retainer.clientId, "retainer_payment_failed", "Retainer payment failed", "A monthly retainer payment failed or was declined. Updated payment details may be needed.", { retainerId: retainer.id, squareSubscriptionId });
  }

  if (paid) {
    await prisma.retainer.update({
      where: { id: retainer.id },
      data: { subscriptionStatus: "ACTIVE", paymentStatus: "PAID", lastPaymentStatus: "PAID", lastFailureReason: null }
    }).catch(() => undefined);
    await createRetainerNotification(retainer.clientId, "retainer_payment_succeeded", "Retainer payment received", "A monthly retainer payment was received successfully.", { retainerId: retainer.id, squareSubscriptionId });
  }
}

async function syncRetainerPayment(squareCustomerId: string, eventType: string | undefined, payment: any) {
  const retainer = await prisma.retainer.findFirst({
    where: { squareCustomerId, subscriptionStatus: { in: ["ACTIVE", "PAST_DUE", "PENDING_SETUP"] } },
    orderBy: { updatedAt: "desc" }
  }).catch(() => null);
  if (!retainer) return;

  const status = mapSquarePaymentStatus(payment?.status);
  if (status === "FAILED") {
    await prisma.retainer.update({
      where: { id: retainer.id },
      data: {
        subscriptionStatus: "PAST_DUE",
        paymentStatus: "FAILED",
        lastPaymentStatus: "FAILED",
        lastFailureReason: payment?.card_details?.status || "Square payment failed.",
        failedPaymentCount: { increment: 1 }
      }
    }).catch(() => undefined);
    await createRetainerNotification(retainer.clientId, "retainer_payment_failed", "Retainer payment failed", "Square reported a failed or declined payment for this retainer.", { retainerId: retainer.id, squarePaymentId: payment?.id });
  }

  if (status === "PAID" && eventType?.startsWith("payment.")) {
    await prisma.retainer.update({
      where: { id: retainer.id },
      data: { subscriptionStatus: "ACTIVE", paymentStatus: "PAID", lastPaymentStatus: "PAID", lastFailureReason: null }
    }).catch(() => undefined);
  }
}

function mapSubscriptionStatus(status: unknown, eventType: string | undefined) {
  if (eventType?.includes("canceled") || status === "CANCELED") return "CANCELED";
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "PAUSED") return "PAUSED";
  if (status === "PENDING") return "PENDING_SETUP";
  return typeof status === "string" ? status : "PENDING_SETUP";
}

function sanitizedPaymentMetadata(eventType: string | undefined, payment: any) {
  return {
    eventType,
    squarePaymentId: payment?.id,
    status: payment?.status,
    customerId: payment?.customer_id,
    receiptNumber: payment?.receipt_number,
    amountMoney: payment?.amount_money,
    createdAt: payment?.created_at,
    updatedAt: payment?.updated_at
  };
}

async function createRetainerNotification(clientId: string, type: string, subject: string, body: string, metadata: Record<string, unknown>) {
  await prisma.notificationRecord.create({
    data: { clientId, type, subject, body, metadata: metadata as Prisma.InputJsonValue }
  }).catch(() => undefined);
}
