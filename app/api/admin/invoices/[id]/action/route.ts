import { NextResponse } from "next/server";
import { z } from "zod";
import type { InvoiceStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const actionSchema = z.object({
  action: z.enum(["approve", "revise", "deny", "cancel", "mark_reviewed", "delete_incomplete"]),
  note: z.string().optional()
});

const incompleteStatuses: InvoiceStatus[] = ["DRAFT", "AI_GENERATED", "SENT", "VIEWED", "APPROVED", "REVISION_REQUESTED", "DENIED"];

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminSession("requests:view", request);
  if (auth.response) return auth.response;
  const body = actionSchema.parse(await request.json());

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { payments: true }
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const paidAmount = invoice.payments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount, 0);
  const hasPayments = invoice.payments.length > 0;
  const hasPaidDeposit = paidAmount > 0 || invoice.status === "DEPOSIT_PAID" || invoice.status === "PAID";

  if (body.action === "delete_incomplete") {
    if (hasPaidDeposit) {
      return NextResponse.json({ error: "Paid invoices cannot be deleted or archived as incomplete checkout." }, { status: 409 });
    }
    if (!incompleteStatuses.includes(invoice.status) && !invoice.payments.some((payment) => payment.status === "FAILED")) {
      return NextResponse.json({ error: "Only incomplete checkout invoices can be deleted or archived." }, { status: 409 });
    }

    if (hasPayments) {
      const archived = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "CANCELLED",
          archivedAt: new Date(),
          cancelledAt: new Date(),
          adminNotes: appendNote(invoice.adminNotes, body.note || "Archived incomplete checkout with non-paid payment history.")
        }
      });
      await audit(auth.session?.id, "invoice_archived_incomplete", invoice.id, { note: body.note, hadPayments: hasPayments });
      return NextResponse.json({ invoice: archived, archived: true });
    }

    await prisma.invoice.delete({ where: { id: invoice.id } });
    await audit(auth.session?.id, "invoice_deleted_incomplete", invoice.id, { note: body.note });
    return NextResponse.json({ deleted: true });
  }

  const statusByAction: Record<Exclude<typeof body.action, "delete_incomplete">, InvoiceStatus> = {
    approve: "APPROVED",
    revise: "REVISION_REQUESTED",
    deny: "DENIED",
    cancel: "CANCELLED",
    mark_reviewed: "ADMIN_REVIEWED"
  };

  if (hasPaidDeposit && (body.action === "cancel" || body.action === "deny")) {
    return NextResponse.json({ error: "Paid invoices cannot be cancelled or denied from this control." }, { status: 409 });
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: statusByAction[body.action],
      reviewedAt: body.action === "mark_reviewed" ? new Date() : invoice.reviewedAt,
      approvedAt: body.action === "approve" ? new Date() : invoice.approvedAt,
      cancelledAt: body.action === "cancel" ? new Date() : invoice.cancelledAt,
      adminNotes: appendNote(invoice.adminNotes, body.note)
    }
  });
  await audit(auth.session?.id, `invoice_${body.action}`, invoice.id, { note: body.note, previousStatus: invoice.status, nextStatus: updated.status });

  return NextResponse.json({ invoice: updated });
}

function appendNote(existing: string | null | undefined, note?: string) {
  if (!note) return existing;
  const stamped = `${new Date().toISOString()} ${note}`;
  return existing ? `${existing}\n${stamped}` : stamped;
}

async function audit(userId: string | undefined, action: string, entityId: string, metadata: object) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: "Invoice",
      entityId,
      metadata
    }
  }).catch(() => undefined);
}
