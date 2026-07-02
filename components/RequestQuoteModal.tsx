"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { demoTemplates, quoteDisclaimer } from "@/lib/data";
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
    budgetAssessment?: string;
    recommendationOptions?: QuoteRecommendationOption[];
    paymentRecommendations?: string[];
  };
  persisted?: boolean;
};

type QuoteRecommendationOption = {
  label: string;
  fit: "FULL" | "BUDGET" | "PHASED";
  estimatedBuildPrice: number;
  summary: string;
  includedFeatures: string[];
  deferredFeatures: string[];
  nextStep: string;
};

type ConsultationForm = {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  businessType: string;
  websiteType: string;
  selectedDemo: string;
  budgetRange: string;
  timeline: string;
  notes: string;
  marketingConsent: boolean;
  termsAcknowledged: boolean;
};

const steps = [
  { key: "direction", label: "Direction" },
  { key: "type", label: "Type" },
  { key: "features", label: "Features" },
  { key: "budget", label: "Budget" },
  { key: "contact", label: "Contact" },
  { key: "review", label: "Review" }
];

const websiteTypes = [
  "Basic Website",
  "Business Website",
  "Ecommerce Website",
  "Restaurant Ordering Website",
  "Healthcare / Appointment Website",
  "Professional Services Website",
  "Home Services Website",
  "Real Estate Website",
  "Repair / Field Service Website",
  "Custom Web Application",
  "Complex Business System",
  "Not sure yet"
];

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
  "Invoice workflow",
  "Product catalog",
  "Cart UI",
  "Reviews",
  "Provider directory",
  "Appointment request",
  "Customer portal",
  "Menu ordering",
  "Quote request",
  "Subscription or retainer billing"
];

const budgetOptions = ["Under $2,500", "$2,500-$5,000", "$5,000-$10,000", "$10,000-$25,000", "$25,000+"];
const timelineOptions = ["ASAP", "2-4 weeks", "1-2 months", "3+ months", "Planning phase"];
const loadingMessages = [
  "Reviewing your project requirements...",
  "Analyzing requested features...",
  "Comparing your budget and goals...",
  "Evaluating possible solutions...",
  "Building your recommendations...",
  "Preparing your consultation..."
];

const demoTypeMap: Array<[string, string]> = [
  ["ecommerce", "Ecommerce Website"],
  ["restaurant", "Restaurant Ordering Website"],
  ["healthcare", "Healthcare / Appointment Website"],
  ["medical", "Healthcare / Appointment Website"],
  ["chiropractic", "Healthcare / Appointment Website"],
  ["legal", "Professional Services Website"],
  ["real estate", "Real Estate Website"],
  ["repair", "Repair / Field Service Website"],
  ["contractor", "Home Services Website"],
  ["services", "Home Services Website"],
  ["dropshipping", "Ecommerce Website"]
];

function defaultForm(metadata: RequestMetadata): ConsultationForm {
  const demo = findDemo(metadata.selectedDemo);
  const websiteType = inferWebsiteType(metadata.demoCategory || demo?.type || metadata.selectedDemo || "");

  return {
    name: "",
    businessName: "",
    email: "",
    phone: "",
    businessType: "",
    websiteType,
    selectedDemo: metadata.selectedDemo || demo?.name || "Custom platform",
    budgetRange: "",
    timeline: "",
    notes: "",
    marketingConsent: false,
    termsAcknowledged: false
  };
}

function findDemo(selectedDemo?: string) {
  if (!selectedDemo) return undefined;
  const normalized = selectedDemo.toLowerCase();
  return demoTemplates.find((demo) => demo.name.toLowerCase() === normalized || demo.slug.toLowerCase() === normalized);
}

function inferWebsiteType(input: string) {
  const normalized = input.toLowerCase();
  const match = demoTypeMap.find(([keyword]) => normalized.includes(keyword));
  return match?.[1] || "Business Website";
}

