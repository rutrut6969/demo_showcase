import { prisma } from "@/lib/prisma";
import { demoTemplates, retainerTiers } from "@/lib/data";
import { getSquareConfig } from "@/lib/square";

function money(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format((cents || 0) / 100);
}

function label(value: string | null | undefined) {
  return (value || "UNKNOWN").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export type AdminPortalData = Awaited<ReturnType<typeof getAdminPortalData>>;

export async function getAdminPortalData() {
  const empty = {
    dashboard: {
      newRequests: 0,
      pendingApprovals: 0,
      openInvoiceTotal: "$0",
      activeRetainers: 0,
      aiQuotes: 0,
      paidDeposits: 0
    },
    requests: [] as Array<Record<string, string>>,
    clients: [] as Array<Record<string, string>>,
    invoices: [] as Array<Record<string, string>>,
    payments: [] as Array<Record<string, string>>,
    projects: [] as Array<Record<string, string>>,
    retainers: retainerTiers.map((tier) => ({ name: tier.name, price: tier.price, status: "Configured plan", client: "Template", renewal: "N/A" })),
    demos: demoTemplates.map((demo) => ({ slug: demo.slug, name: demo.name, category: demo.type, visible: "Yes", package: demo.recommendedPackage, complexity: label(demo.complexity) })),
    analytics: [] as Array<Record<string, string>>,
    settings: [] as Array<Record<string, string>>,
    users: [] as Array<Record<string, string>>,
    logs: [] as Array<Record<string, string>>,
    activity: [] as string[],
    siteHealth: ["Database unavailable", "AI fallback-ready", "Square configuration unknown"]
  };

  try {
    const [
      requests,
      clients,
      invoices,
      payments,
      projects,
      retainers,
      demos,
      analytics,
      settings,
      users,
      logs,
      aiQuoteCount,
      newRequestCount,
      pendingApprovalCount,
      activeRetainerCount,
      paidDepositCount
    ] = await Promise.all([
      prisma.projectRequest.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { client: true, aiQuote: true, invoices: { include: { payments: true } } } }),
      prisma.client.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { projectRequests: true, invoices: true, projects: true } }),
      prisma.invoice.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { client: true, request: true, payments: true } }),
      prisma.paymentRecord.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { invoice: { include: { client: true, request: true } } } }),
      prisma.project.findMany({ take: 50, orderBy: { updatedAt: "desc" }, include: { client: true } }),
      prisma.retainer.findMany({ take: 50, orderBy: { updatedAt: "desc" }, include: { client: true, project: true } }),
      prisma.demoTemplate.findMany({ take: 100, orderBy: { name: "asc" } }),
      prisma.analyticsEvent.findMany({ take: 60, orderBy: { createdAt: "desc" } }),
      prisma.integrationSetting.findMany({ take: 100, orderBy: { key: "asc" } }),
      prisma.user.findMany({ take: 50, orderBy: { createdAt: "desc" }, include: { role: true } }),
      prisma.siteLog.findMany({ take: 50, orderBy: { createdAt: "desc" } }),
      prisma.aIQuote.count(),
      prisma.projectRequest.count({ where: { status: { in: ["NEW", "AI_QUOTED", "UNDER_REVIEW", "ADMIN_REVIEW_REQUESTED"] } } }),
      prisma.projectRequest.count({ where: { status: { in: ["AI_QUOTED", "UNDER_REVIEW", "ADMIN_REVIEW_REQUESTED", "CLIENT_ACCEPTED_ESTIMATE"] } } }),
      prisma.retainer.count({ where: { paymentStatus: "PAID" } }),
      prisma.paymentRecord.count({ where: { status: "PAID" } })
    ]);

    const openInvoiceTotal = invoices
      .filter((invoice) => !["PAID", "DEPOSIT_PAID", "CANCELLED"].includes(invoice.status))
      .reduce((sum, invoice) => sum + invoice.depositDue, 0);

    const square = getSquareConfig();
    const squareConfigured = Boolean(square.applicationId && square.locationId && square.accessToken);

    return {
      dashboard: {
        newRequests: newRequestCount,
        pendingApprovals: pendingApprovalCount,
        openInvoiceTotal: money(openInvoiceTotal),
        activeRetainers: activeRetainerCount,
        aiQuotes: aiQuoteCount,
        paidDeposits: paidDepositCount
      },
      requests: requests.map((request) => ({
        id: request.id,
        client: request.businessName || request.client?.businessName || request.name,
        demo: request.selectedDemo || "Custom",
        status: label(request.status),
        complexity: label(request.estimatedComplexity),
        estimate: request.aiQuote ? `${money(request.aiQuote.buildCostMin)}-${money(request.aiQuote.buildCostMax)}` : "Not generated",
        approver: request.assignedToId || "Unassigned"
      })),
      clients: clients.map((client) => ({
        id: client.id,
        name: client.businessName || client.name,
        email: client.email,
        phone: client.phone || "-",
        source: client.source || client.linkedDemoInterest || "-",
        requests: String(client.projectRequests.length),
        invoices: String(client.invoices.length),
        projects: String(client.projects.length),
        consent: client.marketingConsent ? "Yes" : "No"
      })),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoice: invoice.invoiceNumber,
        client: invoice.client?.businessName || invoice.client?.name || invoice.request?.businessName || invoice.request?.name || "Client",
        status: label(invoice.status),
        total: money(invoice.total),
        deposit: money(invoice.depositDue),
        paid: money(invoice.payments.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount, 0))
      })),
      payments: payments.map((payment) => ({
        id: payment.id,
        invoice: payment.invoice.invoiceNumber,
        client: payment.invoice.client?.businessName || payment.invoice.client?.name || payment.invoice.request?.businessName || "Client",
        status: label(payment.status),
        amount: money(payment.amount),
        method: payment.paymentMethod || "Square",
        squarePaymentId: payment.squarePaymentId || "-"
      })),
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        client: project.client?.businessName || project.client?.name || "-",
        stage: label(project.stage),
        demo: project.demoInterest || "-",
        updated: project.updatedAt.toLocaleDateString()
      })),
      retainers: retainers.length
        ? retainers.map((retainer) => ({
            name: retainer.tier,
            price: money(retainer.monthlyAmount),
            status: label(retainer.paymentStatus),
            client: retainer.client.businessName || retainer.client.name,
            renewal: retainer.renewalDate?.toLocaleDateString() || "N/A"
          }))
        : empty.retainers,
      demos: demos.length
        ? demos.map((demo) => ({ slug: demo.slug, name: demo.name, category: demo.category, visible: demo.visible ? "Yes" : "No", package: demo.recommendedPackage, complexity: label(demo.estimatedComplexity) }))
        : empty.demos,
      analytics: analytics.map((event) => ({
        event: event.eventName,
        demo: event.demoSlug || "-",
        source: event.sourcePage || "-",
        visitor: event.visitorId || "-",
        created: event.createdAt.toLocaleString()
      })),
      settings: settings.map((setting) => ({
        key: setting.key,
        enabled: setting.enabled ? "Enabled" : "Disabled",
        secret: setting.secret ? "Secret" : "Plain",
        value: setting.secret ? "Hidden" : setting.value || "-"
      })),
      users: users.map((user) => ({
        name: user.name,
        email: user.email,
        role: label(user.role.name),
        suspended: user.suspended ? "Yes" : "No",
        passwordChange: user.mustChangePassword ? "Required" : "Complete"
      })),
      logs: logs.map((log) => ({
        severity: label(log.severity),
        source: log.source,
        message: log.message,
        created: log.createdAt.toLocaleString()
      })),
      activity: logs.slice(0, 6).map((log) => `${log.source}: ${log.message}`),
      siteHealth: [
        "Database: connected",
        `AI: ${process.env.OPENAI_API_KEY ? "OpenAI configured" : "fallback quote mode"}`,
        `Square: ${squareConfigured ? `${square.environment} configured` : `${square.environment} not fully configured`}`,
        `Payments: ${paidDepositCount} paid record${paidDepositCount === 1 ? "" : "s"}`
      ]
    };
  } catch {
    return empty;
  }
}
