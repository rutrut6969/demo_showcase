import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  businessName: z.string().nullable().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  segments: z.array(z.string()).optional(),
  marketingConsent: z.boolean().optional(),
  marketingOptOut: z.boolean().optional(),
  linkedDemoInterest: z.string().nullable().optional(),
  selectedDemo: z.string().nullable().optional()
});

const actionSchema = z.object({
  action: z.enum(["archive", "restore", "delete", "anonymize"])
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession("clients:manage", _request);
  if (auth.response) return auth.response;
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { invoices: { include: { payments: true } }, projectRequests: true, retainers: true, projects: true }
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json({ client });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession("clients:manage", request);
  if (auth.response) return auth.response;
  const body = updateSchema.parse(await request.json());
  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      ...body,
      ...(body.marketingConsent === true ? { marketingConsentAt: new Date(), marketingOptOut: false, marketingOptOutAt: null } : {}),
      ...(body.marketingOptOut === true ? { marketingConsent: false, marketingOptOutAt: new Date() } : {})
    }
  });
  await audit(auth.session?.id, "client_updated", client.id, { fields: Object.keys(body) });
  return NextResponse.json({ client });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession("clients:manage", request);
  if (auth.response) return auth.response;
  const body = actionSchema.default({ action: "archive" }).parse(await request.json().catch(() => ({ action: "archive" })));
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: { invoices: { include: { payments: true } } }
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const hasPaidInvoice = client.invoices.some((invoice) => invoice.status === "PAID" || invoice.status === "DEPOSIT_PAID" || invoice.payments.some((payment) => payment.status === "PAID"));

  if (body.action === "restore") {
    const restored = await prisma.client.update({ where: { id: client.id }, data: { archivedAt: null, deletedAt: null } });
    await audit(auth.session?.id, "client_restored", client.id, {});
    return NextResponse.json({ client: restored });
  }

  if (body.action === "delete" && !hasPaidInvoice) {
    await prisma.client.delete({ where: { id: client.id } });
    await audit(auth.session?.id, "client_deleted", client.id, { hardDeleted: true });
    return NextResponse.json({ deleted: true });
  }

  if (body.action === "anonymize" || (body.action === "delete" && hasPaidInvoice)) {
    const anonymized = await prisma.client.update({
      where: { id: client.id },
      data: {
        name: "Archived Client",
        businessName: null,
        email: `archived-${client.id}@example.invalid`,
        phone: null,
        address: null,
        notes: "Anonymized because paid invoice history must be retained.",
        marketingConsent: false,
        marketingOptOut: true,
        marketingOptOutAt: new Date(),
        tags: [],
        segments: [],
        archivedAt: new Date(),
        deletedAt: new Date(),
        anonymizedAt: new Date()
      }
    });
    await audit(auth.session?.id, "client_anonymized", client.id, { hadPaidInvoice: hasPaidInvoice });
    return NextResponse.json({ client: anonymized, anonymized: true });
  }

  const archived = await prisma.client.update({ where: { id: client.id }, data: { archivedAt: new Date() } });
  await audit(auth.session?.id, "client_archived", client.id, { hadPaidInvoice: hasPaidInvoice });
  return NextResponse.json({ client: archived, archived: true });
}

async function audit(userId: string | undefined, action: string, entityId: string, metadata: object) {
  await prisma.auditLog.create({
    data: { userId, action, entityType: "Client", entityId, metadata }
  }).catch(() => undefined);
}
