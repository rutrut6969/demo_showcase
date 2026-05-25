"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, FilePenLine, ShieldCheck, XCircle } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

const sampleInvoice = {
  id: "preview",
  invoiceNumber: "INV-2026-041",
  status: "Sent",
  clientName: "K&K Kustom Kreations",
  clientEmail: "client@example.com",
  projectSummary: "Custom vendor ecommerce platform inspired by Crafted Commerce.",
  scopeBreakdown: [
    "Premium storefront with product catalog and featured collections",
    "Square checkout and deposit workflow integration placeholder",
    "Admin dashboard for inventory, events, and lead management",
    "AI-assisted product upload concept and analytics event mapping"
  ],
  lineItems: [
    { description: "Discovery, UX direction, and platform architecture", quantity: 1, unitAmount: 180000 },
    { description: "Next.js storefront and demo-customized UI build", quantity: 1, unitAmount: 360000 },
    { description: "Prisma CRM, request, quote, and invoice workflows", quantity: 1, unitAmount: 280000 },
    { description: "Square payment/deposit integration setup", quantity: 1, unitAmount: 90000 }
  ],
  depositDue: 250000,
  total: 910000,
  retainerRecommendation: "Commerce Retainer starting at $350-500/month",
  timelineEstimate: "5-7 weeks",
  terms:
    "Deposit reserves production time and starts implementation after final scope approval. Remaining balance and managed platform retainer are handled according to the accepted proposal."
};

export function InvoiceView({ invoiceId }: { invoiceId: string }) {
  const [status, setStatus] = useState(sampleInvoice.status);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const invoice = { ...sampleInvoice, id: invoiceId };

  async function payDeposit() {
    setPaymentMessage("Processing Square-powered deposit placeholder...");
    const response = await fetch("/api/payments/square", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id, amount: invoice.depositDue })
    });
    const data = await response.json();
    setStatus("Deposit Paid");
    setPaymentMessage(data.message || "Deposit payment logged successfully.");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" /> Obsidian Systems LLC
          </Link>
          <Badge className="border-slate-200 bg-slate-100 text-slate-700">{status}</Badge>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">Custom project invoice</p>
                <h1 className="mt-3 text-3xl font-semibold">{invoice.invoiceNumber}</h1>
                <p className="mt-2 text-slate-600">{invoice.projectSummary}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-semibold">{invoice.clientName}</p>
                <p className="text-sm text-slate-500">{invoice.clientEmail}</p>
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-200 py-6 sm:grid-cols-3">
              <Info label="Total" value={formatCurrency(invoice.total)} />
              <Info label="Deposit due" value={formatCurrency(invoice.depositDue)} />
              <Info label="Timeline" value={invoice.timelineEstimate} />
            </div>

            <div className="py-6">
              <h2 className="text-xl font-semibold">Scope breakdown</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {invoice.scopeBreakdown.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[620px] w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <tr key={item.description} className="bg-slate-50">
                      <td className="rounded-l-lg px-3 py-3 font-medium">{item.description}</td>
                      <td className="px-3 py-3">{item.quantity}</td>
                      <td className="px-3 py-3">{formatCurrency(item.unitAmount)}</td>
                      <td className="rounded-r-lg px-3 py-3">{formatCurrency(item.quantity * item.unitAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold">Terms and disclaimer</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{invoice.terms}</p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Obsidian branded invoice</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This page is custom built inside the app while payment processing is Square-powered through the configured sandbox or production credentials.
              </p>
              <div className="mt-5 rounded-lg bg-slate-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Retainer recommendation</p>
                <p className="mt-2 font-semibold">{invoice.retainerRecommendation}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold">Client response</p>
              <div className="mt-4 grid gap-2">
                <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-transparent bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400" onClick={() => setStatus("Approved")}>
                  <CheckCircle2 className="h-4 w-4" /> Approve invoice
                </button>
                <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50" onClick={() => setStatus("Revision Requested")}>
                  <FilePenLine className="h-4 w-4" /> Request revision
                </button>
                <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100" onClick={() => setStatus("Denied")}>
                  <XCircle className="h-4 w-4" /> Deny invoice
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="font-semibold">Secure deposit payment</p>
              <p className="mt-2 text-sm text-slate-600">Square-powered payment form placeholder. Add Square Web Payments SDK credentials to activate card entry.</p>
              <Button className="mt-4 w-full" onClick={payDeposit}><CreditCard className="h-4 w-4" /> Pay {formatCurrency(invoice.depositDue)} deposit</Button>
              {paymentMessage ? <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{paymentMessage}</p> : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
