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
  retainerSelected: false,
  retainerTier: "Commerce Retainer",
  retainerMonthlyAmount: 35000,
  timelineEstimate: "5-7 weeks",
  terms:
    "Deposit reserves production time and starts implementation after final scope approval. Remaining balance and managed platform retainer are handled according to the accepted proposal."
};

type InvoicePayload = typeof sampleInvoice & {
  selectedDemo?: string;
  retainerSelected?: boolean;
  retainerTier?: string | null;
  retainerMonthlyAmount?: number | null;
  payments?: Array<{ amount: number; status: string; squarePaymentId?: string | null }>;
};

type SquareConfig = {
  environment: "sandbox" | "production";
  applicationId: string | null;
  locationId: string | null;
  afterpayEnabled: boolean;
};

type CheckoutStep = "REVIEW" | "APPROVAL" | "PAYMENT" | "CONFIRMATION";

const payableStatuses = ["APPROVED"];
const paidStatuses = ["DEPOSIT_PAID", "PAID"];
const closedStatuses = ["DENIED", "REVISION_REQUESTED", "CANCELLED"];

function initialStepForStatus(status: string): CheckoutStep {
  if (paidStatuses.includes(status)) return "CONFIRMATION";
  if (payableStatuses.includes(status)) return "PAYMENT";
  return "REVIEW";
}

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
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(initialStepForStatus(sampleInvoice.status));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [invoice, setInvoice] = useState<InvoicePayload>({ ...sampleInvoice, id: invoiceId });
  const [squareConfig, setSquareConfig] = useState<SquareConfig | null>(null);
  const [squareConfigLoaded, setSquareConfigLoaded] = useState(false);
  const [squareReady, setSquareReady] = useState(false);
  const [squareInitializing, setSquareInitializing] = useState(false);
  const [afterpayReady, setAfterpayReady] = useState(false);
  const [approving, setApproving] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedRetainer, setSelectedRetainer] = useState(Boolean(sampleInvoice.retainerSelected));
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const paymentSectionRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<{ tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }> } | null>(null);
  const afterpayRef = useRef<{ tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }> } | null>(null);
  const isApproved = payableStatuses.includes(status);
  const isPaid = paidStatuses.includes(status);
  const isClosed = closedStatuses.includes(status);
  const projectLineItems = invoice.lineItems.filter((item) => !/deposit|retainer|monthly services/i.test(item.description));
  const remainingBalance = Math.max(0, invoice.total - invoice.depositDue);
  const selectedRetainerAmount = selectedRetainer ? invoice.retainerMonthlyAmount : null;

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
        retainerSelected: data.invoice.retainerSelected,
        retainerTier: data.invoice.retainerTier,
        retainerMonthlyAmount: data.invoice.retainerMonthlyAmount,
        timelineEstimate: data.invoice.timelineEstimate || "Manual review pending",
        terms: data.invoice.terms,
        selectedDemo: data.invoice.request?.selectedDemo,
        payments: data.invoice.payments
      });
      setStatus(data.invoice.status);
      setCheckoutStep(initialStepForStatus(data.invoice.status));
      setSelectedRetainer(Boolean(data.invoice.retainerSelected));
      const paidDeposit = data.invoice.payments?.find((payment: { amount: number; status: string }) => payment.status === "PAID");
      setPaidAmount(paidDeposit?.amount || null);
    }

    loadInvoice().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [invoiceId]);

  useEffect(() => {
    if (checkoutStep !== "PAYMENT" || !isApproved) return;
    let active = true;
    setSquareConfigLoaded(false);
    fetch("/api/payments/square")
      .then((response) => response.json())
      .then((config: SquareConfig) => {
        if (active) {
          setSquareConfig(config);
          setSquareConfigLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setSquareConfigLoaded(true);
          setPaymentError("Square configuration could not be loaded. Please request manual review.");
        }
      });
    return () => {
      active = false;
    };
  }, [checkoutStep, isApproved]);

  useEffect(() => {
    if (checkoutStep !== "PAYMENT" || !isApproved) return;
    setSquareReady(false);
    setAfterpayReady(false);
    cardRef.current = null;
    afterpayRef.current = null;
    if (!squareConfigLoaded) return;
    if (!squareConfig?.applicationId || !squareConfig.locationId) {
      setPaymentError("Square Web Payments is not configured. Request manual review or add Square frontend credentials.");
      return;
    }
    const config = squareConfig;
    const applicationId = squareConfig.applicationId;
    const locationId = squareConfig.locationId;
    let active = true;

    async function initializeSquare() {
      try {
        setSquareInitializing(true);
        setPaymentError(null);
        await loadSquareScript(config.environment);
        if (!active || !window.Square) return;
        const payments = window.Square.payments(applicationId, locationId);
        const card = await payments.card();
        await card.attach("#square-card-container");
        cardRef.current = card;
        setSquareReady(true);
        setSquareInitializing(false);

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
        setSquareInitializing(false);
        setPaymentError(error instanceof Error ? error.message : "Square payment form failed to initialize.");
      }
    }

    initializeSquare();
    return () => {
      active = false;
    };
  }, [checkoutStep, invoice.depositDue, isApproved, squareConfig, squareConfigLoaded]);

  function moveToStep(step: CheckoutStep) {
    setCheckoutStep(step);
    if (step === "PAYMENT") {
      window.setTimeout(() => paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }

  async function payDeposit(method: "card" | "afterpay" = "card") {
    if (!isApproved) {
      setPaymentError("Approve the invoice before paying the deposit.");
      return;
    }
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
      body: JSON.stringify({
        invoiceId: invoice.id,
        sourceId: tokenResult.token,
        idempotencyKey: crypto.randomUUID(),
        retainerSelected: selectedRetainer,
        retainerTier: invoice.retainerTier,
        retainerMonthlyAmount: selectedRetainer ? invoice.retainerMonthlyAmount : null
      })
    });
    const data = await response.json();
    setProcessingPayment(false);
    if (!response.ok || data.ok === false) {
      setPaymentMessage(null);
      setPaymentError(data.error || data.message || "Square payment failed.");
      return;
    }
    setStatus("DEPOSIT_PAID");
    setPaidAmount(data.amount || invoice.depositDue);
    setPaymentMessage(data.alreadyPaid ? "This deposit was already paid." : "Deposit payment completed successfully.");
    moveToStep("CONFIRMATION");
  }

  async function respondToInvoice(nextStatus: "APPROVED" | "REVISION_REQUESTED" | "DENIED") {
    setApproving(nextStatus === "APPROVED");
    setPaymentError(null);
    setPaymentMessage(null);
    if (invoice.id.startsWith("local-")) {
      setStatus(nextStatus);
      setApproving(false);
      if (nextStatus === "APPROVED") {
        setPaymentMessage("Invoice approved. Continue with secure deposit payment.");
        moveToStep("PAYMENT");
      }
      return;
    }
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.ok !== true || !data.invoice) {
        throw new Error(data?.error || "Could not save your invoice response. Please try again.");
      }
      setStatus(data.invoice.status);
      setInvoice((current) => ({ ...current, ...data.invoice }));
      setPaymentMessage(data.message || (nextStatus === "APPROVED" ? "Invoice approved. Continue with secure deposit payment." : "Your response has been saved."));
      if (data.nextStep === "PAYMENT") {
        moveToStep("PAYMENT");
      } else {
        moveToStep("APPROVAL");
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Could not save your invoice response. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 pb-28 text-slate-950 lg:pb-0">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Obsidian Systems LLC
          </Link>
          <Badge className="shrink-0 border-emerald-400/30 bg-emerald-400/10 text-emerald-200">{status}</Badge>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <StepIndicator current={checkoutStep} status={status} />
        {paymentMessage ? <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{paymentMessage}</p> : null}
        {paymentError ? <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800">{paymentError}</p> : null}

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
          <div className="min-w-0 space-y-4">
            {checkoutStep === "REVIEW" ? (
              <InvoiceReview
                invoice={invoice}
                projectLineItems={projectLineItems}
                remainingBalance={remainingBalance}
                onContinue={() => moveToStep("APPROVAL")}
              />
            ) : null}

            {checkoutStep === "APPROVAL" ? (
              <ApprovalStep
                status={status}
                isClosed={isClosed}
                approving={approving}
                onApprove={() => respondToInvoice("APPROVED")}
                onRevision={() => respondToInvoice("REVISION_REQUESTED")}
                onDeny={() => respondToInvoice("DENIED")}
              />
            ) : null}

            {checkoutStep === "PAYMENT" ? (
              <div ref={paymentSectionRef}>
                <PaymentStep
                  invoice={invoice}
                  selectedRetainer={selectedRetainer}
                  selectedRetainerAmount={selectedRetainerAmount}
                  setSelectedRetainer={setSelectedRetainer}
                  remainingBalance={remainingBalance}
                  squareConfigLoaded={squareConfigLoaded}
                  squareConfigured={Boolean(squareConfig?.applicationId && squareConfig.locationId)}
                  squareInitializing={squareInitializing}
                  squareReady={squareReady}
                  afterpayReady={afterpayReady}
                  afterpayEnabled={Boolean(squareConfig?.afterpayEnabled)}
                  termsAccepted={termsAccepted}
                  setTermsAccepted={setTermsAccepted}
                  processingPayment={processingPayment}
                  onPay={payDeposit}
                  onManualReview={() => respondToInvoice("REVISION_REQUESTED")}
                />
              </div>
            ) : null}

            {checkoutStep === "CONFIRMATION" ? <ConfirmationStep invoice={invoice} paidAmount={paidAmount || invoice.depositDue} selectedRetainer={selectedRetainer} /> : null}
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Obsidian branded invoice</p>
              </div>
              <p className="mt-3 break-words text-sm leading-6 text-slate-600">Payment is Square-powered through configured sandbox or production credentials.</p>
              <div className="mt-5 rounded-lg bg-slate-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Due today</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(invoice.depositDue)}</p>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Project total</p>
                <p className="mt-2 font-semibold">{formatCurrency(invoice.total)}</p>
                <p className="mt-1 text-sm text-slate-600">Remaining after deposit: {formatCurrency(remainingBalance)}</p>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Retainer</p>
                <p className="mt-2 break-words font-semibold">{invoice.retainerRecommendation}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedRetainer ? "Selected for follow-up setup" : "Not selected for checkout"}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <MobileActionBar
        step={checkoutStep}
        invoice={invoice}
        approving={approving}
        processingPayment={processingPayment}
        squareReady={squareReady}
        termsAccepted={termsAccepted}
        isClosed={isClosed}
        onReview={() => moveToStep("APPROVAL")}
        onApprove={() => respondToInvoice("APPROVED")}
        onPay={() => payDeposit("card")}
      />
    </main>
  );
}

