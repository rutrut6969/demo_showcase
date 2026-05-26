"use client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const standardMetaEvents: Record<string, string> = {
  ViewDemo: "ViewContent",
  RequestStarted: "Lead",
  RequestSubmitted: "Lead",
  AIQuoteGenerated: "Lead",
  InvoiceViewed: "ViewContent",
  InvoiceApproved: "Lead",
  ContactClicked: "Contact",
  DepositPaid: "Purchase"
};

export function trackPlatformEvent(eventName: string, metadata: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  window.fbq?.("trackCustom", eventName, metadata);
  const standardEvent = standardMetaEvents[eventName];
  if (standardEvent) {
    window.fbq?.("track", standardEvent, metadata);
  }

  window.gtag?.("event", eventName, metadata);

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      sourcePage: window.location.pathname + window.location.search,
      demoSlug: typeof metadata.demoSlug === "string" ? metadata.demoSlug : undefined,
      metadata
    }),
    keepalive: true
  }).catch(() => undefined);
}
