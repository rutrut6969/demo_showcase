import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";
import { createSquareCard, createSquareCustomer, createSquareSubscription } from "@/lib/square";

const createSchema = z.object({
  sourceId: z.string().min(1),
  billingZip: z.string().max(20).optional(),
  defaultCard: z.boolean().optional()
});

export async function GET() {
  const auth = await requireClientSession();
  if (auth.response) return auth.response;
  const cards = await prisma.savedPaymentMethod.findMany({
    where: { clientId: auth.session.clientId, disabledAt: null },
    orderBy: [{ defaultCard: "desc" }, { createdAt: "desc" }]
  });
  return NextResponse.json({ ok: true, cards: cards.map(safeCard) });
}

export async function POST(request: Request) {
  const auth = await requireClientSession();
  if (auth.response) return auth.response;
  const body = createSchema.parse(await request.json());
  const client = await prisma.client.findUnique({ where: { id: auth.session.clientId } });
  if (!client) return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });

  let squareCustomerId = client.squareCustomerId;
  if (!squareCustomerId) {
    const customer = await createSquareCustomer({
      email: client.email,
      givenName: client.name,
      companyName: client.businessName || undefined,
      referenceId: client.id
    });
    if (!customer.ok || !customer.squareCustomerId) {
      return NextResponse.json({ ok: false, error: customer.message || "Square customer could not be created." }, { status: 502 });
    }
    squareCustomerId = customer.squareCustomerId;
    await prisma.client.update({ where: { id: client.id }, data: { squareCustomerId } });
  }
  if (!squareCustomerId) {
    return NextResponse.json({ ok: false, error: "Square customer could not be resolved." }, { status: 502 });
  }

  const card = await createSquareCard({
    sourceId: body.sourceId,
    customerId: squareCustomerId,
    billingZip: body.billingZip,
    idempotencyKey: `card-${client.id}-${randomUUID()}`
  });
  if (!card.ok || !card.squareCardId || !card.last4) {
    return NextResponse.json({ ok: false, error: card.message || "Card could not be saved with Square." }, { status: 502 });
  }

  const existingCardCount = await prisma.savedPaymentMethod.count({ where: { clientId: client.id, disabledAt: null } });
  const makeDefault = body.defaultCard ?? existingCardCount === 0;
  if (makeDefault) {
    await prisma.savedPaymentMethod.updateMany({ where: { clientId: client.id }, data: { defaultCard: false } });
  }
  const saved = await prisma.savedPaymentMethod.create({
    data: {
      clientId: client.id,
      squareCustomerId,
      squareCardId: card.squareCardId,
      brand: card.brand,
      last4: card.last4,
      expMonth: card.expMonth,
      expYear: card.expYear,
      billingZip: card.billingZip || body.billingZip,
      defaultCard: makeDefault
    }
  });
  await startPendingRetainers(client.id, saved.squareCustomerId, saved.squareCardId);
  return NextResponse.json({ ok: true, card: safeCard(saved) });
}

async function startPendingRetainers(clientId: string, squareCustomerId: string, squareCardId: string) {
  const retainers = await prisma.retainer.findMany({
    where: { clientId, subscriptionStatus: "PENDING_SETUP", monthlyAmount: { gt: 0 } },
    take: 5
  });
  for (const retainer of retainers) {
    const subscription = await createSquareSubscription({
      customerId: squareCustomerId,
      cardId: squareCardId,
      monthlyAmount: retainer.monthlyAmount,
      idempotencyKey: `retainer-${retainer.id}-${randomUUID()}`
    });
    if (subscription.ok && subscription.squareSubscriptionId) {
      await prisma.retainer.update({
        where: { id: retainer.id },
        data: {
          subscriptionStatus: "ACTIVE",
          squareSubscriptionId: subscription.squareSubscriptionId,
          squareCustomerId,
          squareCardId,
          lastPaymentStatus: subscription.status || "ACTIVE",
          maintenanceNotes: appendNote(retainer.maintenanceNotes, "Square subscription created after customer saved a card.")
        }
      });
      await prisma.notificationRecord.create({
        data: {
          clientId,
          type: "retainer_started",
          subject: "Retainer subscription started",
          body: "A pending retainer subscription was started after the customer saved a card.",
          metadata: { retainerId: retainer.id, squareSubscriptionId: subscription.squareSubscriptionId }
        }
      }).catch(() => undefined);
    }
  }
}

function appendNote(existing: string | null | undefined, note: string) {
  const stamped = `${new Date().toISOString()} ${note}`;
  return existing ? `${existing}\n${stamped}` : stamped;
}

function safeCard(card: { id: string; brand: string | null; last4: string; expMonth: number | null; expYear: number | null; billingZip: string | null; defaultCard: boolean }) {
  return {
    id: card.id,
    brand: card.brand,
    last4: card.last4,
    expMonth: card.expMonth,
    expYear: card.expYear,
    billingZip: card.billingZip,
    defaultCard: card.defaultCard
  };
}
