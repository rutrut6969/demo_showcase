"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CreditCard, ShieldCheck, Trash2 } from "lucide-react";

type CardSummary = {
  id: string;
  brand?: string | null;
  last4: string;
  expMonth?: number | null;
  expYear?: number | null;
  billingZip?: string | null;
  defaultCard: boolean;
};

type SquareConfig = {
  environment: "sandbox" | "production";
  applicationId: string | null;
  locationId: string | null;
};

declare global {
  interface Window {
    Square?: {
      payments(applicationId: string, locationId: string): {
        card(): Promise<{ attach(selector: string): Promise<void>; tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }> }>;
        afterpayClearpay?: (options: { amount: string; currencyCode: string; countryCode?: string }) => Promise<{
          attach(selector: string): Promise<void>;
          tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }>;
          destroy?(): Promise<void>;
        }>;
      };
    };
  }
}

export function ClientPaymentMethods() {
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [billingZip, setBillingZip] = useState("");
  const [makeDefault, setMakeDefault] = useState(true);
  const cardRef = useRef<{ tokenize(): Promise<{ status: string; token?: string; errors?: Array<{ message?: string }> }> } | null>(null);

  useEffect(() => {
    loadCards();
    initializeSquare().catch((error) => setError(error instanceof Error ? error.message : "Square could not initialize."));
  }, []);

  async function loadCards() {
    const response = await fetch("/api/client/payment-methods", { credentials: "include" });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.cards) setCards(data.cards);
  }

  async function initializeSquare() {
    const configResponse = await fetch("/api/payments/square");
    const config = (await configResponse.json()) as SquareConfig;
    if (!config.applicationId || !config.locationId) throw new Error("Square card vaulting is not configured.");
    await loadSquareScript(config.environment);
    if (!window.Square) throw new Error("Square Web Payments SDK did not load.");
    const payments = window.Square.payments(config.applicationId, config.locationId);
    const card = await payments.card();
    await card.attach("#client-square-card");
    cardRef.current = card;
    setReady(true);
  }

  async function addCard() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (!cardRef.current) throw new Error("Card form is not ready.");
      const token = await cardRef.current.tokenize();
      if (token.status !== "OK" || !token.token) throw new Error(token.errors?.map((error) => error.message).filter(Boolean).join(" ") || "Square could not tokenize this card.");
      const response = await fetch("/api/client/payment-methods", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: token.token, billingZip, defaultCard: makeDefault })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Card could not be saved.");
      setMessage("Card saved securely with Square.");
      await loadCards();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Card could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function cardAction(id: string, method: "PATCH" | "DELETE") {
    setError("");
    const response = await fetch(`/api/client/payment-methods/${id}`, { method, credentials: "include" });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setError(data?.error || "Card action failed.");
      return;
    }
    setMessage(method === "PATCH" ? "Default card updated." : "Card removed.");
    await loadCards();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 text-slate-950 sm:px-6">
      <section className="mx-auto grid max-w-4xl gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Payment methods</p>
          <h1 className="mt-3 text-2xl font-semibold">Saved cards</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Cards are vaulted by Square. Obsidian stores only safe card metadata and Square IDs, never PAN or CVV.</p>
          <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold" href="/client/retainers">Retainer billing</Link>
        </div>
        {message ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        <div className="grid gap-3">
          {cards.map((card) => (
            <article key={card.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{card.brand || "Card"} ending in {card.last4}</p>
                  <p className="mt-1 text-sm text-slate-500">{card.expMonth && card.expYear ? `Expires ${card.expMonth}/${card.expYear}` : "Expiration stored by Square"}{card.defaultCard ? " - Default" : ""}</p>
                </div>
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {!card.defaultCard ? <button className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => cardAction(card.id, "PATCH")}>Set default</button> : null}
                <button className="min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700" onClick={() => cardAction(card.id, "DELETE")}><Trash2 className="mr-2 inline h-4 w-4" />Remove</button>
              </div>
            </article>
          ))}
          {!cards.length ? <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">No saved cards yet.</p> : null}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold">Add a card</h2>
          <div id="client-square-card" className="mt-4 min-h-[90px] rounded-lg border border-slate-200 p-3" />
          <label className="mt-4 grid gap-2 text-sm font-medium">Billing ZIP
            <input value={billingZip} onChange={(event) => setBillingZip(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-3" />
          </label>
          <label className="mt-4 flex items-center gap-3 text-sm">
            <input type="checkbox" checked={makeDefault} onChange={(event) => setMakeDefault(event.target.checked)} className="h-4 w-4 accent-emerald-500" />
            Make this my default card
          </label>
          <button disabled={!ready || saving} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" onClick={addCard}>
            <CreditCard className="h-4 w-4" /> {saving ? "Saving..." : "Save card with Square"}
          </button>
        </div>
      </section>
    </main>
  );
}

function loadSquareScript(environment: "sandbox" | "production") {
  return new Promise<void>((resolve, reject) => {
    if (window.Square) return resolve();
    const script = document.createElement("script");
    script.src = environment === "production" ? "https://web.squarecdn.com/v1/square.js" : "https://sandbox.web.squarecdn.com/v1/square.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Square Web Payments SDK."));
    document.head.appendChild(script);
  });
}