function StepIndicator({ current, status }: { current: CheckoutStep; status: string }) {
  const steps: CheckoutStep[] = ["REVIEW", "APPROVAL", "PAYMENT", "CONFIRMATION"];
  const currentIndex = steps.indexOf(current);
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${index <= currentIndex ? "border-emerald-500 bg-emerald-500 text-slate-950" : "border-slate-300 bg-white text-slate-500"}`}>
              {index + 1}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{step.toLowerCase()}</p>
            </div>
            {index < steps.length - 1 ? <div className={`hidden h-px flex-1 sm:block ${index < currentIndex ? "bg-emerald-500" : "bg-slate-200"}`} /> : null}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-600">Status: <span className="font-semibold text-slate-950">{status}</span></p>
    </div>
  );
}

function InvoiceReview({
  invoice,
  projectLineItems,
  remainingBalance,
  onContinue
}: {
  invoice: InvoicePayload;
  projectLineItems: InvoicePayload["lineItems"];
  remainingBalance: number;
  onContinue: () => void;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
      <div className="flex min-w-0 flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 sm:text-sm">AI estimate checkout</p>
          <h1 className="mt-3 break-words text-2xl font-semibold leading-tight sm:text-3xl">Review your Obsidian Systems project checkout</h1>
          <p className="mt-2 break-words text-sm leading-6 text-slate-600">{invoice.projectSummary}</p>
          {invoice.selectedDemo ? <p className="mt-2 text-sm font-semibold text-slate-500">Selected style: {invoice.selectedDemo}</p> : null}
        </div>
        <div className="min-w-0 text-left sm:text-right">
          <p className="break-words font-semibold">{invoice.clientName}</p>
          <p className="break-all text-sm text-slate-500">{invoice.clientEmail}</p>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 py-6 sm:grid-cols-3">
        <Info label="Project total" value={formatCurrency(invoice.total)} />
        <Info label="Deposit due today" value={formatCurrency(invoice.depositDue)} />
        <Info label="Remaining balance" value={formatCurrency(remainingBalance)} />
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

      <div className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Project line items</p>
        {projectLineItems.map((item) => (
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

      <button className="mt-5 hidden w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 lg:block" onClick={onContinue}>
        Continue to approval
      </button>
    </div>
  );
}

function ApprovalStep({
  status,
  isClosed,
  approving,
  onApprove,
  onRevision,
  onDeny
}: {
  status: string;
  isClosed: boolean;
  approving: boolean;
  onApprove: () => void;
  onRevision: () => void;
  onDeny: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Approval</p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight">Approve invoice</h1>
      {isClosed ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          This invoice response is saved as {status}. Payment is unavailable unless Obsidian Systems sends an updated invoice.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-600">Approval unlocks the secure deposit payment step. You can also request a revision or deny this invoice.</p>
          <div className="mt-5 grid gap-3">
            <button className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-transparent bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60" disabled={approving} onClick={onApprove}>
              <CheckCircle2 className="h-4 w-4" /> {approving ? "Approving..." : "Approve invoice"}
            </button>
            <button className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50" disabled={approving} onClick={onRevision}>
              <FilePenLine className="h-4 w-4" /> Request revision
            </button>
            <button className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100" disabled={approving} onClick={onDeny}>
              <XCircle className="h-4 w-4" /> Deny invoice
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentStep({
  invoice,
  selectedRetainer,
  selectedRetainerAmount,
  setSelectedRetainer,
  remainingBalance,
  squareConfigLoaded,
  squareConfigured,
  squareInitializing,
  squareReady,
  afterpayReady,
  afterpayEnabled,
  termsAccepted,
  setTermsAccepted,
  processingPayment,
  onPay,
  onManualReview
}: {
  invoice: InvoicePayload;
  selectedRetainer: boolean;
  selectedRetainerAmount: number | null;
  setSelectedRetainer: (selected: boolean) => void;
  remainingBalance: number;
  squareConfigLoaded: boolean;
  squareConfigured: boolean;
  squareInitializing: boolean;
  squareReady: boolean;
  afterpayReady: boolean;
  afterpayEnabled: boolean;
  termsAccepted: boolean;
  setTermsAccepted: (accepted: boolean) => void;
  processingPayment: boolean;
  onPay: (method?: "card" | "afterpay") => void;
  onManualReview: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Secure deposit payment</p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight">Pay deposit</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info label="Project total" value={formatCurrency(invoice.total)} />
        <Info label="Due today" value={formatCurrency(invoice.depositDue)} />
        <Info label="Remaining" value={formatCurrency(remainingBalance)} />
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="font-semibold">Optional monthly retainer</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{invoice.retainerRecommendation}</p>
        <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <input type="checkbox" checked={selectedRetainer} onChange={(event) => setSelectedRetainer(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-500" />
          <span className="min-w-0 break-words">
            {selectedRetainerAmount ? `Select ${invoice.retainerTier || "retainer"} for follow-up setup at ${formatCurrency(selectedRetainerAmount)}/month.` : "Select retainer for follow-up setup. It will not be charged as part of today's deposit."}
          </span>
        </label>
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-500" />
        <span className="min-w-0 break-words">I acknowledge this AI-generated estimate may change after manual review.</span>
      </label>

      {!squareConfigLoaded ? <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Loading secure payment configuration...</p> : null}
      {squareConfigLoaded && !squareConfigured ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Square Web Payments is not configured. Request manual review or add frontend Square application and location IDs.</p> : null}
      {squareConfigured ? (
        <>
          <div id="square-card-container" className="mt-4 min-h-[90px] rounded-lg border border-slate-200 bg-white p-3" />
          {squareInitializing ? <p className="mt-2 text-sm text-slate-500">Initializing Square card form...</p> : null}
          <Button loading={processingPayment} disabled={!squareReady || !termsAccepted} className="mt-4 min-h-12 w-full" onClick={() => onPay("card")}><CreditCard className="h-4 w-4" /> Pay {formatCurrency(invoice.depositDue)} deposit</Button>
          {afterpayEnabled ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold">Afterpay / Clearpay</p>
              <div id="square-afterpay-container" className="mt-3" />
              <Button loading={processingPayment} disabled={!afterpayReady || !termsAccepted} variant="secondary" className="mt-3 w-full bg-slate-950 text-white" onClick={() => onPay("afterpay")}>Pay with Afterpay</Button>
              {!afterpayReady ? <p className="mt-2 text-xs text-slate-500">Afterpay is not available for this account, amount, currency, or location.</p> : null}
            </div>
          ) : null}
        </>
      ) : null}

      <button className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onManualReview}>
        Request Manual Review
      </button>
    </div>
  );
}

function ConfirmationStep({ invoice, paidAmount, selectedRetainer }: { invoice: InvoicePayload; paidAmount: number; selectedRetainer: boolean }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Payment successful</p>
      <h1 className="mt-3 text-2xl font-semibold leading-tight">Deposit received</h1>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info label="Amount paid" value={formatCurrency(paidAmount)} />
        <Info label="Invoice" value={invoice.invoiceNumber} />
        <Info label="Status" value="Deposit paid" />
      </div>
      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p className="font-semibold text-slate-950">Next steps</p>
        <p className="mt-2">Obsidian Systems will review the approved scope, confirm any remaining details, and follow up about the production schedule.</p>
        {selectedRetainer ? <p className="mt-2">Your optional retainer selection is saved for follow-up setup and was not charged as a one-time build cost.</p> : null}
      </div>
      <Link href="/" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto">
        Back to homepage
      </Link>
    </div>
  );
}

function MobileActionBar({
  step,
  invoice,
  approving,
  processingPayment,
  squareReady,
  termsAccepted,
  isClosed,
  onReview,
  onApprove,
  onPay
}: {
  step: CheckoutStep;
  invoice: InvoicePayload;
  approving: boolean;
  processingPayment: boolean;
  squareReady: boolean;
  termsAccepted: boolean;
  isClosed: boolean;
  onReview: () => void;
  onApprove: () => void;
  onPay: () => void;
}) {
  if (step === "CONFIRMATION" || isClosed) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{step.toLowerCase()}</p>
          <p className="truncate text-sm font-semibold text-slate-950">{step === "PAYMENT" ? `${formatCurrency(invoice.depositDue)} due today` : invoice.invoiceNumber}</p>
        </div>
        {step === "REVIEW" ? <button className="min-h-12 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white" onClick={onReview}>Continue</button> : null}
        {step === "APPROVAL" ? <button className="min-h-12 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 disabled:opacity-60" disabled={approving} onClick={onApprove}>{approving ? "Approving" : "Approve"}</button> : null}
        {step === "PAYMENT" ? <button className="min-h-12 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 disabled:opacity-60" disabled={processingPayment || !squareReady || !termsAccepted} onClick={onPay}>Pay</button> : null}
      </div>
    </div>
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
