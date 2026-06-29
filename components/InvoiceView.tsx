"use client";

import { useEffect, useRef, useState } from "react";
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
    "Custom Square Web Payments checkout and deposit workflow",
    "Operations dashboard for inventory, events, and lead management",
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

type InvoicePayload = typeof sampleInvoice & {
  selectedDemo?: string;
};

type SquareConfig = {
  environment: "sandbox" | "production";
  applicationId: string | null;
  locationId: string | null;
  afterpayEnabled: boolean;
};

declare global {
  interface Window {
    Square?: {
      payments(applicationId: string, locationId: string): {
        card(): Promise<{ attach(selector: string): Promise<void>; tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }> }>;
        afterpayClearpay?: (options: { amount: string; currencyCode: string }) => Promise<{ attach(selector: string): Promise<void>; tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }> }>;
      };
    };
  }
}

export function InvoiceView({ invoiceId }: { invoiceId: string }) {
  const [status, setStatus] = useState(sampleInvoice.status);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [invoice, setInvoice] = useState<InvoicePayload>({ ...sampleInvoice, id: invoiceId });
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const [squareReady, setSquareReady] = useState(false);
  const [afterpayReady, setAfterpayReady] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const cardRef = useRef<{ tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }> } | null>(null);
  const afterpayRef = useRef<{ tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }> } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInvoice() {
      if (invoiceId.startsWith("local-")) return;
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) return;
      const data = await response.json();
      if (!active || !data.invoice) return;
      setInvoice({
        id: data.invoice.id,
        invoiceNumber: data.invoice.invoiceNumber,
        status: data.invoice.status,
        clientName: data.invoice.client?.businessName || data.invoice.client?.name || data.invoice.request?.businessName || "Project client",
        clientEmail: data.invoice.client?.email || data.invoice.request?.email || "client@example.com",
        projectSummary: data.invoice.projectSummary,
        scopeBreakdown: data.invoice.scopeBreakdown,
        lineItems: data.invoice.lineItems,
        depositDue: data.invoice.depositDue,
        total: data.invoice.total,
        retainerRecommendation: data.invoice.retainerRecommendation || "Essential Retainer starting at $200/month",
        timelineEstimate: data.invoice.timelineEstimate || "Manual review pending",
        terms: data.invoice.terms,
        selectedDemo: data.invoice.request?.selectedDemo
      });
      setStatus(data.invoice.status);
    }

    loadInvoice().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [invoiceId]);

  useEffect(() => {
    let active = true;
    fetch("/api/payments/square")
      .then((response) => response.json())
      .then((config: SquareConfig) => {
        if (active) setSquareConfig(config);
      })
      .catch(() => {
        if (active) setPaymentError("Square configuration could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!squareConfig?.applicationId || !squareConfig.locationId) return;
    const config = squareConfig;
    const applicationId = squareConfig.applicationId;
    const locationId = squareConfig.locationId;
    let active = true;

    async function initializeSquare() {
      try {
        await loadSquareScript(config.environment);
        if (!active || !window.Square) return;
        const payments = window.Square.payments(applicationId, locationId);
        const card = await payments.card();
        await card.attach("#square-card-container");
        cardRef.current = card;
        setSquareReady(true);

        if (config.afterpayEnabled && payments.afterpayClearpay) {
          try {
            const afterpay = await payments.afterpayClearpay({ amount: (invoice.depositDue / 100).toFixed(2), currencyCode: "USD" });
            await afterpay.attach("#square-afterpay-container");
            afterpayRef.current = afterpay;
            setAfterpayReady(true);
          } catch {
            setAfterpayReady(false);
          }
        }
      } catch (error) {
        setPaymentError(error instanceof Error ? error.message : "Square payment form failed to initialize.");
      }
    }

    initializeSquare();
    return () => {
      active = false;
    };
  }, [invoice.depositDue, squareConfig]);

  async function payDeposit(method: "card" | "afterpay" = "card") {
    if (!termsAccepted) {
      setPaymentError("Please acknowledge the estimate disclaimer and checkout terms before continuing.");
      return;
    }
    const paymentSource = method === "afterpay" ? afterpayRef.current : cardRef.current;
    if (!paymentSource) {
      setPaymentError("The selected payment method is not available yet.");
      return;
    }

    setProcessingPayment(true);
    setPaymentError(null);
    setPaymentMessage("Tokenizing payment securely with Square...");
    const tokenResult = await paymentSource.tokenize();
    if (tokenResult.status !== "OK" || !tokenResult.token) {
      setProcessingPayment(false);
      setPaymentMessage(null);
      setPaymentError(tokenResult.errors?.map((error) => error.message).filter(Boolean).join(" ") || "Square could not tokenize this payment method.");
      return;
    }

    setPaymentMessage("Processing deposit with Square...");
    const response = await fetch("/api/payments/square", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id, sourceId: tokenResult.token, idempotencyKey: crypto.randomUUID() })
    });
    const data = await response.json();
    setProcessingPayment(false);
    if (!response.ok || data.ok === false) {
      setPaymentMessage(null);
      setPaymentError(data.error || data.message || "Square payment failed.");
      return;
    }
    setStatus("DEPOSIT_PAID");
    setPaymentMessage(data.alreadyPaid ? "This deposit was already paid." : "Deposit payment completed successfully.");
  }

  async function respondToInvoice(nextStatus: "APPROVED" | "REVISION_REQUESTED" | "DENIED") {
    setPaymentError(null);
    if (invoice.id.startsWith("local-")) {
      setStatus(nextStatus);
      return;
    }
    const response = await fetch(`/api/invoices/${invoice.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) {
      setPaymentError("Could not save your invoice response. Please try again.");
      return;
    }
    setStatus(nextStatus);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Obsidian Systems LLC
          </Link>
          <Badge className="shrink-0 border-emerald-400/30 bg-emerald-400/10 text-emerald-200">{status}</Badge>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-4 min-w-0 rounded-lg border border-violet-200 bg-white p-4 shadow-sm sm:mb-6 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 sm:text-sm">AI estimate checkout</p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">Review your Obsidian Systems project checkout</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This estimate is AI-generated and may be adjusted after manual review depending on scope, integrations, content, timeline, and technical requirements.
          </p>
        </div>
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
          <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
            <div className="flex min-w-0 flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 sm:text-sm">Custom project checkout</p>
                <h1 className="mt-3 break-words text-2xl font-semibold leading-tight sm:text-3xl">{invoice.invoiceNumber}</h1>
                <p className="mt-2 break-words text-sm leading-6 text-slate-600 sm:text-base">{invoice.projectSummary}</p>
                {invoice.selectedDemo ? <p className="mt-2 text-sm font-semibold text-slate-500">Selected style: {invoice.selectedDemo}</p> : null}
              </div>
              <div className="min-w-0 text-left sm:text-right">
                <p className="break-words font-semibold">{invoice.clientName}</p>
                <p className="break-all text-sm text-slate-500">{invoice.clientEmail}</p>
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-200 py-6 sm:grid-cols-3">
              <Info label="Estimated build" value={formatCurrency(invoice.total)} />
              <Info label="Deposit due" value={formatCurrency(invoice.depositDue)} />
              <Info label="Timeline" value={invoice.timelineEstimate} />
            </div>

            <div className="py-6">
              <h2 className="text-xl font-semibold">Scope breakdown</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {invoice.scopeBreakdown.map((item) => (
                  <li key={item} className="flex min-w-0 gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
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
            <div className="grid gap-3 sm:hidden">
              {invoice.lineItems.map((item) => (
                <div key={item.description} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-medium">{item.description}</p>
                    <p className="shrink-0 font-semibold">{formatCurrency(item.quantity * item.unitAmount)}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500">
                    <span>Qty {item.quantity}</span>
                    <span className="text-right">Unit {formatCurrency(item.unitAmount)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold">Terms and disclaimer</p>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">{invoice.terms}</p>
            </div>
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Obsidian branded invoice</p>
              </div>
              <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                This page is custom built inside the app while payment processing is Square-powered through the configured sandbox or production credentials.
              </p>
              <div className="mt-5 rounded-lg bg-slate-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Retainer recommendation</p>
                <p className="mt-2 break-words font-semibold">{invoice.retainerRecommendation}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="font-semibold">Client response</p>
              <div className="mt-4 grid gap-2">
                <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-transparent bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400" onClick={() => respondToInvoice("APPROVED")}>
                  <CheckCircle2 className="h-4 w-4" /> Approve invoice
                </button>
                <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50" onClick={() => respondToInvoice("REVISION_REQUESTED")}>
                  <FilePenLine className="h-4 w-4" /> Request revision
                </button>
                <button className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100" onClick={() => respondToInvoice("DENIED")}>
                  <XCircle className="h-4 w-4" /> Deny invoice
                </button>
              </div>
            </div>

            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="font-semibold">Secure deposit payment</p>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">Card details are collected by Square Web Payments SDK inside this custom checkout. Secret Square credentials never enter the browser.</p>
              <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-500" />
                <span className="min-w-0 break-words">I acknowledge this AI-generated estimate may change after manual review.</span>
              </label>
              {squareConfig?.applicationId && squareConfig.locationId ? (
                <>
                  <div id="square-card-container" className="mt-4 rounded-lg border border-slate-200 bg-white p-3" />
                  <Button loading={processingPayment} disabled={!squareReady} className="mt-4 w-full" onClick={() => payDeposit("card")}><CreditCard className="h-4 w-4" /> Pay {formatCurrency(invoice.depositDue)} deposit</Button>
                  {squareConfig.afterpayEnabled ? (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold">Afterpay / Clearpay</p>
                      <div id="square-afterpay-container" className="mt-3" />
                      <Button loading={processingPayment} disabled={!afterpayReady} variant="secondary" className="mt-3 w-full" onClick={() => payDeposit("afterpay")}>Pay with Afterpay</Button>
                      {!afterpayReady ? <p className="mt-2 text-xs text-slate-500">Afterpay is not available for this account, amount, currency, or location.</p> : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Square Web Payments is not configured. Add frontend Square application and location IDs to enable custom checkout.</p>
              )}
              <button className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => respondToInvoice("REVISION_REQUESTED")}>
                Request Manual Review
              </button>
              {paymentMessage ? <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{paymentMessage}</p> : null}
              {paymentError ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{paymentError}</p> : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function loadSquareScript(environment: "sandbox" | "production") {
  return new Promise<void>((resolve, reject) => {
    if (window.Square) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = environment === "production" ? "https://web.squarecdn.com/v1/square.js" : "https://sandbox.web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Square Web Payments SDK."));
    document.head.appendChild(script);
  });
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold">{value}</p>
    </div>
  );
}