function featureDefaultsForDemo(selectedDemo?: string) {
  const demo = findDemo(selectedDemo);
  if (!demo) return ["Landing page", "AI quote funnel", "Invoice workflow"];

  const normalizedOptions = new Map(featureOptions.map((feature) => [feature.toLowerCase(), feature]));
  const mapped = demo.features
    .map((feature) => normalizedOptions.get(feature.toLowerCase()))
    .filter((feature): feature is string => Boolean(feature));

  const typeDefaults = demo.type.toLowerCase().includes("ecommerce")
    ? ["Ecommerce", "Square payments", "Product catalog", "Cart UI"]
    : demo.type.toLowerCase().includes("restaurant")
      ? ["Menu ordering", "Square payments", "Quote request"]
      : demo.type.toLowerCase().includes("medical") || demo.type.toLowerCase().includes("clinic")
        ? ["Appointment request", "Client portal", "Provider directory"]
        : demo.type.toLowerCase().includes("repair")
          ? ["Quote request", "Scheduling", "Invoice workflow"]
          : ["Landing page", "CRM", "Analytics"];

  return Array.from(new Set([...mapped, ...typeDefaults, "AI quote funnel"])).slice(0, 7);
}

function storageKey(metadata: RequestMetadata) {
  return `obsidian-consultation:${metadata.sourcePage || "landing"}:${metadata.selectedDemo || "custom"}`;
}

