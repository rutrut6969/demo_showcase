import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireClientSession();
  if (auth.response) return auth.response;
  const retainers = await prisma.retainer.findMany({
    where: { clientId: auth.session.clientId },
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json({
    ok: true,
    retainers: retainers.map((retainer) => ({
      id: retainer.id,
      tier: retainer.tier,
      monthlyAmount: retainer.monthlyAmount,
      billingCycle: retainer.billingCycle,
      paymentStatus: retainer.paymentStatus,
      subscriptionStatus: retainer.subscriptionStatus,
      nextBillingDate: retainer.nextBillingDate,
      failedPaymentCount: retainer.failedPaymentCount,
      lastPaymentStatus: retainer.lastPaymentStatus,
      lastFailureReason: retainer.lastFailureReason,
      canceledAt: retainer.canceledAt,
      hasSavedCard: Boolean(retainer.squareCardId)
    }))
  });
}
