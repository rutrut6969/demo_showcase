"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { quoteDisclaimer } from "@/lib/data";
import { trackPlatformEvent } from "@/lib/tracking";
import { formatCurrency } from "@/lib/utils";

export type RequestMetadata = {
  selectedDemo?: string;
  demoCategory?: string;
  recommendedPackage?: string;
  sourcePage?: string;
  estimatedComplexity?: "LOW" | "MODERATE" | "HIGH" | "CUSTOM_ENTERPRISE";
};

type QuoteResult = {
  requestId?: string;
  quote?: {
    buildCostMin: number;
    buildCostMax: number;
    normalPrice?: number;
    promotionalPrice?: number | null;
    selectedBuildPrice?: number;
    normalRetainer?: number | null;
    promotionalRetainer?: number | null;
    selectedRetainer?: number | null;
    promotionId?: string | null;
    pricingExplanation?: string;
    timeframe: string;
    complexityLevel: string;
    recommendedPackage: string;
    suggestedRetainerTier: string;
    suggestedAddOns: string[];
    scopeSummary: string;
    notesForManualReview: string;
  };
  persisted?: boolean;
};

const featureOptions = [
  "Landing page",
  "Ecommerce",
  "Square payments",
  "Scheduling",
  "CRM",
  "Client portal",
  "AI quote funnel",
  "Operations dashboard",
  "Analytics",
  "Invoice workflow"
];

