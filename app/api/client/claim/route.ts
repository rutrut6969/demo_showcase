import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClientUser } from "@/lib/client-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid claim request." }, { status: 400 });

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const invite = await prisma.clientPortalInvite.findUnique({ where: { tokenHash } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "This portal invite is invalid or expired." }, { status: 401 });
  }

  const client = await prisma.client.findUnique({ where: { id: invite.clientId } });
  if (!client) return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });

  const session = await createClientUser(client.id, client.email, parsed.data.password);
  await prisma.clientPortalInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
  await prisma.siteLog.create({
    data: { source: "client-portal", message: "Client portal account claimed", metadata: { clientId: client.id, invoiceId: invite.invoiceId } }
  }).catch(() => undefined);
  return NextResponse.json({ ok: true, session, redirectTo: "/client/payment-methods" });
}
