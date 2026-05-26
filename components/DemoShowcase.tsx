"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Filter,
  Heart,
  MapPin,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShoppingCart,
  Star,
  UserRound,
  X
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { RequestQuoteModal, type RequestMetadata } from "@/components/RequestQuoteModal";
import { demoNotice, demoTemplates, type DemoTemplateData } from "@/lib/data";
import { demoMiniSites, type DemoItem, type DemoMiniSite } from "@/lib/demo-mini-sites";
import { trackPlatformEvent } from "@/lib/tracking";

export function DemoShowcase() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initial = searchParams.get("demo") || demoTemplates[0].slug;
  const [activeSlug, setActiveSlug] = useState(initial);
  const [activePage, setActivePage] = useState("Home");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [request, setRequest] = useState<RequestMetadata | null>(null);

  const activeDemo = useMemo(
    () => demoTemplates.find((demo) => demo.slug === activeSlug) || demoTemplates[0],
    [activeSlug]
  );

  useEffect(() => {
    setActivePage("Home");
    router.replace(`/demos?demo=${activeDemo.slug}`, { scroll: false });
    trackPlatformEvent("ViewDemo", {
      demoSlug: activeDemo.slug,
      selectedDemo: activeDemo.name,
      demoCategory: activeDemo.type
    });
  }, [activeDemo.name, activeDemo.slug, activeDemo.type, router]);

  const chooseDemo = (slug: string) => {
    setActiveSlug(slug);
    setDrawerOpen(false);
  };

  const metadata: RequestMetadata = {
    selectedDemo: activeDemo.name,
    demoCategory: activeDemo.type,
    recommendedPackage: activeDemo.recommendedPackage,
    sourcePage: `/demos?demo=${activeDemo.slug}`,
    estimatedComplexity: activeDemo.complexity
  };

  const openRequest = (requestMetadata: RequestMetadata, action: string) => {
    trackPlatformEvent("ContactClicked", {
      action,
      demoSlug: activeDemo.slug,
      selectedDemo: requestMetadata.selectedDemo,
      recommendedPackage: requestMetadata.recommendedPackage
    });
    setRequest(requestMetadata);
  };

  return (
    <main className="min-h-screen bg-obsidian-950 text-white">
      <div className="flex min-h-screen">
        <aside className={`${collapsed ? "w-[84px]" : "w-[320px]"} sticky top-0 hidden h-screen shrink-0 border-r border-white/10 bg-obsidian-900/95 p-4 transition-all duration-300 lg:block`}>
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {!collapsed ? <p className="text-sm font-semibold text-white">Demo Showcase</p> : null}
            <button
              className="focus-ring rounded-lg p-2 text-slate-300 hover:bg-white/10"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((value) => !value)}
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>
          <DemoList collapsed={collapsed} activeSlug={activeDemo.slug} onChoose={chooseDemo} />
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-obsidian-950/82 px-4 py-3 backdrop-blur xl:px-8">
            <div className="flex items-center justify-between gap-3">
              <button className="focus-ring rounded-lg border border-white/12 bg-white/8 p-2 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open demos">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{activeDemo.name}</p>
                <p className="truncate text-xs text-slate-400">{activeDemo.type}</p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="secondary" onClick={() => openRequest({ ...metadata, recommendedPackage: "Style Customization" }, "Customize This Platform")}>
                  Customize This Platform
                </Button>
                <Button onClick={() => openRequest(metadata, "Get AI Estimate")}>Get AI Estimate</Button>
              </div>
            </div>
          </header>

          <DemoNotice />

          <DemoExperience
            demo={activeDemo}
            activePage={activePage}
            onPageChange={setActivePage}
            onRequest={(recommendedPackage) => openRequest({ ...metadata, recommendedPackage }, "Demo CTA")}
          />
        </section>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/72 backdrop-blur lg:hidden">
          <div className="h-full w-[88vw] max-w-sm overflow-y-auto border-r border-white/10 bg-obsidian-900 p-4 scrollbar-thin">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Choose demo</p>
              <button className="focus-ring rounded-lg p-2 hover:bg-white/10" aria-label="Close demos" onClick={() => setDrawerOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <DemoList collapsed={false} activeSlug={activeDemo.slug} onChoose={chooseDemo} />
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-4 bottom-4 z-30 grid gap-2 sm:hidden">
        <Button onClick={() => openRequest(metadata, "Mobile Get AI Estimate")}>Get AI Estimate</Button>
        <Button variant="secondary" onClick={() => openRequest({ ...metadata, recommendedPackage: "Style Customization" }, "Mobile Customize This Platform")}>
          Customize This Platform
        </Button>
      </div>

      <RequestQuoteModal open={Boolean(request)} onClose={() => setRequest(null)} metadata={request || {}} />
    </main>
  );
}

