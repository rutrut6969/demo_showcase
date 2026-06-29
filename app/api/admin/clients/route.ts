import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const clientSchema = z.object({
  name: z.string().min(1),
  businessName: z.string().nullable().optional(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  segments: z.array(z.string()).default([]),
  marketingConsent: z.boolean().default(false),
  marketingOptOut: z.boolean().default(false),
  linkedDemoInterest: z.string().nullable().optional(),
  selectedDemo: z.string().nullable().optional()
});

export async function GET(request: Request) {
  const auth = await requireAdminSession("clients:manage");
  if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "1";
  const clients = await prisma.client.findMany({
    take: 100,
    where: includeArchived ? undefined : { archivedAt: null, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { invoices: true, projectRequests: true, retainers: true }
  }).catch(() => []);
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("clients:manage");
  if (auth.response) return auth.response;
  const data = clientSchema.parse(await request.json());
  const client = await prisma.client.create({
    data: {
      ...data,
      marketingConsentAt: data.marketingConsent ? new Date() : null,
      marketingOptOutAt: data.marketingOptOut ? new Date() : null
    }
  });
  await audit(auth.session?.id, "client_created", client.id, { email: client.email });
  return NextResponse.json({ client });
}

async function audit(userId: string | undefined, action: string, entityId: string, metadata: object) {
  await prisma.auditLog.create({
    data: { userId, action, entityType: "Client", entityId, metadata }
  }).catch(() => undefined);
}
