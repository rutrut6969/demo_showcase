import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
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
  const payment = payload?.data?.object?.payment;
  const squarePaymentId = payment?.id as string | undefined;
  const status = mapSquarePaymentStatus(payment?.status);

  if (squarePaymentId && status) {
    const record = await prisma.paymentRecord
      .updateMany({
        where: { squarePaymentId },
        data: { status, metadata: payload }
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

  await prisma.siteLog.create({
    data: {
      source: "square",
      message: "Square webhook payload received",
      metadata: { eventType: payload?.type, squarePaymentId, status, payload }
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
