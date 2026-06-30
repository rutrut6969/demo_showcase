"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, GripVertical, Menu, Plus, Shield, X } from "lucide-react";
import type { RoleName } from "@prisma/client";
import { Badge, Button, StatCard } from "@/components/ui";
import type { AdminPortalData } from "@/lib/admin-data";
import { adminModules, approvalRules, pipelineStages, requestStatuses } from "@/lib/data";
import { cn } from "@/lib/utils";

type AdminUser = {
  name: string;
  email: string;
  role: RoleName;
};

export function AdminPortal({ user, data, actionToken }: { user: AdminUser; data: AdminPortalData; actionToken: string }) {
  const [moduleSlug, setModuleSlug] = useState("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeModule = adminModules.find((module) => module.slug === moduleSlug) || adminModules[0];
  const Icon = activeModule.icon;

  const roleCapabilities = useMemo(() => getRoleCapabilities(user.role), [user.role]);

  return (
    <main className="min-h-screen bg-obsidian-950 text-white">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 overflow-y-auto border-r border-white/10 bg-obsidian-900 p-4 scrollbar-thin xl:block">
          <AdminNav active={moduleSlug} onChoose={setModuleSlug} />
        </aside>
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-obsidian-950/82 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button className="focus-ring rounded-lg border border-white/12 bg-white/8 p-2 xl:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open admin navigation">
                  <Menu className="h-5 w-5" />
                </button>
                <Link href="/" className="focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Obsidian Admin Portal</p>
                  <p className="truncate text-xs text-slate-400">{activeModule.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="hidden border-obsidian-green/35 bg-obsidian-green/10 text-obsidian-green sm:inline-flex">
                  {user.role.replace("_", " ")}
                </Badge>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <Link href="/admin/logout" className="focus-ring rounded-lg border border-white/12 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  Logout
                </Link>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6">
            <div className="mb-5 rounded-lg border border-obsidian-purple/25 bg-obsidian-purple/10 p-4 text-sm leading-6 text-violet-50">
              <strong>Private operations console.</strong> Role rules are wired for Super Admin, Admin, and Site Overseer approval boundaries. Real access uses the seeded owner account once PostgreSQL is configured.
            </div>

            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <div className="flex items-center gap-2">
                  <Icon className="h-6 w-6 text-obsidian-green" />
                  <Badge>{activeModule.slug}</Badge>
                </div>
                <h1 className="mt-3 text-3xl font-semibold text-white">{activeModule.label}</h1>
                <p className="mt-2 max-w-3xl text-slate-300">{activeModule.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/api/exports/clients" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15">
                  <Download className="h-4 w-4" /> Export clients
                </Link>
                <Link href="/demos" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-transparent bg-obsidian-green px-4 py-2 text-sm font-semibold text-obsidian-950 shadow-lg shadow-obsidian-green/20 hover:bg-emerald-300">
                  <Plus className="h-4 w-4" /> New request
                </Link>
              </div>
            </div>

            <ModuleContent slug={moduleSlug} role={user.role} roleCapabilities={roleCapabilities} data={data} actionToken={actionToken} />
          </div>
        </section>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/72 backdrop-blur xl:hidden">
          <div className="h-full w-[88vw] max-w-sm overflow-y-auto border-r border-white/10 bg-obsidian-900 p-4 scrollbar-thin">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Admin modules</p>
              <button className="focus-ring rounded-lg p-2 hover:bg-white/10" aria-label="Close admin navigation" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminNav
              active={moduleSlug}
              onChoose={(slug) => {
                setModuleSlug(slug);
                setDrawerOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function AdminNav({ active, onChoose }: { active: string; onChoose: (slug: string) => void }) {
  return (
    <div>
      <Link href="/" className="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/6 p-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-obsidian-purple/20">
          <Shield className="h-5 w-5 text-obsidian-green" />
        </div>
        <div>
          <p className="text-sm font-semibold">Obsidian Systems</p>
          <p className="text-xs text-slate-400">Admin operations</p>
        </div>
      </Link>
      <div className="space-y-2">
        {adminModules.map((module) => (
          <button
            key={module.slug}
            onClick={() => onChoose(module.slug)}
            className={cn(
              "focus-ring flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
              active === module.slug ? "border-obsidian-green/35 bg-obsidian-green/12 text-white" : "border-white/8 bg-white/[0.045] text-slate-300 hover:bg-white/[0.08]"
            )}
          >
            <module.icon className="h-5 w-5 shrink-0" />
            <span className="truncate text-sm font-semibold">{module.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ModuleContent({ slug, role, roleCapabilities, data, actionToken }: { slug: string; role: RoleName; roleCapabilities: string[]; data: AdminPortalData; actionToken: string }) {
  if (slug === "dashboard") return <Dashboard roleCapabilities={roleCapabilities} data={data} />;
  if (slug === "requests") return <RequestsPanel role={role} data={data} />;
  if (slug === "clients") return <CrmPanel data={data} actionToken={actionToken} />;
  if (slug === "invoices") return <InvoicesPanel data={data} actionToken={actionToken} />;
  if (slug === "pipeline") return <PipelinePanel data={data} />;
  if (slug === "demos") return <DemoManagementPanel data={data} />;
  if (slug === "ai-control") return <AiControlPanel data={data} />;
  if (slug === "feature-toggles") return <FeatureTogglesPanel data={data} />;
  if (slug === "retainers") return <RetainersPanel data={data} />;
  if (slug === "analytics") return <AnalyticsPanel data={data} />;
  if (slug === "pricing") return <PricingPromotionsPanel data={data} actionToken={actionToken} />;
  if (slug === "users") return <UsersPanel data={data} />;
  if (slug === "logs" || slug === "audit") return <LogsPanel data={data} />;
  return <GenericModule slug={slug} />;
}

function Dashboard({ roleCapabilities, data }: { roleCapabilities: string[]; data: AdminPortalData }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New requests" value={String(data.dashboard.newRequests)} detail="Live request records needing attention." />
        <StatCard label="Pending approvals" value={String(data.dashboard.pendingApprovals)} detail="AI/manual review states awaiting staff." />
        <StatCard label="Invoices awaiting payment" value={data.dashboard.openInvoiceTotal} detail="Open deposit balance from invoices." />
        <StatCard label="Paid deposits" value={String(data.dashboard.paidDeposits)} detail="Persisted payment records marked paid." />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DataPanel title="Recent activity">
          {data.activity.length ? data.activity.map((item) => <ActivityRow key={item} title={item} detail="Latest log" />) : <EmptyState text="No activity has been logged yet." />}
        </DataPanel>
        <DataPanel title="Role capabilities">
          <div className="flex flex-wrap gap-2">
            {roleCapabilities.map((capability) => (
              <Badge key={capability}>{capability}</Badge>
            ))}
          </div>
        </DataPanel>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <DataPanel title="Traffic analytics"><MetricList items={[`Tracked events: ${data.analytics.length}`, `AI quotes: ${data.dashboard.aiQuotes}`, `Requests: ${data.requests.length}`, `Clients: ${data.clients.length}`]} /></DataPanel>
        <DataPanel title="Project pipeline"><MetricList items={[`Projects: ${data.projects.length}`, `Invoices: ${data.invoices.length}`, `Retainers: ${data.retainers.length}`, `Active retainers: ${data.dashboard.activeRetainers}`]} /></DataPanel>
        <DataPanel title="Site health"><MetricList items={data.siteHealth} /></DataPanel>
      </div>
    </div>
  );
}

function RequestsPanel({ role, data }: { role: RoleName; data: AdminPortalData }) {
  return (
    <div className="space-y-5">
      <DataPanel title="Complexity approval rules">
        <div className="grid gap-3 md:grid-cols-4">
          {approvalRules.map((rule) => (
            <div key={rule.complexity} className="rounded-lg border border-white/10 bg-white/6 p-4">
              <p className="font-semibold text-white">{rule.complexity}</p>
              <p className="mt-2 text-sm text-slate-300">{rule.approver}</p>
            </div>
          ))}
        </div>
      </DataPanel>
      <ResponsiveTable
        title="Incoming requests"
        headers={["Request", "Client", "Demo", "Status", "Complexity", "AI Estimate", "Approver"]}
        rows={data.requests.map((request) => [
          request.id,
          request.client,
          request.demo,
          request.status,
          request.complexity,
          request.estimate,
          canApprove(role, request.complexity) ? "You can approve" : request.approver
        ])}
      />
      <DataPanel title="Request workspace">
        {data.requests.length ? <MetricList items={data.requests.slice(0, 8).map((request) => `${request.client}: ${request.status} (${request.estimate})`)} /> : <EmptyState text="No project requests have been submitted yet." />}
      </DataPanel>
    </div>
  );
}

function CrmPanel({ data, actionToken }: { data: AdminPortalData; actionToken: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const filters = ["Marketing consent", "Source", "Selected demo", "Date range", "Abandoned checkout", "Paid client", "Retainer client"];
  const exports = [
    ["Consented clients", "/api/exports/clients?marketingConsent=true"],
    ["Abandoned checkout", "/api/exports/clients?abandonedCheckout=1"],
    ["Paid clients", "/api/exports/clients?paidClient=1"],
    ["Retainer clients", "/api/exports/clients?retainerClient=1"]
  ];

  async function updateClient(clientId: string, body: object, method = "PATCH") {
    setSavingId(clientId);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method,
        credentials: "include",
        cache: "no-store",
        headers: adminActionHeaders(actionToken),
        body: JSON.stringify(body)
      });
      if (response.status === 401) {
        window.location.href = "/admin/login?error=session";
        return;
      }
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Client action failed");
      setStatus("Client updated. Refreshing admin data...");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Client action failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <ResponsiveTable title="Client records" headers={["Client", "Email", "Phone", "Source", "Demo", "Requests", "Invoices", "Paid", "Consent", "Opt out", "Tags"]} rows={data.clients.map((client) => [client.name, client.email, client.phone, client.source, client.selectedDemo, client.requests, client.invoices, client.paid, client.consent, client.optOut, client.tags])} />
      <DataPanel title="Customer management">
        {status ? <p className="mb-3 rounded-lg border border-white/10 bg-white/8 p-3 text-sm text-slate-200">{status}</p> : null}
        <div className="grid gap-3">
          {data.clients.slice(0, 10).map((client) => (
            <div key={client.id} className="rounded-lg border border-white/10 bg-white/6 p-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <p className="font-semibold text-white">{client.name}</p>
                  <p className="text-xs text-slate-400">{client.email} · {client.source}</p>
                  <p className="mt-1 text-xs text-slate-500">Tags: {client.tags} · Segments: {client.segments}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={savingId === client.id} onClick={() => updateClient(client.id, { notes: client.notes === "-" ? "Reviewed by admin." : `${client.notes}\nReviewed by admin.` })}>Mark reviewed</Button>
                  <Button variant="secondary" disabled={savingId === client.id} onClick={() => updateClient(client.id, { marketingOptOut: true })}>Opt out</Button>
                  <Button variant="secondary" disabled={savingId === client.id} onClick={() => updateClient(client.id, { action: "archive" }, "DELETE")}>Archive</Button>
                  <Button variant="danger" disabled={savingId === client.id} onClick={() => updateClient(client.id, { action: client.paid === "Yes" ? "anonymize" : "delete" }, "DELETE")}>{client.paid === "Yes" ? "Anonymize" : "Delete"}</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DataPanel>
      <DataPanel title="CSV export tools">
        <div className="grid gap-2">
          {exports.map(([label, href]) => <Link key={label} href={href} className="focus-ring inline-flex min-h-11 items-center justify-start gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/16"><Download className="h-4 w-4" /> {label}</Link>)}
        </div>
      </DataPanel>
      <DataPanel title="Filters">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => <Badge key={filter}>{filter}</Badge>)}
        </div>
      </DataPanel>
    </div>
  );
}

function InvoicesPanel({ data, actionToken }: { data: AdminPortalData; actionToken: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function invoiceAction(invoiceId: string, action: string) {
    setSavingId(invoiceId);
    setStatus(null);
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/action`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: adminActionHeaders(actionToken),
        body: JSON.stringify({ action, note: `Admin selected ${action.replaceAll("_", " ")} from invoice panel.` })
      });
      if (response.status === 401) {
        window.location.href = "/admin/login?error=session";
        return;
      }
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Invoice action failed");
      setStatus("Invoice action saved. Refreshing admin data...");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Invoice action failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <ResponsiveTable title="Square-backed invoices" headers={["Invoice", "Client", "Status", "Total", "Deposit", "Paid", "Retainer", "Reviewed"]} rows={data.invoices.map((invoice) => [invoice.invoice, invoice.client, invoice.status, invoice.total, invoice.deposit, invoice.paid, invoice.retainer, invoice.reviewed])} />
      <DataPanel title="Invoice review controls">
        {status ? <p className="mb-3 rounded-lg border border-white/10 bg-white/8 p-3 text-sm text-slate-200">{status}</p> : null}
        <div className="grid gap-3">
          {data.invoices.map((invoice) => (
            <div key={invoice.id} className="rounded-lg border border-white/10 bg-white/6 p-4">
              <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-start">
                <div>
                  <p className="font-semibold text-white">{invoice.invoice} · {invoice.client}</p>
                  <p className="mt-1 text-sm text-slate-300">{invoice.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">Items: {invoice.items}</p>
                  <p className="mt-1 text-xs text-slate-500">Retainer: {invoice.retainer}</p>
                  <p className="mt-1 text-xs text-slate-500">Admin notes: {invoice.adminNotes}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={savingId === invoice.id} onClick={() => invoiceAction(invoice.id, "mark_reviewed")}>Mark reviewed</Button>
                  <Button variant="secondary" disabled={savingId === invoice.id} onClick={() => invoiceAction(invoice.id, "approve")}>Approve</Button>
                  <Button variant="secondary" disabled={savingId === invoice.id} onClick={() => invoiceAction(invoice.id, "revise")}>Revise</Button>
                  <Button variant="secondary" disabled={savingId === invoice.id} onClick={() => invoiceAction(invoice.id, "deny")}>Deny</Button>
                  <Button variant="secondary" disabled={savingId === invoice.id} onClick={() => invoiceAction(invoice.id, "cancel")}>Cancel</Button>
                  {invoice.canDeleteIncomplete === "Yes" ? <Button variant="danger" disabled={savingId === invoice.id} onClick={() => invoiceAction(invoice.id, "delete_incomplete")}>Delete incomplete</Button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DataPanel>
      <ResponsiveTable title="Payment records" headers={["Invoice", "Client", "Status", "Amount", "Method", "Square Payment"]} rows={data.payments.map((payment) => [payment.invoice, payment.client, payment.status, payment.amount, payment.method, payment.squarePaymentId])} />
      <DataPanel title="Invoice workflow">
        <div className="grid gap-3 md:grid-cols-4">
          {["AI Generated", "Admin Reviewed", "Sent / Viewed", "Approved / Deposit Paid"].map((step, index) => (
            <div key={step} className="rounded-lg border border-white/10 bg-white/6 p-4">
              <p className="text-xs text-obsidian-green">Step {index + 1}</p>
              <p className="mt-2 font-semibold">{step}</p>
              <p className="mt-2 text-sm text-slate-400">Custom branded invoice page with Square-powered payment form.</p>
            </div>
          ))}
        </div>
      </DataPanel>
    </div>
  );
}

function RetainersPanel({ data }: { data: AdminPortalData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {data.retainers.map((retainer) => (
        <DataPanel key={`${retainer.client}-${retainer.name}`} title={retainer.name}>
          <p className="text-2xl font-semibold text-white">{retainer.price}</p>
          <MetricList items={[`Client: ${retainer.client}`, `Status: ${retainer.status}`, `Renewal: ${retainer.renewal}`]} />
        </DataPanel>
      ))}
    </div>
  );
}

function PipelinePanel({ data }: { data: AdminPortalData }) {
  return (
    <div className="overflow-x-auto pb-3 scrollbar-thin">
      <div className="grid min-w-[1180px] grid-cols-6 gap-3">
        {pipelineStages.map((stage, index) => (
          <div key={stage} className="min-h-[210px] rounded-lg border border-white/10 bg-white/6 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{stage}</p>
              <GripVertical className="h-4 w-4 text-slate-500" />
            </div>
            {data.projects.filter((project) => project.stage === stage).slice(0, 3).map((project) => (
              <div key={project.id} className="mt-3 rounded-lg border border-white/10 bg-obsidian-950/70 p-3">
                <p className="text-sm font-semibold">{project.name}</p>
                <p className="mt-2 text-xs text-slate-400">{project.client}</p>
              </div>
            ))}
            {!data.projects.filter((project) => project.stage === stage).length ? <p className="mt-3 text-xs text-slate-500">No projects in this stage.</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoManagementPanel({ data }: { data: AdminPortalData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.demos.map((demo) => (
        <div key={demo.slug} className="rounded-lg border border-white/10 bg-white/6 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{demo.name}</p>
              <p className="mt-1 text-sm text-slate-400">{demo.category}</p>
            </div>
            <Badge>{demo.complexity}</Badge>
          </div>
          <MetricList items={[`Package: ${demo.package}`, `Visible: ${demo.visible}`]} />
        </div>
      ))}
    </div>
  );
}

function AiControlPanel({ data }: { data: AdminPortalData }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DataPanel title="AI quote status"><MetricList items={[`Generated quotes: ${data.dashboard.aiQuotes}`, ...data.siteHealth.filter((item) => item.startsWith("AI:"))]} /></DataPanel>
      <DataPanel title="AI quote review queue">{data.requests.length ? <MetricList items={data.requests.filter((request) => request.status.includes("AI") || request.status.includes("Review")).slice(0, 8).map((request) => `${request.client}: ${request.status}`)} /> : <EmptyState text="No AI quotes are awaiting review." />}</DataPanel>
    </div>
  );
}

function FeatureTogglesPanel({ data }: { data: AdminPortalData }) {
  const modules = ["Ecommerce", "Events", "CRM", "Repair Intake", "Medical Booking", "Restaurant Ordering", "AI Quotes", "Invoicing", "Retainers", "Analytics", "Client Portal"];
  return (
    <DataPanel title="Deployment profile modules">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module, index) => (
          <div key={module} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/6 p-4">
            <p className="font-semibold">{module}</p>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", index < 8 ? "bg-obsidian-green/15 text-obsidian-green" : "bg-white/10 text-slate-300")}>
              {index < 8 ? "Enabled" : "Planned"}
            </span>
          </div>
        ))}
      </div>
    </DataPanel>
  );
}

function AnalyticsPanel({ data }: { data: AdminPortalData }) {
  return (
    <ResponsiveTable title="Recent analytics events" headers={["Event", "Demo", "Source", "Visitor", "Created"]} rows={data.analytics.map((event) => [event.event, event.demo, event.source, event.visitor, event.created])} />
  );
}

function PricingPromotionsPanel({ data, actionToken }: { data: AdminPortalData; actionToken: string }) {
  const [pricingKey, setPricingKey] = useState(data.pricingRules[0]?.key || "basic_website");
  const [pricingBase, setPricingBase] = useState("50000");
  const [pricingMin, setPricingMin] = useState("50000");
  const [pricingRetainer, setPricingRetainer] = useState("20000");
  const [promotionId, setPromotionId] = useState("");
  const [promotionName, setPromotionName] = useState("$500 Website Launch Promotion");
  const [promotionDescription, setPromotionDescription] = useState("Limited promotional build price with optional discounted monthly care.");
  const [promotionActive, setPromotionActive] = useState(false);
  const [normalPrice, setNormalPrice] = useState("100000");
  const [promoPrice, setPromoPrice] = useState("50000");
  const [normalRetainer, setNormalRetainer] = useState("20000");
  const [promoRetainer, setPromoRetainer] = useState("10000");
  const [maxUses, setMaxUses] = useState("10");
  const [currentUses, setCurrentUses] = useState("0");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function savePricing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: adminActionHeaders(actionToken),
        body: JSON.stringify({
          key: pricingKey,
          basePrice: Number(pricingBase),
          minPrice: Number(pricingMin),
          retainerMin: pricingRetainer ? Number(pricingRetainer) : null
        })
      });
      if (!response.ok) throw new Error("Pricing update failed");
      setStatus("Pricing rule saved. Refreshing portal data...");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Pricing update failed");
    } finally {
      setSaving(false);
    }
  }

  async function savePromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        id: promotionId || undefined,
        name: promotionName,
        description: promotionDescription,
        active: promotionActive,
        normalPrice: Number(normalPrice),
        promoPrice: Number(promoPrice),
        normalRetainer: normalRetainer ? Number(normalRetainer) : null,
        promoRetainer: promoRetainer ? Number(promoRetainer) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        currentUses: currentUses ? Number(currentUses) : 0,
        startDate: startDate || null,
        endDate: endDate || null
      };
      const response = await fetch("/api/admin/promotions", {
        method: promotionId ? "PATCH" : "POST",
        credentials: "include",
        cache: "no-store",
        headers: adminActionHeaders(actionToken),
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Promotion save failed");
      setStatus("Promotion saved. Refreshing portal data...");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Promotion save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <ResponsiveTable
        title="Central pricing rules"
        headers={["Key", "Label", "Base", "Minimum", "Retainer", "Active"]}
        rows={data.pricingRules.map((rule) => [rule.key, rule.label, rule.basePrice, rule.minPrice, rule.retainer, rule.active])}
      />
      <ResponsiveTable
        title="Promotions"
        headers={["ID", "Name", "Active", "Normal", "Promo", "Retainer", "Slots", "Dates"]}
        rows={data.promotions.map((promotion) => [promotion.id, promotion.name, promotion.active, promotion.normalPrice, promotion.promoPrice, promotion.retainer, promotion.slots, promotion.dates])}
      />
      {status ? <p className="rounded-lg border border-white/10 bg-white/8 p-3 text-sm text-slate-200">{status}</p> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <DataPanel title="Edit pricing rule">
          <form onSubmit={savePricing} className="grid gap-3">
            <label className="grid gap-2 text-sm text-slate-300">
              Pricing rule
              <select value={pricingKey} onChange={(event) => setPricingKey(event.target.value)} className="rounded-lg border border-white/10 bg-obsidian-950 px-3 py-2 text-white">
                {data.pricingRules.map((rule) => <option key={rule.key} value={rule.key}>{rule.label}</option>)}
              </select>
            </label>
            <AdminInput label="Base price in cents" value={pricingBase} onChange={setPricingBase} />
            <AdminInput label="Minimum price in cents" value={pricingMin} onChange={setPricingMin} />
            <AdminInput label="Retainer minimum in cents" value={pricingRetainer} onChange={setPricingRetainer} />
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save pricing rule"}</Button>
          </form>
        </DataPanel>
        <DataPanel title="Create or edit promotion">
          <form onSubmit={savePromotion} className="grid gap-3">
            <AdminInput label="Promotion ID for edits" value={promotionId} onChange={setPromotionId} placeholder="Leave blank to create" />
            <AdminInput label="Name" value={promotionName} onChange={setPromotionName} />
            <label className="grid gap-2 text-sm text-slate-300">
              Description
              <textarea value={promotionDescription} onChange={(event) => setPromotionDescription(event.target.value)} className="min-h-20 rounded-lg border border-white/10 bg-obsidian-950 px-3 py-2 text-white" />
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input type="checkbox" checked={promotionActive} onChange={(event) => setPromotionActive(event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-obsidian-950 accent-obsidian-green" />
              Active promotion
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput label="Normal build cents" value={normalPrice} onChange={setNormalPrice} />
              <AdminInput label="Promo build cents" value={promoPrice} onChange={setPromoPrice} />
              <AdminInput label="Normal retainer cents" value={normalRetainer} onChange={setNormalRetainer} />
              <AdminInput label="Promo retainer cents" value={promoRetainer} onChange={setPromoRetainer} />
              <AdminInput label="Max uses" value={maxUses} onChange={setMaxUses} />
              <AdminInput label="Current uses" value={currentUses} onChange={setCurrentUses} />
              <AdminInput label="Start date" value={startDate} onChange={setStartDate} type="date" />
              <AdminInput label="End date" value={endDate} onChange={setEndDate} type="date" />
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : promotionId ? "Update promotion" : "Create promotion"}</Button>
          </form>
        </DataPanel>
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-lg border border-white/10 bg-obsidian-950 px-3 py-2 text-white placeholder:text-slate-600" />
    </label>
  );
}

function adminActionHeaders(actionToken: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${actionToken}`
  };
}

function UsersPanel({ data }: { data: AdminPortalData }) {
  return (
    <ResponsiveTable title="Admin users and roles" headers={["Name", "Email", "Role", "Suspended", "Password"]} rows={data.users.map((user) => [user.name, user.email, user.role, user.suspended, user.passwordChange])} />
  );
}

function LogsPanel({ data }: { data: AdminPortalData }) {
  return (
    <ResponsiveTable title="System logs" headers={["Severity", "Source", "Message", "Created"]} rows={data.logs.map((log) => [log.severity, log.source, log.message, log.created])} />
  );
}

function GenericModule({ slug }: { slug: string }) {
  const adminModule = adminModules.find((item) => item.slug === slug);
  const items =
    slug === "marketing"
      ? ["GA4 Measurement ID", "Google Tag Manager ID", "Meta Pixel ID", "ViewDemo", "RequestStarted", "RequestSubmitted", "AIQuoteGenerated", "InvoiceViewed", "InvoiceApproved", "DepositPaid", "ContactClicked"]
      : slug === "users"
        ? ["Create admin accounts", "Assign roles", "Trusted device system", "Login history", "Permission auditing", "MFA/2FA placeholder", "Account suspension", "Activity logs"]
        : slug === "client-portal"
          ? ["Client login", "Project progress", "Invoice downloads", "File sharing", "Revision requests", "Retainer support"]
          : ["Create", "Review", "Update", "Archive", "Audit", "Export"];
  return (
    <DataPanel title={adminModule?.label || "Module"}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded-lg border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-obsidian-green" />
              <p className="font-semibold">{item}</p>
            </div>
            <p className="mt-2 text-sm text-slate-400">Structured admin surface ready for database-backed actions.</p>
          </div>
        ))}
      </div>
    </DataPanel>
  );
}

function DataPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-white/10 bg-white/6 p-4 text-sm text-slate-400">{text}</p>;
}

function ResponsiveTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <DataPanel title={title}>
      {rows.length ? (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-[780px] w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>{headers.map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${index}-${row.join("-")}`} className="rounded-lg bg-white/6">
                  {row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`} className="px-3 py-3 text-slate-200 first:rounded-l-lg last:rounded-r-lg">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState text="No records found." />}
    </DataPanel>
  );
}

function ActivityRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 py-3 last:border-0">
      <p className="text-sm text-slate-200">{title}</p>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function MetricList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-slate-300">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-obsidian-green" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function getRoleCapabilities(role: RoleName) {
  if (role === "SUPER_ADMIN") return ["Full access", "Manage users", "API keys", "Delete/archive", "High complexity approvals", "AI settings"];
  if (role === "ADMIN") return ["View requests", "Approve low/moderate", "Manage clients", "Assign tasks", "Edit content", "Export reports"];
  return ["View requests", "Approve low", "Flag moderate/high", "View analytics", "Add internal notes", "Limited exports"];
}

function canApprove(role: RoleName, complexity: string) {
  if (role === "SUPER_ADMIN") return true;
  if (role === "ADMIN") return complexity === "Low" || complexity === "Moderate";
  return complexity === "Low";
}
