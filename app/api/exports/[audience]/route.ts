import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { audience: string } }) {
  const auth = await requireAdminSession("clients:manage");
  if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url);
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const marketingConsent = searchParams.get("marketingConsent");
  const source = searchParams.get("source");
  const selectedDemo = searchParams.get("selectedDemo");
  const abandonedCheckout = searchParams.get("abandonedCheckout") === "1";
  const paidClient = searchParams.get("paidClient") === "1";
  const retainerClient = searchParams.get("retainerClient") === "1";

  const clients = await prisma.client.findMany({
    take: 500,
    where: {
      archivedAt: null,
      deletedAt: null,
      ...(marketingConsent === "true" ? { marketingConsent: true, marketingOptOut: false } : {}),
      ...(marketingConsent === "false" ? { OR: [{ marketingConsent: false }, { marketingOptOut: true }] } : {}),
      ...(source ? { source } : {}),
      ...(selectedDemo ? { OR: [{ selectedDemo }, { linkedDemoInterest: selectedDemo }] } : {}),
      ...(createdFrom || createdTo
        ? {
            createdAt: {
              ...(createdFrom ? { gte: new Date(createdFrom) } : {}),
              ...(createdTo ? { lte: new Date(createdTo) } : {})
            }
          }
        : {}),
      ...(abandonedCheckout
        ? {
            invoices: {
              some: {
                status: { in: ["DRAFT", "AI_GENERATED", "SENT", "VIEWED", "APPROVED", "REVISION_REQUESTED", "DENIED"] },
                payments: { none: { status: "PAID" } }
              }
            }
          }
        : {}),
      ...(paidClient ? { invoices: { some: { payments: { some: { status: "PAID" } } } } } : {}),
      ...(retainerClient ? { retainers: { some: { paymentStatus: "PAID" } } } : {})
    },
    orderBy: { createdAt: "desc" },
    include: { invoices: { include: { payments: true } }, retainers: true }
  }).catch(() => []);

  const rows = [
    ["name", "businessName", "email", "phone", "marketingConsent", "marketingOptOut", "source", "selectedDemo", "tags", "segments", "utmSource", "utmCampaign", "utmMedium", "landingPage", "createdAt", "paidClient", "retainerClient"],
    ...clients.map((client) => [
      client.name,
      client.businessName || "",
      client.email,
      client.phone || "",
      String(client.marketingConsent),
      String(client.marketingOptOut),
      client.source || "",
      client.selectedDemo || client.linkedDemoInterest || "",
      client.tags.join("|"),
      client.segments.join("|"),
      client.utmSource || "",
      client.utmCampaign || "",
      client.utmMedium || "",
      client.landingPage || "",
      client.createdAt.toISOString(),
      String(client.invoices.some((invoice) => invoice.payments.some((payment) => payment.status === "PAID"))),
      String(client.retainers.some((retainer) => retainer.paymentStatus === "PAID"))
    ])
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${params.audience}-export.csv"`
    }
  });
}