export function RequestQuoteModal({
  open,
  onClose,
  metadata
}: {
  open: boolean;
  onClose: () => void;
  metadata: RequestMetadata;
}) {
  const [features, setFeatures] = useState<string[]>([]);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [includeRetainer, setIncludeRetainer] = useState(false);
  const selectedDemo = metadata.selectedDemo || "Custom platform";

  const featureSummary = useMemo(() => features.join(", "), [features]);

  useEffect(() => {
    if (open) {
      trackPlatformEvent("RequestStarted", {
        selectedDemo: metadata.selectedDemo,
        demoCategory: metadata.demoCategory,
        recommendedPackage: metadata.recommendedPackage,
        sourcePage: metadata.sourcePage,
        estimatedComplexity: metadata.estimatedComplexity
      });
    }
  }, [open, metadata.demoCategory, metadata.estimatedComplexity, metadata.recommendedPackage, metadata.selectedDemo, metadata.sourcePage]);

  if (!open) return null;

  async function submit(formData: FormData) {
    setSubmitting(true);
    setResult(null);
    const payload = {
      name: String(formData.get("name") || ""),
      businessName: String(formData.get("businessName") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      businessType: String(formData.get("businessType") || ""),
      selectedDemo: metadata.selectedDemo,
      demoCategory: metadata.demoCategory,
      recommendedPackage: metadata.recommendedPackage,
      sourcePage: metadata.sourcePage,
      estimatedComplexity: metadata.estimatedComplexity,
      desiredFeatures: features,
      budgetRange: String(formData.get("budgetRange") || ""),
      timeline: String(formData.get("timeline") || ""),
      notes: String(formData.get("notes") || ""),
      marketingConsent: formData.get("marketingConsent") === "on",
      termsAcknowledged: formData.get("termsAcknowledged") === "on"
    };

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as QuoteResult;
      setResult(data);
      trackPlatformEvent("RequestSubmitted", {
        requestId: data.requestId,
        selectedDemo: metadata.selectedDemo,
        demoCategory: metadata.demoCategory,
        persisted: data.persisted
      });
      if (data.quote) {
        trackPlatformEvent("AIQuoteGenerated", {
          requestId: data.requestId,
          selectedDemo: metadata.selectedDemo,
          complexityLevel: data.quote.complexityLevel,
          recommendedPackage: data.quote.recommendedPackage
        });
      }
    } catch {
      setResult({
        quote: {
          buildCostMin: 250000,
          buildCostMax: 650000,
          normalPrice: 250000,
          promotionalPrice: null,
          selectedBuildPrice: 250000,
          normalRetainer: 20000,
          promotionalRetainer: null,
          selectedRetainer: 20000,
          pricingExplanation: "This local fallback uses safe configured pricing. The optional Essential Retainer is shown separately and is not automatically included.",
          timeframe: "3-6 weeks",
          complexityLevel: "MODERATE",
          recommendedPackage: metadata.recommendedPackage || "Custom Platform Build",
          suggestedRetainerTier: "Essential Retainer",
          suggestedAddOns: ["Analytics setup", "Managed platform onboarding"],
          scopeSummary: `A tailored platform request for ${selectedDemo} with ${featureSummary || "core launch features"}.`,
          notesForManualReview: "The local request API was unavailable, so this temporary estimate was generated in the browser."
        }
      });
      trackPlatformEvent("AIQuoteGenerated", {
        selectedDemo: metadata.selectedDemo,
        generatedBy: "browser-fallback"
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptEstimate() {
    if (!result?.quote) return;
    setCheckoutLoading(true);
    setReviewMessage(null);
    try {
      const response = await fetch("/api/checkout/accept-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: result.requestId,
          selectedDemo: metadata.selectedDemo,
          includeRetainer,
          quote: result.quote
        })
      });
      const data = await response.json();
      trackPlatformEvent("InvoiceApproved", {
        requestId: result.requestId,
        selectedDemo: metadata.selectedDemo,
        checkoutPersisted: data.persisted
      });
      window.location.href = data.checkoutUrl || `/invoices/local-checkout-${Date.now()}`;
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function requestAdminReview() {
    setReviewLoading(true);
    setReviewMessage(null);
    try {
      await fetch("/api/checkout/manual-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: result?.requestId,
          selectedDemo: metadata.selectedDemo,
          reason: reviewReason
        })
      });
      trackPlatformEvent("ContactClicked", {
        action: "Request Admin Review",
        requestId: result?.requestId,
        selectedDemo: metadata.selectedDemo
      });
      setReviewMessage("Manual review requested. Obsidian Systems will review the estimate before final checkout.");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/72 px-4 py-4 backdrop-blur sm:py-6">
      <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/15 bg-slate-950/95 shadow-2xl">
        <button
          aria-label="Close request form"
          onClick={onClose}
          className="focus-ring sticky left-full top-4 z-10 mr-4 rounded-full border border-white/15 bg-slate-900 p-2 text-slate-100 shadow-lg hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
          <form action={submit} className="p-5 sm:p-7">
            <Badge>{selectedDemo}</Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white">Request a custom platform estimate</h2>
            <p className="mt-2 text-sm text-slate-300">
              Tell Obsidian Systems what you want built. The form stores demo metadata and returns a preliminary AI-assisted estimate.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Name" required />
              <Field name="businessName" label="Business name" />
              <Field name="email" label="Email" type="email" required />
              <Field name="phone" label="Phone" />
              <Field name="businessType" label="Business type" />
              <Select name="budgetRange" label="Budget range" options={["Under $2,500", "$2,500-$5,000", "$5,000-$10,000", "$10,000-$25,000", "$25,000+"]} />
              <Select name="timeline" label="Timeline" options={["ASAP", "2-4 weeks", "1-2 months", "3+ months", "Planning phase"]} />
              <div>
                <label className="text-sm font-medium text-slate-100">Selected demo style</label>
                <input readOnly value={selectedDemo} className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-3 text-sm text-slate-100" />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-100">Desired features</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {featureOptions.map((feature) => (
                  <label key={feature} className="flex items-center gap-3 rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                    <input
                      type="checkbox"
                      checked={features.includes(feature)}
                      onChange={() =>
                        setFeatures((current) =>
                          current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]
                        )
                      }
                      className="h-4 w-4 rounded border-white/25 bg-slate-950 accent-obsidian-green"
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-100" htmlFor="notes">
                Notes/project prompt
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-obsidian-green/70"
                placeholder="Describe the business, workflows, integrations, and launch goals."
              />
            </div>

            <label className="mt-5 flex items-start gap-3 text-sm text-slate-300">
              <input name="marketingConsent" type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-obsidian-green" />
              I agree to receive follow-up communication from Obsidian Systems LLC.
            </label>
            <label className="mt-3 flex items-start gap-3 text-sm text-slate-300">
              <input name="termsAcknowledged" required type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-obsidian-green" />
              I acknowledge the privacy/terms notice and understand this is a preliminary estimate.
            </label>

            <Button loading={submitting} className="mt-6 w-full sm:w-auto" type="submit">
              Generate preliminary estimate
            </Button>
          </form>

          <aside className="border-t border-white/15 bg-black/50 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <h3 className="text-lg font-semibold text-white">Quote preview</h3>
            <p className="mt-2 text-sm text-slate-300">{quoteDisclaimer}</p>
            {result?.quote ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-obsidian-green/30 bg-slate-900/90 p-4">
                  <div className="flex items-center gap-2 text-obsidian-green">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-semibold">Preliminary estimate ready</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {formatCurrency(result.quote.selectedBuildPrice || result.quote.buildCostMin)}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">One-time project build - {result.quote.timeframe}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Normal price" value={formatCurrency(result.quote.normalPrice || result.quote.buildCostMin)} />
                  <Info label="Promotional price" value={result.quote.promotionalPrice ? formatCurrency(result.quote.promotionalPrice) : "No active promotion"} />
                </div>
                {result.quote.pricingExplanation ? <p className="rounded-lg border border-obsidian-green/25 bg-obsidian-green/10 p-4 text-sm leading-6 text-emerald-100">{result.quote.pricingExplanation}</p> : null}
                <Info label="Complexity" value={result.quote.complexityLevel.replace("_", " ")} />
                <Info label="Recommended package" value={result.quote.recommendedPackage} />
                <div className="rounded-lg border border-white/15 bg-slate-900/90 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Optional monthly services</p>
                  <p className="mt-2 font-semibold text-white">{result.quote.suggestedRetainerTier}</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {result.quote.selectedRetainer ? `${formatCurrency(result.quote.selectedRetainer)}/month` : "Custom monthly pricing after review"}
                  </p>
                  <label className="mt-3 flex items-start gap-3 text-sm text-slate-200">
                    <input type="checkbox" checked={includeRetainer} onChange={(event) => setIncludeRetainer(event.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-obsidian-green" />
                    Add this optional retainer to checkout
                  </label>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Suggested add-ons</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.quote.suggestedAddOns.map((addOn) => (
                      <Badge key={addOn}>{addOn}</Badge>
                    ))}
                  </div>
                </div>
                <p className="rounded-lg border border-white/15 bg-black/50 p-4 text-sm text-slate-300">{result.quote.scopeSummary}</p>
                <div className="rounded-lg border border-white/15 bg-slate-900/90 p-4">
                  <p className="text-sm font-semibold text-white">Next step</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Accept this estimate to open a branded checkout page, or ask for manual review before checkout.
                  </p>
                  <div className="mt-4 grid gap-2">
                    <Button loading={checkoutLoading} onClick={acceptEstimate} type="button" className="w-full">
                      Accept Estimate & Checkout
                    </Button>
                    <textarea
                      value={reviewReason}
                      onChange={(event) => setReviewReason(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-obsidian-green/70"
                      placeholder="Optional note for manual review"
                    />
                    <Button loading={reviewLoading} onClick={requestAdminReview} type="button" variant="secondary" className="w-full">
                      Request Admin Review
                    </Button>
                    {reviewMessage ? <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">{reviewMessage}</p> : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="h-24 animate-pulse rounded-lg bg-slate-900/90" />
                <div className="h-16 animate-pulse rounded-lg bg-slate-900/80" />
                <div className="h-16 animate-pulse rounded-lg bg-slate-900/80" />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-100" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-obsidian-green/70"
      />
    </div>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-100" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition focus:border-obsidian-green/70"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-obsidian-900">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
