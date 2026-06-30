import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";
import { disableSquareCard } from "@/lib/square";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireClientSession();
  if (auth.response) return auth.response;
  const card = await prisma.savedPaymentMethod.findFirst({ where: { id: params.id, clientId: auth.session.clientId, disabledAt: null } });
  if (!card) return NextResponse.json({ ok: false, error: "Saved card not found." }, { status: 404 });
  await prisma.savedPaymentMethod.updateMany({ where: { clientId: auth.session.clientId }, data: { defaultCard: false } });
  const updated = await prisma.savedPaymentMethod.update({ where: { id: card.id }, data: { defaultCard: true } });
  return NextResponse.json({ ok: true, card: { id: updated.id, last4: updated.last4, defaultCard: updated.defaultCard } });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireClientSession();
  if (auth.response) return auth.response;
  const card = await prisma.savedPaymentMethod.findFirst({ where: { id: params.id, clientId: auth.session.clientId, disabledAt: null } });
  if (!card) return NextResponse.json({ ok: false, error: "Saved card not found." }, { status: 404 });
  await disableSquareCard(card.squareCardId).catch(() => undefined);
  await prisma.savedPaymentMethod.update({ where: { id: card.id }, data: { disabledAt: new Date(), defaultCard: false } });
  return NextResponse.json({ ok: true, removed: true });
}
