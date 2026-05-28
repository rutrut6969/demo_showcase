"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, GripVertical, Menu, Plus, Shield, X } from "lucide-react";
import type { RoleName } from "@prisma/client";
import { Badge, Button, StatCard } from "@/components/ui";
import { adminModules, approvalRules, demoTemplates, pipelineStages, requestStatuses, retainerTiers } from "@/lib/data";
import { cn } from "@/lib/utils";

type AdminUser = {
  name: string;
  email: string;
  role: RoleName;
};

const mockRequests = [
  { id: "REQ-1024", client: "K&K Kustom Kreations", demo: "Crafted Commerce", status: "AI Reviewed", complexity: "Moderate", estimate: "$4.9k-$9.6k", owner: "Admin" },
  { id: "REQ-1025", client: "Northwood Chiropractic", demo: "Northwood Chiropractic", status: "Under Review", complexity: "Moderate", estimate: "$6.4k-$12.2k", owner: "Owner" },
  { id: "REQ-1026", client: "Tech Rescue Co.", demo: "Obsidian Tech E.R.", status: "New", complexity: "High", estimate: "$11k-$24k", owner: "Owner" },
  { id: "REQ-1027", client: "BluePeak Realty", demo: "BluePeak Realty", status: "Client Accepted Estimate", complexity: "Moderate", estimate: "$6.8k-$13.4k", owner: "Checkout" },
  { id: "REQ-1028", client: "Evergreen Outdoor Living", demo: "Evergreen Outdoor Living", status: "Admin Review Requested", complexity: "Low", estimate: "$3.2k-$6.1k", owner: "Admin" }
];

const mockInvoices = [
  { id: "INV-2026-041", client: "K&K Kustom Kreations", status: "Admin Reviewed", total: "$8,900", deposit: "$2,500" },
  { id: "INV-2026-042", client: "Pete's Kitchen", status: "Sent", total: "$4,400", deposit: "$1,500" },
  { id: "INV-2026-043", client: "BluePeak Realty", status: "Revision Requested", total: "$7,800", deposit: "$2,000" }
];

export function AdminPortal({ user }: { user: AdminUser }) {
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
                <Button variant="secondary"><Download className="h-4 w-4" /> Export</Button>
                <Button><Plus className="h-4 w-4" /> New record</Button>
              </div>
            </div>

            <ModuleContent slug={moduleSlug} role={user.role} roleCapabilities={roleCapabilities} />
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

function ModuleContent({ slug, role, roleCapabilities }: { slug: string; role: RoleName; roleCapabilities: string[] }) {
  if (slug === "dashboard") return <Dashboard roleCapabilities={roleCapabilities} />;
  if (slug === "requests") return <RequestsPanel role={role} />;
  if (slug === "clients") return <CrmPanel />;
  if (slug === "invoices") return <InvoicesPanel />;
  if (slug === "pipeline") return <PipelinePanel />;
  if (slug === "demos") return <DemoManagementPanel />;
  if (slug === "ai-control") return <AiControlPanel />;
  if (slug === "feature-toggles") return <FeatureTogglesPanel />;
  if (slug === "retainers") return <RetainersPanel />;
  if (slug === "analytics") return <AnalyticsPanel />;
  return <GenericModule slug={slug} />;
}

function Dashboard({ roleCapabilities }: { roleCapabilities: string[] }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New requests" value="12" detail="4 came from demo CTAs this week." />
        <StatCard label="Pending approvals" value="7" detail="2 require Super Admin review." />
        <StatCard label="Invoices awaiting payment" value="$8.5k" detail="3 deposits open through Square." />
        <StatCard label="Active retainers" value="8" detail="Essential and Commerce plans monitored." />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DataPanel title="Recent activity">
          {["AI quote generated for Crafted Commerce", "Invoice viewed by Pete's Kitchen", "Role audit completed for Site Overseer", "Square payment placeholder logged"].map((item) => (
            <ActivityRow key={item} title={item} detail="Just now" />
          ))}
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
        <DataPanel title="Traffic analytics"><MetricList items={["Demo views: 1,248", "CTA clicks: 214", "Request conversion: 9.8%", "Top demo: Obsidian Tech E.R."]} /></DataPanel>
        <DataPanel title="Project pipeline"><MetricList items={["Lead: 9", "AI Quoted: 6", "Development: 3", "Retainer Active: 8"]} /></DataPanel>
        <DataPanel title="Site health"><MetricList items={["Frontend: healthy", "API: healthy", "AI: fallback-ready", "Square: sandbox placeholder"]} /></DataPanel>
      </div>
    </div>
  );
}