function DemoNotice() {
  return (
    <div className="px-4 py-5 xl:px-8">
      <div className="rounded-lg border border-obsidian-green/25 bg-obsidian-green/10 p-4 text-sm leading-6 text-emerald-50">
        {demoNotice}
      </div>
    </div>
  );
}

function DemoList({
  collapsed,
  activeSlug,
  onChoose
}: {
  collapsed: boolean;
  activeSlug: string;
  onChoose: (slug: string) => void;
}) {
  return (
    <div className="mt-6 space-y-2">
      {demoTemplates.map((demo, index) => (
        <button
          key={demo.slug}
          onClick={() => onChoose(demo.slug)}
          title={demo.name}
          className={`focus-ring flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
            activeSlug === demo.slug
              ? "border-obsidian-green/40 bg-obsidian-green/12 text-white"
              : "border-white/8 bg-white/[0.04] text-slate-300 hover:border-white/18 hover:bg-white/[0.08]"
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-xs font-semibold">{index + 1}</span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{demo.name}</span>
              <span className="block truncate text-xs text-slate-400">{demo.type}</span>
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function DemoExperience({
  demo,
  activePage,
  onPageChange,
  onRequest
}: {
  demo: DemoTemplateData;
  activePage: string;
  onPageChange: (page: string) => void;
  onRequest: (recommendedPackage: string) => void;
}) {
  const site = demoMiniSites[demo.slug] || demoMiniSites["crafted-commerce"];
  const paletteValues = Object.values(demo.palette);

  return (
    <div className="px-4 pb-28 xl:px-8">
      <div className="demo-surface overflow-hidden rounded-lg border border-white/10">
        <div className={`bg-gradient-to-br ${demo.accentClass} p-[1px]`}>
          <div className="rounded-t-lg bg-black/78 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-white/20 bg-white/14">Interactive mini website</Badge>
                  <Badge>{demo.complexity.replace("_", " ")}</Badge>
                </div>
                <h1 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">{demo.name}</h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-200">{demo.description}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <Button onClick={() => onRequest(demo.recommendedPackage)}>Request This Demo Style</Button>
                <Button variant="secondary" onClick={() => onRequest("Custom Production Deployment")}>Customize This Platform</Button>
              </div>
            </div>
          </div>
        </div>

        <MiniWebsiteDemo
          demo={demo}
          site={site}
          activePage={activePage}
          onPageChange={onPageChange}
          onRequest={onRequest}
          paletteValues={paletteValues}
        />
      </div>
    </div>
  );
}

function MiniWebsiteDemo({
  demo,
  site,
  activePage,
  onPageChange,
  onRequest,
  paletteValues
}: {
  demo: DemoTemplateData;
  site: DemoMiniSite;
  activePage: string;
  onPageChange: (page: string) => void;
  onRequest: (recommendedPackage: string) => void;
  paletteValues: string[];
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dark = getDarkestSwatch(paletteValues) || "#111827";
  const accent = getAccentSwatch(paletteValues, dark) || "#22C55E";
  const light = getLightestSwatch(paletteValues) || "#FFFFFF";

  const showDemoToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="relative bg-black/28 p-3 sm:p-5">
      <div className="overflow-hidden rounded-lg bg-white text-slate-950 shadow-2xl">
        <DemoNavbar
          site={site}
          activePage={activePage}
          onPageChange={onPageChange}
          onCart={() => setCartOpen(true)}
          dark={dark}
        />

        <section className="relative overflow-hidden border-b border-slate-200" style={{ backgroundColor: light }}>
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative z-10">
              <div className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white" style={{ backgroundColor: dark }}>
                {site.brandLine}
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">{site.heroTitle}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">{site.heroText}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => showDemoToast(`${site.primaryAction} is simulated in this demo.`)}
                  className="rounded-lg px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: dark }}
                >
                  {site.primaryAction}
                </button>
                <button
                  onClick={() => onRequest(demo.recommendedPackage)}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Request this style
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg p-4 text-white" style={{ backgroundColor: dark }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">Today</p>
                <p className="mt-3 text-2xl font-semibold">{site.promo}</p>
                <div className="mt-8 grid gap-2 text-sm">
                  {site.flowSummary.slice(0, 3).map((summary) => (
                    <div key={summary} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: accent }} />
                      {summary}
                    </div>
                  ))}
                </div>
              </div>
              <DemoCheckoutPreview title={site.checkoutTitle} lines={site.checkoutLines} dark={dark} accent={accent} onCart={() => setCartOpen(true)} />
            </div>
          </div>
        </section>

        <main className="space-y-0">
          <section className="border-b border-slate-200 p-5 sm:p-8">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: dark }}>{activePage}</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{site.itemsTitle}</h3>
              </div>
              <DemoSearchFilter categories={site.categories} dark={dark} onFilter={(category) => showDemoToast(`${category} filter applied for demo only.`)} />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {site.items.map((item) => (
                <DemoProductCard key={item.name} item={item} dark={dark} accent={accent} onAdd={() => setCartOpen(true)} />
              ))}
            </div>
          </section>

          <section className="grid gap-0 border-b border-slate-200 lg:grid-cols-[1fr_0.8fr]">
            <div className="p-5 sm:p-8">
              <h3 className="text-2xl font-semibold text-slate-950">{site.servicesTitle}</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {site.services.map((service) => (
                  <DemoServiceCard key={service.name} service={service} dark={dark} accent={accent} />
                ))}
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-8 lg:border-l lg:border-t-0">
              <DemoBookingForm site={site} dark={dark} accent={accent} onDemoOnly={showDemoToast} onRequest={() => onRequest("Production Workflow Build")} />
            </div>
          </section>

          <section className="grid gap-0 border-b border-slate-200 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="p-5 sm:p-8">
              <DemoGallery title={site.galleryTitle} items={site.gallery} dark={dark} accent={accent} />
            </div>
            <div className="border-t border-slate-200 p-5 sm:p-8 lg:border-l lg:border-t-0">
              <h3 className="text-2xl font-semibold text-slate-950">Client proof</h3>
              <div className="mt-5 grid gap-4">
                {site.reviews.map((review) => (
                  <DemoTestimonial key={review.name} review={review} accent={accent} />
                ))}
              </div>
            </div>
          </section>

          <DemoCTASection
            title={`Build a production ${demo.name} style platform.`}
            text="Connect the visible demo experience to real backend systems, payments, CRM records, analytics, and admin workflows."
            dark={dark}
            onRequest={() => onRequest(demo.recommendedPackage)}
            onDemoOnly={() => showDemoToast("Contact flow previewed. Use Request this style to open the real quote form.")}
          />

          <DemoFooter site={site} dark={dark} onNavigate={onPageChange} />
        </main>
      </div>

      <DemoCartDrawer open={cartOpen} onClose={() => setCartOpen(false)} site={site} dark={dark} accent={accent} onDemoOnly={showDemoToast} />
      <DemoToast message={toast} />
    </div>
  );
}

function DemoNavbar({
  site,
  activePage,
  onPageChange,
  onCart,
  dark
}: {
  site: DemoMiniSite;
  activePage: string;
  onPageChange: (page: string) => void;
  onCart: () => void;
  dark: string;
}) {
  const pages = Array.from(new Set(["Home", ...site.nav]));
  return (
    <header className="border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: dark }}>
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-950">{site.slug.split("-").map(capitalize).join(" ")}</p>
              <p className="text-xs text-slate-500">{site.brandLine}</p>
            </div>
          </div>
          <button onClick={onCart} className="focus-ring rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 xl:hidden" aria-label="Open cart">
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin xl:pb-0">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activePage === page ? "text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              style={activePage === page ? { backgroundColor: dark } : undefined}
            >
              {page}
            </button>
          ))}
        </nav>
        <button onClick={onCart} className="focus-ring hidden rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 xl:inline-flex xl:items-center xl:gap-2">
          <ShoppingCart className="h-4 w-4" />
          Cart / request
        </button>
      </div>
    </header>
  );
}

function DemoProductCard({ item, dark, accent, onAdd }: { item: DemoItem; dark: string; accent: string; onAdd: () => void }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-40 p-4" style={{ backgroundColor: item.imageTone || accent }}>
        <div className="absolute inset-4 rounded-lg border border-white/35 bg-white/20" />
        {item.badge ? <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900">{item.badge}</span> : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-semibold text-slate-950">{item.name}</h4>
          {item.price ? <p className="shrink-0 text-sm font-bold" style={{ color: dark }}>{item.price}</p> : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
        {item.meta ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.meta}</p> : null}
        <button onClick={onAdd} className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: dark }}>
          Add / preview
        </button>
      </div>
    </article>
  );
}

function DemoCartDrawer({
  open,
  onClose,
  site,
  dark,
  accent,
  onDemoOnly
}: {
  open: boolean;
  onClose: () => void;
  site: DemoMiniSite;
  dark: string;
  accent: string;
  onDemoOnly: (message: string) => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-20 bg-black/35 backdrop-blur-sm">
      <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-white text-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <p className="font-semibold">{site.checkoutTitle}</p>
            <p className="text-sm text-slate-500">Simulated cart, checkout, or request drawer</p>
          </div>
          <button className="focus-ring rounded-lg p-2 hover:bg-slate-100" onClick={onClose} aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {site.checkoutLines.map((line) => (
            <div key={line.name} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{line.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{line.meta}</p>
                </div>
                <p className="text-sm font-bold" style={{ color: dark }}>{line.price}</p>
              </div>
            </div>
          ))}
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {site.flowSummary.map((summary) => (
              <div key={summary} className="flex gap-2 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
                {summary}
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-200 p-5">
          <button
            onClick={() => onDemoOnly("Checkout/payment is demo only. Production builds can connect Square and fulfillment workflows.")}
            className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: dark }}
          >
            Continue demo checkout
          </button>
        </div>
      </aside>
    </div>
  );
}

function DemoCheckoutPreview({ title, lines, dark, accent, onCart }: { title: string; lines: DemoItem[]; dark: string; accent: string; onCart: () => void }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-950">{title}</p>
        <CreditCard className="h-5 w-5" style={{ color: accent }} />
      </div>
      <div className="mt-4 space-y-3">
        {lines.map((line) => (
          <div key={line.name} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
            <div>
              <p className="font-semibold">{line.name}</p>
              <p className="text-xs text-slate-500">{line.meta}</p>
            </div>
            <p className="font-bold" style={{ color: dark }}>{line.price}</p>
          </div>
        ))}
      </div>
      <button onClick={onCart} className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: dark }}>
        Open preview
      </button>
    </div>
  );
}

function DemoBookingForm({
  site,
  dark,
  accent,
  onDemoOnly,
  onRequest
}: {
  site: DemoMiniSite;
  dark: string;
  accent: string;
  onDemoOnly: (message: string) => void;
  onRequest: () => void;
}) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-slate-950">{site.flowTitle}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{site.flowDescription}</p>
      <div className="mt-5 grid gap-3">
        {site.flowFields.map((field, index) => (
          <label key={field} className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{field}</span>
            <button
              onClick={() => onDemoOnly(`${field} selector opened for demo only.`)}
              className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-800"
            >
              {index === 0 ? site.categories[0] : "Choose option"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </label>
        ))}
      </div>
      <div className="mt-5 grid gap-2 rounded-lg border border-slate-200 bg-white p-4">
        {site.flowSummary.slice(0, 3).map((summary) => (
          <div key={summary} className="flex gap-2 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
            {summary}
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button onClick={onDemoOnly.bind(null, "Demo-only form submitted. Production builds save this to CRM/admin workflows.")} className="rounded-lg px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: dark }}>
          Preview submit
        </button>
        <button onClick={onRequest} className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50">
          Build this flow
        </button>
      </div>
    </div>
  );
}

function DemoServiceCard({ service, dark, accent }: { service: DemoItem; dark: string; accent: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid h-10 w-10 place-items-center rounded-lg text-white" style={{ backgroundColor: dark }}>
        <CheckCircle2 className="h-5 w-5" style={{ color: accent }} />
      </div>
      <h4 className="mt-4 font-semibold text-slate-950">{service.name}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
      {service.meta ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{service.meta}</p> : null}
    </article>
  );
}

function DemoSearchFilter({ categories, dark, onFilter }: { categories: string[]; dark: string; onFilter: (category: string) => void }) {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Search className="h-4 w-4 text-slate-500" />
        <span className="text-sm text-slate-500">Search, filter, or browse mock records</span>
        <Filter className="ml-auto h-4 w-4 text-slate-500" />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((category) => (
          <button key={category} onClick={() => onFilter(category)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            {category}
          </button>
        ))}
        <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: dark }}>Live filters</span>
      </div>
    </div>
  );
}

function DemoGallery({ title, items, dark, accent }: { title: string; items: DemoItem[]; dark: string; accent: string }) {
  return (
    <div>
      <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {items.map((item, index) => (
          <article key={item.name} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="h-28" style={{ background: `linear-gradient(135deg, ${index % 2 ? accent : dark}, ${item.imageTone || "#f8fafc"})` }} />
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.meta}</p>
              <h4 className="mt-2 font-semibold text-slate-950">{item.name}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DemoTestimonial({ review, accent }: { review: { name: string; quote: string; detail: string }; accent: string }) {
  return (
    <blockquote className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((item) => (
          <Star key={item} className="h-4 w-4 fill-current" style={{ color: accent }} />
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{review.quote}</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100">
          <UserRound className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">{review.name}</p>
          <p className="text-xs text-slate-500">{review.detail}</p>
        </div>
      </div>
    </blockquote>
  );
}

function DemoCTASection({ title, text, dark, onRequest, onDemoOnly }: { title: string; text: string; dark: string; onRequest: () => void; onDemoOnly: () => void }) {
  return (
    <section className="border-b border-slate-200 bg-slate-950 p-5 text-white sm:p-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{text}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={onRequest} className="rounded-lg bg-obsidian-green px-5 py-3 text-sm font-semibold text-slate-950">Get AI estimate</button>
          <button onClick={onDemoOnly} className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10" style={{ boxShadow: `0 0 0 1px ${dark}` }}>
            Contact preview
          </button>
        </div>
      </div>
    </section>
  );
}

function DemoFooter({ site, dark, onNavigate }: { site: DemoMiniSite; dark: string; onNavigate: (page: string) => void }) {
  return (
    <footer className="grid gap-6 bg-white p-5 text-slate-700 sm:p-8 md:grid-cols-[1fr_1fr_1fr]">
      <div>
        <p className="font-semibold text-slate-950">{site.slug.split("-").map(capitalize).join(" ")}</p>
        <p className="mt-2 text-sm leading-6">{site.brandLine}</p>
      </div>
      <div className="grid gap-2 text-sm">
        {site.footerLinks.map((link) => (
          <button key={link} onClick={() => onNavigate(link)} className="w-fit font-semibold hover:underline" style={{ color: dark }}>
            {link}
          </button>
        ))}
      </div>
      <div className="grid gap-2 text-sm">
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Demo city, USA</p>
        <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> Updated for this showcase</p>
        <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Mock scheduling only</p>
        <p className="flex items-center gap-2"><Heart className="h-4 w-4" /> Built by Obsidian Systems LLC</p>
      </div>
    </footer>
  );
}

function DemoToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-white/15 bg-slate-950/95 p-4 text-sm font-semibold text-white shadow-2xl">
      {message}
    </div>
  );
}

function getDarkestSwatch(colors: string[]) {
  return colors
    .filter((color) => /^#[0-9a-f]{6}$/i.test(color))
    .sort((a, b) => luminance(a) - luminance(b))[0];
}

function getLightestSwatch(colors: string[]) {
  return colors
    .filter((color) => /^#[0-9a-f]{6}$/i.test(color))
    .sort((a, b) => luminance(b) - luminance(a))[0];
}

function getAccentSwatch(colors: string[], dark: string) {
  return colors.find((color) => color !== dark && luminance(color) > 80 && luminance(color) < 235) || colors[1];
}

function luminance(color: string) {
  const value = color.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