export function RequestQuoteModal({
  open,
  onClose,
  metadata
}: {
  open: boolean;
  onClose: () => void;
  metadata: RequestMetadata;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ConsultationForm>(() => defaultForm(metadata));
  const [features, setFeatures] = useState<string[]>(() => featureDefaultsForDemo(metadata.selectedDemo));
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [includeRetainer, setIncludeRetainer] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedDemo = form.selectedDemo || metadata.selectedDemo || "Custom platform";
  const selectedDemoData = useMemo(() => findDemo(selectedDemo), [selectedDemo]);
  const selectedDemoMetadata = useMemo(
    () => ({
      selectedDemo,
      demoCategory: selectedDemoData?.type || metadata.demoCategory,
      recommendedPackage: selectedDemoData?.recommendedPackage || metadata.recommendedPackage,
      sourcePage: selectedDemoData ? `consultation:${selectedDemoData.slug}` : metadata.sourcePage,
      estimatedComplexity: selectedDemoData?.complexity || metadata.estimatedComplexity
    }),
    [metadata.demoCategory, metadata.estimatedComplexity, metadata.recommendedPackage, metadata.sourcePage, selectedDemo, selectedDemoData]
  );

  const progress = Math.round(((step + 1) / steps.length) * 100);
  const featureSummary = useMemo(() => features.join(", "), [features]);

  useEffect(() => {
    if (!open) return;
    const key = storageKey(metadata);
    const baseForm = defaultForm(metadata);
    const baseFeatures = featureDefaultsForDemo(metadata.selectedDemo);
    const saved = window.localStorage.getItem(key);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { form?: ConsultationForm; features?: string[]; step?: number };
        setForm({ ...baseForm, ...parsed.form });
        setFeatures(parsed.features?.length ? parsed.features : baseFeatures);
        setStep(typeof parsed.step === "number" ? Math.min(Math.max(parsed.step, 0), steps.length - 1) : 0);
      } catch {
        setForm(baseForm);
        setFeatures(baseFeatures);
        setStep(0);
      }
    } else {
      setForm(baseForm);
      setFeatures(baseFeatures);
      setStep(0);
    }

    setResult(null);
    setFormError(null);
    setReviewMessage(null);
    setReviewReason("");
    setIncludeRetainer(false);
    trackPlatformEvent("RequestStarted", {
      selectedDemo: metadata.selectedDemo,
      demoCategory: metadata.demoCategory,
      recommendedPackage: metadata.recommendedPackage,
      sourcePage: metadata.sourcePage,
      estimatedComplexity: metadata.estimatedComplexity
    });
  }, [open, metadata]);

  useEffect(() => {
    if (!open) return;
    window.localStorage.setItem(storageKey(metadata), JSON.stringify({ form, features, step }));
  }, [features, form, metadata, open, step]);

  useEffect(() => {
    if (!submitting) return;
    const interval = window.setInterval(() => {
      setLoadingMessageIndex((current) => (current + 1) % loadingMessages.length);
    }, 1700);
    return () => window.clearInterval(interval);
  }, [submitting]);

  if (!open) return null;

  function updateForm<K extends keyof ConsultationForm>(key: K, value: ConsultationForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseDemo(value: string) {
    const demo = value === "Custom platform" ? undefined : findDemo(value);
    updateForm("selectedDemo", value);
    updateForm("websiteType", inferWebsiteType(demo?.type || value));
    setFeatures(featureDefaultsForDemo(demo?.name || value));
  }

  function toggleFeature(feature: string) {
    setFeatures((current) => (current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]));
  }

  function canAdvance() {
    if (step === 2 && features.length === 0) return "Choose at least one feature so the estimate has enough scope.";
    if (step === 4 && (!form.name.trim() || !form.email.trim())) return "Name and email are required before review.";
    return null;
  }

  function nextStep() {
    const error = canAdvance();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setFormError(null);
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!form.termsAcknowledged) {
      setFormError("Please acknowledge the preliminary estimate notice before generating the consultation.");
      setStep(5);
      return;
    }

    setSubmitting(true);
    setLoadingMessageIndex(0);
    setResult(null);
    setFormError(null);

    const payload = {
      name: form.name,
      businessName: form.businessName,
      email: form.email,
      phone: form.phone,
      businessType: form.businessType || form.websiteType,
      selectedDemo: selectedDemoMetadata.selectedDemo,
      demoCategory: selectedDemoMetadata.demoCategory,
      recommendedPackage: selectedDemoMetadata.recommendedPackage,
      sourcePage: selectedDemoMetadata.sourcePage,
      estimatedComplexity: selectedDemoMetadata.estimatedComplexity,
      desiredFeatures: features,
      budgetRange: form.budgetRange,
      timeline: form.timeline,
      notes: form.notes,
      marketingConsent: form.marketingConsent,
      termsAcknowledged: form.termsAcknowledged
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
        selectedDemo: selectedDemoMetadata.selectedDemo,
        demoCategory: selectedDemoMetadata.demoCategory,
        persisted: data.persisted
      });
      if (data.quote) {
        trackPlatformEvent("AIQuoteGenerated", {
          requestId: data.requestId,
          selectedDemo: selectedDemoMetadata.selectedDemo,
          complexityLevel: data.quote.complexityLevel,
          recommendedPackage: data.quote.recommendedPackage
        });
      } else {
        setFormError("The consultation returned without quote details. Please request manual review or try again.");
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
          complexityLevel: selectedDemoMetadata.estimatedComplexity || "MODERATE",
          recommendedPackage: selectedDemoMetadata.recommendedPackage || "Custom Platform Build",
          suggestedRetainerTier: "Essential Retainer",
          suggestedAddOns: ["Analytics setup", "Managed platform onboarding"],
          scopeSummary: `A tailored platform request for ${selectedDemo} with ${featureSummary || "core launch features"}.`,
          notesForManualReview: "The local request API was unavailable, so this temporary estimate was generated in the browser.",
          budgetAssessment: "The browser fallback cannot compare live pricing rules, so Obsidian Systems should confirm budget fit during manual review.",
          recommendationOptions: buildLocalRecommendationOptions(selectedDemoMetadata.recommendedPackage || "Custom Platform Build", features),
          paymentRecommendations: [
            "Deposit path: reserve the production window with a deposit after manual review.",
            "Payment plan path: milestone payment options can be discussed before final checkout.",
            "Afterpay/Clearpay path: available only when Square eligibility allows it."
          ]
        }
      });
      trackPlatformEvent("AIQuoteGenerated", {
        selectedDemo: selectedDemoMetadata.selectedDemo,
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
          selectedDemo: selectedDemoMetadata.selectedDemo,
          includeRetainer,
          quote: result.quote
        })
      });
      const data = await response.json();
      trackPlatformEvent("InvoiceApproved", {
        requestId: result.requestId,
        selectedDemo: selectedDemoMetadata.selectedDemo,
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
          selectedDemo: selectedDemoMetadata.selectedDemo,
          reason: reviewReason
        })
      });
      trackPlatformEvent("ContactClicked", {
        action: "Request Admin Review",
        requestId: result?.requestId,
        selectedDemo: selectedDemoMetadata.selectedDemo
      });
      setReviewMessage("Manual review requested. Obsidian Systems will review the estimate before final checkout.");
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/72 px-3 py-3 backdrop-blur sm:px-4 sm:py-6">
      <div className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-white/15 bg-slate-950/95 shadow-2xl sm:max-h-[calc(100vh-3rem)]">
        <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge>{selectedDemo}</Badge>
              <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">AI project consultation</h2>
              <p className="mt-1 text-sm text-slate-300">Step {step + 1} of {steps.length}: {steps[step].label}</p>
            </div>
            <button
              aria-label="Close request form"
              onClick={onClose}
              className="focus-ring shrink-0 rounded-full border border-white/15 bg-slate-900 p-2 text-slate-100 shadow-lg hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-obsidian-green transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 hidden grid-cols-6 gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:grid">
            {steps.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-md px-2 py-2 text-left transition ${index === step ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-slate-300"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto">
          <form onSubmit={submit} className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
            <section className="min-h-[520px] p-4 sm:p-6">
              {formError ? <p className="mb-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">{formError}</p> : null}

              {step === 0 ? (
                <StepPanel eyebrow="Project Direction" title="What should this build help you accomplish?" description="Start with the business goal and the closest demo style. Demo-launched requests are preselected automatically.">
                  <SelectField
                    label="Starting point"
                    value={form.selectedDemo}
                    onChange={chooseDemo}
                    options={["Custom platform", ...demoTemplates.map((demo) => demo.name)]}
                  />
                  <TextArea
                    label="Project goal"
                    value={form.notes}
                    onChange={(value) => updateForm("notes", value)}
                    placeholder="Describe what customers should be able to do, what your staff needs to manage, and what a successful launch looks like."
                    rows={6}
                  />
                </StepPanel>
              ) : null}

              {step === 1 ? (
                <StepPanel eyebrow="Website Type" title="Choose the closest website or platform type." description="This helps the consultant frame scope, complexity, and the right production path.">
                  <SelectField label="Website type" value={form.websiteType} onChange={(value) => updateForm("websiteType", value)} options={websiteTypes} />
                  <Field label="Business type or industry" value={form.businessType} onChange={(value) => updateForm("businessType", value)} placeholder="Boutique, repair shop, clinic, restaurant, law firm..." />
                </StepPanel>
              ) : null}

              {step === 2 ? (
                <StepPanel eyebrow="Features" title="Select the features this build needs." description="Recommended options are preselected from the demo style, and you can adjust them before generating the consultation.">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {featureOptions.map((feature) => (
                      <label key={feature} className="flex min-h-12 items-center gap-3 rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100">
                        <input
                          type="checkbox"
                          checked={features.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                          className="h-4 w-4 rounded border-white/25 bg-slate-950 accent-obsidian-green"
                        />
                        {feature}
                      </label>
                    ))}
                  </div>
                </StepPanel>
              ) : null}

              {step === 3 ? (
                <StepPanel eyebrow="Budget And Timeline" title="Share the practical constraints." description="Pricing still comes from the server, but the consultant uses this to shape recommendations and review notes.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField label="Budget range" value={form.budgetRange} onChange={(value) => updateForm("budgetRange", value)} options={["", ...budgetOptions]} />
                    <SelectField label="Timeline" value={form.timeline} onChange={(value) => updateForm("timeline", value)} options={["", ...timelineOptions]} />
                  </div>
                </StepPanel>
              ) : null}

              {step === 4 ? (
                <StepPanel eyebrow="Contact" title="Where should Obsidian send the estimate details?" description="This creates or updates a client record and keeps the request tied to the selected demo/source.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name" value={form.name} onChange={(value) => updateForm("name", value)} required />
                    <Field label="Business name" value={form.businessName} onChange={(value) => updateForm("businessName", value)} />
                    <Field label="Email" value={form.email} onChange={(value) => updateForm("email", value)} type="email" required />
                    <Field label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
                  </div>
                  <label className="mt-5 flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    <input checked={form.marketingConsent} onChange={(event) => updateForm("marketingConsent", event.target.checked)} type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-obsidian-green" />
                    I agree to receive follow-up communication from Obsidian Systems LLC.
                  </label>
                </StepPanel>
              ) : null}

              {step === 5 ? (
                <StepPanel eyebrow="Review" title="Review and generate your consultation." description="Your progress is saved locally on this device while the modal is open or revisited from the same source.">
                  <div className="grid gap-3">
                    <ReviewLine label="Starting point" value={selectedDemo} />
                    <ReviewLine label="Website type" value={form.websiteType} />
                    <ReviewLine label="Features" value={featureSummary || "No features selected"} />
                    <ReviewLine label="Budget" value={form.budgetRange || "Not specified"} />
                    <ReviewLine label="Timeline" value={form.timeline || "Not specified"} />
                    <ReviewLine label="Contact" value={`${form.name || "No name"} - ${form.email || "No email"}`} />
                  </div>
                  <label className="mt-5 flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                    <input checked={form.termsAcknowledged} onChange={(event) => updateForm("termsAcknowledged", event.target.checked)} required type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-900 accent-obsidian-green" />
                    I acknowledge the privacy/terms notice and understand this is a preliminary estimate.
                  </label>
                  <Button loading={submitting} className="mt-5 w-full sm:w-auto" type="submit">
                    Generate AI consultation
                  </Button>
                  {submitting ? (
                    <div className="mt-4 rounded-lg border border-obsidian-green/30 bg-obsidian-green/10 p-4 text-sm text-emerald-100">
                      <div className="flex items-center gap-2 font-semibold">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        {loadingMessages[loadingMessageIndex]}
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                        <div className="h-full w-2/3 animate-pulse rounded-full bg-obsidian-green" />
                      </div>
                    </div>
                  ) : null}
                </StepPanel>
              ) : null}

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button type="button" variant="secondary" onClick={previousStep} disabled={step === 0 || submitting}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep} disabled={submitting}>
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </section>

            <aside className="border-t border-white/15 bg-black/50 p-4 sm:p-6 lg:border-l lg:border-t-0">
              <h3 className="text-lg font-semibold text-white">Consultation preview</h3>
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
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <Info label="Normal price" value={formatCurrency(result.quote.normalPrice || result.quote.buildCostMin)} />
                    <Info label="Promotional price" value={result.quote.promotionalPrice ? formatCurrency(result.quote.promotionalPrice) : "No active promotion"} />
                  </div>
                  {result.quote.pricingExplanation ? <p className="rounded-lg border border-obsidian-green/25 bg-obsidian-green/10 p-4 text-sm leading-6 text-emerald-100">{result.quote.pricingExplanation}</p> : null}
                  {result.quote.budgetAssessment ? (
                    <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">Budget assessment</p>
                      <p className="mt-2 text-sm leading-6 text-amber-50">{result.quote.budgetAssessment}</p>
                    </div>
                  ) : null}
                  {result.quote.recommendationOptions?.length ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Recommended paths</p>
                      {result.quote.recommendationOptions.map((option) => (
                        <div key={option.fit} className="rounded-lg border border-white/15 bg-slate-900/90 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">{option.label}</p>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-obsidian-green">{option.fit.replace("_", " ")}</p>
                            </div>
                            <p className="text-sm font-semibold text-white">{formatCurrency(option.estimatedBuildPrice)}</p>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-300">{option.summary}</p>
                          <div className="mt-3 grid gap-3 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            <FeatureList title="Included" items={option.includedFeatures} />
                            <FeatureList title="Deferred" items={option.deferredFeatures} />
                          </div>
                          <p className="mt-3 rounded-md bg-black/30 p-3 text-xs leading-5 text-slate-300">{option.nextStep}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
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
                  {result.quote.paymentRecommendations?.length ? (
                    <div className="rounded-lg border border-white/15 bg-black/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Payment guidance</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                        {result.quote.paymentRecommendations.map((recommendation) => (
                          <li key={recommendation} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-obsidian-green" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
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
                  <div className="rounded-lg border border-white/10 bg-slate-900/90 p-4">
                    <p className="text-sm font-semibold text-white">{form.websiteType}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{featureSummary || "Choose features to shape the consultation."}</p>
                  </div>
                  <div className="h-20 animate-pulse rounded-lg bg-slate-900/80" />
                  <div className="h-20 animate-pulse rounded-lg bg-slate-900/80" />
                </div>
              )}
            </aside>
          </form>
        </div>
      </div>
    </div>
  );
}

function StepPanel({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-obsidian-green">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-100">
        {label}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          required={required}
          placeholder={placeholder}
          className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-obsidian-green/70"
        />
      </label>
    </div>
  );
}

function TextArea({ label, value, onChange, rows, placeholder }: { label: string; value: string; onChange: (value: string) => void; rows: number; placeholder?: string }) {
  return (
    <label className="block text-sm font-medium text-slate-100">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-obsidian-green/70"
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block text-sm font-medium text-slate-100">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition focus:border-obsidian-green/70"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option} className="bg-obsidian-900">
            {option || "Select an option"}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function FeatureList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-semibold text-slate-100">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item} className="leading-5">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 leading-5 text-slate-500">None</p>
      )}
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

function buildLocalRecommendationOptions(recommendedPackage: string, features: string[]): QuoteRecommendationOption[] {
  const selectedFeatures = features.length ? features : ["Landing page", "Lead capture", "Analytics"];
  const essentials = selectedFeatures.slice(0, Math.max(2, Math.ceil(selectedFeatures.length * 0.55)));
  const deferred = selectedFeatures.filter((feature) => !essentials.includes(feature));

  return [
    {
      label: "Full recommended solution",
      fit: "FULL",
      estimatedBuildPrice: 250000,
      summary: `Build the complete ${recommendedPackage} scope after manual confirmation.`,
      includedFeatures: selectedFeatures,
      deferredFeatures: [],
      nextStep: "Use this path when the full requested scope is the right launch target."
    },
    {
      label: "Budget-fit launch",
      fit: "BUDGET",
      estimatedBuildPrice: 150000,
      summary: "Start with the smallest useful launch and defer lower-priority automation.",
      includedFeatures: essentials,
      deferredFeatures: deferred.length ? deferred : ["Advanced automation", "Expanded integrations"],
      nextStep: "Use this path when budget is firm and the business needs a practical first release."
    },
    {
      label: "Phased build plan",
      fit: "PHASED",
      estimatedBuildPrice: 175000,
      summary: "Launch core functionality first, then schedule the remaining workflow in follow-up phases.",
      includedFeatures: essentials,
      deferredFeatures: Array.from(new Set([...deferred, "Advanced reporting", "Post-launch optimization"])),
      nextStep: "Use this path when the full system is right but better delivered in milestones."
    }
  ];
}