function RequestsPanel({ role }: { role: RoleName }) {
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
        rows={mockRequests.map((request) => [
          request.id,
          request.client,
          request.demo,
          request.status,
          request.complexity,
          request.estimate,
          canApprove(role, request.complexity) ? "You can approve" : request.owner
        ])}
      />
      <DataPanel title="Request workspace">
        <div className="grid gap-4 lg:grid-cols-3">
          {["AI estimate review", "Accepted estimates", "Manual review requests", "Pricing adjustment", "Updated checkout links", "Revision requests"].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/6 p-4">
              <p className="font-semibold">{item}</p>
              <p className="mt-2 text-sm text-slate-400">Ready for persisted records, final invoice approval, and resendable checkout links.</p>
            </div>
          ))}
        </div>
      </DataPanel>
    </div>
  );
}

function CrmPanel() {
  const filters = ["All leads", "Approved clients", "Past clients", "Retainer clients", "Ecommerce customers", "Abandoned quote requests", "Demo-interest category", "Location/service area", "Consent status"];
  const exports = ["Meta/Facebook Custom Audiences", "Google Ads Customer Match", "Email marketing", "CRM backups", "Lead reports", "Customer reports"];
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <DataPanel title="Client records">
        <MetricList items={["Name, business, email, phone, address/location", "Consent, prior requests, projects, invoices, retainers", "Notes, communication logs, uploaded assets", "Linked demo interest and project history"]} />
      </DataPanel>
      <DataPanel title="CSV export tools">
        <div className="grid gap-2">
          {exports.map((item) => <Button key={item} variant="secondary" className="justify-start"><Download className="h-4 w-4" /> {item}</Button>)}
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

function InvoicesPanel() {
  return (
    <div className="space-y-5">
      <ResponsiveTable title="Square-backed invoices" headers={["Invoice", "Client", "Status", "Total", "Deposit"]} rows={mockInvoices.map((invoice) => [invoice.id, invoice.client, invoice.status, invoice.total, invoice.deposit])} />
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

function RetainersPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {retainerTiers.map((tier) => (
        <DataPanel key={tier.name} title={tier.name}>
          <p className="text-2xl font-semibold text-white">{tier.price}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{tier.description}</p>
          <MetricList items={["Billing cycle", "Payment status", "Hosting status", "Managed domains", "Maintenance notes", "Square subscription status"]} />
        </DataPanel>
      ))}
    </div>
  );
}

function PipelinePanel() {
  return (
    <div className="overflow-x-auto pb-3 scrollbar-thin">
      <div className="grid min-w-[1180px] grid-cols-6 gap-3">
        {pipelineStages.map((stage, index) => (
          <div key={stage} className="min-h-[210px] rounded-lg border border-white/10 bg-white/6 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{stage}</p>
              <GripVertical className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-obsidian-950/70 p-3">
              <p className="text-sm font-semibold">Project {index + 1}</p>
              <p className="mt-2 text-xs text-slate-400">Drag-and-drop ready stage card.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoManagementPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {demoTemplates.map((demo) => (
        <div key={demo.slug} className="rounded-lg border border-white/10 bg-white/6 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{demo.name}</p>
              <p className="mt-1 text-sm text-slate-400">{demo.type}</p>
            </div>
            <Badge>{demo.complexity}</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">{demo.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {demo.features.slice(0, 3).map((feature) => <Badge key={feature}>{feature}</Badge>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function AiControlPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {["AI quote prompt", "Pricing rules", "Complexity scoring rules", "Quote output format", "AI proposal prompts", "Lead scoring prompt", "Manual override settings"].map((item) => (
        <DataPanel key={item} title={item}>
          <p className="text-sm text-slate-300">Editable control surface for owner-approved AI behavior. Changes should be audit logged and role restricted.</p>
        </DataPanel>
      ))}
    </div>
  );
}

function FeatureTogglesPanel() {
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

function AnalyticsPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {["Site traffic", "Demo popularity", "Request conversion rates", "AI quote acceptance rates", "Top-performing demos", "Client sources", "Revenue estimates", "Retainer metrics", "CTA clicks", "Funnel dropoff"].map((metric) => (
        <DataPanel key={metric} title={metric}>
          <p className="text-3xl font-semibold text-white">{Math.floor(Math.random() * 80) + 12}</p>
          <p className="mt-2 text-sm text-slate-400">Analytics event table ready for live tracking.</p>
        </DataPanel>
      ))}
    </div>
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

function ResponsiveTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <DataPanel title={title}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-[780px] w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="rounded-lg bg-white/6">
                {row.map((cell) => <td key={cell} className="px-3 py-3 text-slate-200 first:rounded-l-lg last:rounded-r-lg">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
