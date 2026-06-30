import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { cancelSquareSubscription } from "@/lib/square";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession("requests:view", _request);
  if (auth.response) return auth.response;
  const retainer = await prisma.retainer.findUnique({ where: { id: params.id } });
  if (!retainer) return NextResponse.json({ ok: false, error: "Retainer not found." }, { status: 404 });
  if (retainer.squareSubscriptionId) {
    const canceled = await cancelSquareSubscription(retainer.squareSubscriptionId);
    if (!canceled.ok) return NextResponse.json({ ok: false, error: canceled.message || "Square subscription could not be canceled." }, { status: 502 });
  }
  const updated = await prisma.retainer.update({
    where: { id: retainer.id },
    data: { subscriptionStatus: "CANCELED", paymentStatus: "FAILED", canceledAt: new Date(), maintenanceNotes: appendNote(retainer.maintenanceNotes, "Retainer canceled by admin.") }
  });
  await prisma.auditLog.create({
    data: { userId: auth.session?.id, action: "retainer_canceled", entityType: "Retainer", entityId: retainer.id, metadata: { squareSubscriptionId: retainer.squareSubscriptionId } }
  }).catch(() => undefined);
  return NextResponse.json({ ok: true, retainer: updated });
}

function appendNote(existing: string | null | undefined, note: string) {
  const stamped = `${new Date().toISOString()} ${note}`;
  return existing ? `${existing}\n${stamped}` : stamped;
}
