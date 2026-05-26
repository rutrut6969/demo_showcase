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
  Minus,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
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
  const pageContent = getDemoPageContent(site, activePage);

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
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">{pageContent.heroTitle}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">{pageContent.heroText}</p>
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
              <DemoScene site={site} activePage={activePage} variant="hero" dark={dark} accent={accent} />
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
            </div>
          </div>
        </section>

        <main className="space-y-0">
          <DemoPagePanel pageContent={pageContent} site={site} dark={dark} accent={accent} onDemoOnly={showDemoToast} />

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
                <DemoProductCard key={item.name} item={item} siteSlug={site.slug} dark={dark} accent={accent} onAdd={() => setCartOpen(true)} />
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
            text="Connect the visible demo experience to real backend systems, payments, CRM records, analytics, and internal workflows."
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

function DemoPagePanel({
  pageContent,
  site,
  dark,
  accent,
  onDemoOnly
}: {
  pageContent: ReturnType<typeof getDemoPageContent>;
  site: DemoMiniSite;
  dark: string;
  accent: string;
  onDemoOnly: (message: string) => void;
}) {
  return (
    <section className="grid gap-0 border-b border-slate-200 bg-white lg:grid-cols-[0.8fr_1.2fr]">
      <div className="border-b border-slate-200 p-5 sm:p-8 lg:border-b-0 lg:border-r">
        <p className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: dark }}>{pageContent.label}</p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-950">{pageContent.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{pageContent.description}</p>
        <div className="mt-5 grid gap-2">
          {pageContent.actions.map((action) => (
            <button
              key={action}
              onClick={() => onDemoOnly(`${action} opens a polished simulated ${site.slug.replaceAll("-", " ")} workflow.`)}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-white"
            >
              {action}
              <ChevronRight className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:p-8 md:grid-cols-3">
        {pageContent.cards.map((card) => (
          <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 h-24 overflow-hidden rounded-lg" style={{ background: `linear-gradient(135deg, ${accent}, ${dark})` }}>
              <DemoVisual siteSlug={site.slug} item={{ name: card.title, imageTone: accent }} accent={accent} compact />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{card.meta}</p>
            <h4 className="mt-2 font-semibold text-slate-950">{card.title}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DemoScene({
  site,
  activePage,
  variant,
  dark,
  accent
}: {
  site: DemoMiniSite;
  activePage: string;
  variant: "hero";
  dark: string;
  accent: string;
}) {
  return (
    <div className="relative min-h-[250px] overflow-hidden rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="absolute inset-0 opacity-95" style={{ background: `linear-gradient(135deg, ${site.items[0]?.imageTone || accent}, #ffffff 42%, ${accent})` }} />
      <div className="relative rounded-lg border border-white/70 bg-white/72 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: dark }}>{activePage}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{site.checkoutTitle}</p>
          </div>
          <ShoppingCart className="h-5 w-5" style={{ color: accent }} />
        </div>
        <div className="mt-4 grid gap-3">
          {site.checkoutLines.slice(0, 3).map((line) => (
            <div key={line.name} className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg" style={{ backgroundColor: line.imageTone || accent }}>
                <DemoVisual siteSlug={site.slug} item={line} accent={accent} compact />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-950">{line.name}</p>
                <p className="truncate text-xs text-slate-500">{line.meta}</p>
              </div>
              <p className="text-sm font-bold" style={{ color: dark }}>{line.price}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-3 grid grid-cols-3 gap-2">
        {site.items.slice(0, 3).map((item) => (
          <div key={item.name} className="h-20 overflow-hidden rounded-lg border border-white/50 bg-white/45 shadow-sm">
            <DemoVisual siteSlug={site.slug} item={item} accent={accent} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoVisual({ siteSlug, item, accent, compact = false }: { siteSlug: string; item: DemoItem; accent: string; compact?: boolean }) {
  const tone = item.imageTone || accent;
  const isFood = siteSlug.includes("kitchen");
  const isFashion = siteSlug.includes("ember");
  const isRealty = siteSlug.includes("realty");
  const isHealth = siteSlug.includes("chiropractic") || siteSlug.includes("practice");
  const isOutdoor = siteSlug.includes("evergreen");
  const isTech = siteSlug.includes("tech") || siteSlug.includes("velocity");
  const isCraft = siteSlug.includes("crafted");

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: `radial-gradient(circle at 22% 18%, rgba(255,255,255,.62), transparent 24%), linear-gradient(135deg, ${tone}, ${accent})` }}>
      {isFood ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className={compact ? "h-16 w-16 rounded-full border-[10px] border-[#E0A106] bg-[#C0392B]" : "h-28 w-28 rounded-full border-[16px] border-[#E0A106] bg-[#C0392B] shadow-xl"}>
            <div className="m-3 grid grid-cols-3 gap-1">
              {[0, 1, 2, 3, 4, 5].map((dot) => <span key={dot} className="h-2 w-2 rounded-full bg-[#F8F4EC]" />)}
            </div>
          </div>
        </div>
      ) : isFashion ? (
        <div className="absolute inset-x-5 bottom-0 flex items-end justify-center gap-3">
          <div className="h-24 w-12 rounded-t-full bg-black/75" />
          <div className="h-32 w-16 rounded-t-[2rem] bg-white/80" />
          <div className="h-20 w-10 rounded-t-full bg-[#C8A96B]" />
        </div>
      ) : isRealty ? (
        <div className="absolute inset-x-4 bottom-4">
          <div className="mx-auto h-20 max-w-[170px] rounded-t-lg bg-white shadow-lg">
            <div className="mx-auto h-8 w-20 -translate-y-5 rotate-45 bg-[#334155]" />
            <div className="grid grid-cols-3 gap-2 px-4">
              {[0, 1, 2].map((win) => <span key={win} className="h-5 rounded bg-[#3B82F6]/40" />)}
            </div>
          </div>
        </div>
      ) : isHealth ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white/80 shadow-lg">
            <div className="relative h-14 w-14">
              <span className="absolute left-5 top-0 h-14 w-4 rounded bg-[#2563EB]" />
              <span className="absolute left-0 top-5 h-4 w-14 rounded bg-[#2563EB]" />
            </div>
          </div>
        </div>
      ) : isOutdoor ? (
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[#2F5D50]">
          <div className="absolute bottom-0 left-8 h-20 w-24 rounded-t-full bg-[#8B5E3C]" />
          <div className="absolute bottom-8 right-8 h-20 w-20 rounded-full bg-[#F7F4ED]/70" />
          <div className="absolute bottom-5 right-16 h-16 w-24 rounded bg-[#EA580C]/80" />
        </div>
      ) : isTech ? (
        <div className="absolute inset-4 rounded-lg border border-white/30 bg-black/60 p-3">
          <div className="h-4 w-20 rounded bg-white/30" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((cell) => <span key={cell} className="h-8 rounded border border-white/20 bg-white/10" />)}
          </div>
        </div>
      ) : isCraft ? (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-3 pb-5">
          <div className="h-28 w-14 rounded-b-2xl rounded-t-lg bg-white/80 shadow-lg" />
          <div className="h-16 w-16 rounded-full bg-[#D9B8A1] shadow-lg" />
          <div className="h-24 w-9 rounded-full bg-[#8DAA91] shadow-lg" />
        </div>
      ) : (
        <div className="absolute inset-5 rounded-lg border border-white/35 bg-white/24" />
      )}
      <div className="absolute bottom-3 left-3 right-3 rounded bg-black/35 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur">
        {item.name}
      </div>
    </div>
  );
}

function DemoProductCard({ item, siteSlug, dark, accent, onAdd }: { item: DemoItem; siteSlug: string; dark: string; accent: string; onAdd: () => void }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-44 overflow-hidden" style={{ backgroundColor: item.imageTone || accent }}>
        <DemoVisual siteSlug={siteSlug} item={item} accent={accent} />
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
  const [step, setStep] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(site.checkoutLines.map((line) => [line.name, 1]))
  );
  const steps = ["Cart", "Contact", "Delivery", "Payment", "Review", "Done"];
  const subtotal = site.checkoutLines.reduce((total, line) => total + parseMoney(line.price) * (quantities[line.name] || 1), 0);
  const tax = Math.round(subtotal * 0.07 * 100) / 100;
  const shipping = site.slug.includes("petes") || site.slug.includes("crafted") ? 0 : subtotal > 100 ? 0 : 8.95;
  const total = subtotal + tax + shipping;

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
        <div className="border-b border-slate-200 px-5 py-3">
          <div className="grid grid-cols-6 gap-1">
            {steps.map((label, index) => (
              <button
                key={label}
                onClick={() => setStep(index)}
                className="h-2 rounded-full transition"
                aria-label={`Go to ${label}`}
                style={{ backgroundColor: index <= step ? dark : "#E2E8F0" }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{steps[step]} step</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {step === 0 ? (
            <div className="space-y-3">
              {site.checkoutLines.map((line) => (
                <div key={line.name} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{line.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{line.meta}</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: dark }}>{line.price}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm font-semibold text-slate-600">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantities((current) => ({ ...current, [line.name]: Math.max(1, (current[line.name] || 1) - 1) }))}
                        className="rounded border border-slate-200 bg-white p-1"
                        aria-label={`Decrease ${line.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{quantities[line.name] || 1}</span>
                      <button
                        onClick={() => setQuantities((current) => ({ ...current, [line.name]: (current[line.name] || 1) + 1 }))}
                        className="rounded border border-slate-200 bg-white p-1"
                        aria-label={`Increase ${line.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <label className="block rounded-lg border border-dashed border-slate-300 p-4">
                <span className="text-sm font-semibold text-slate-700">Promo code</span>
                <input className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500" placeholder="DEMO10" />
              </label>
            </div>
          ) : step === 1 ? (
            <DemoCheckoutForm title="Contact information" fields={["Full name", "Email", "Phone", "Order notes"]} />
          ) : step === 2 ? (
            <div className="space-y-3">
              <DemoCheckoutForm title="Delivery or pickup" fields={["Address or pickup location", "City", "State", "Zip code"]} />
              <div className="grid gap-2">
                {["Local pickup", "Standard shipping", "Priority / rush handling"].map((option, index) => (
                  <button key={option} onClick={() => onDemoOnly(`${option} selected for demo checkout.`)} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold">
                    {option}
                    <span className="text-slate-500">{index === 0 ? "$0" : index === 1 ? "$8.95" : "$18.00"}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : step === 3 ? (
            <div className="space-y-3">
              <DemoCheckoutForm title="Payment form mockup" fields={["Card number", "Expiration", "CVC", "Billing zip"]} />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Square Web Payments SDK can power this form in production. No real payment is collected in the showcase.
              </div>
            </div>
          ) : step === 4 ? (
            <OrderSummary site={site} subtotal={subtotal} tax={tax} shipping={shipping} total={total} dark={dark} />
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
              <div>
                <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: accent }} />
                <h3 className="mt-4 text-2xl font-semibold">Demo order confirmed</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Order #{Math.floor(100000 + subtotal * 73)} was generated as a fake confirmation screen for this showcase.</p>
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-slate-200 p-5">
          <div className="mb-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping / pickup</span><span>${shipping.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button onClick={() => setStep((value) => Math.max(0, value - 1))} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Back
            </button>
            <button
              onClick={() => {
                if (step >= steps.length - 1) {
                  onDemoOnly("This checkout is demo only. Production builds can connect Square and fulfillment workflows.");
                  return;
                }
                setStep((value) => value + 1);
              }}
              className="rounded-lg px-5 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: dark }}
            >
              {step === steps.length - 2 ? "Place fake order" : step === steps.length - 1 ? "Demo only" : "Continue"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DemoCheckoutForm({ title, fields }: { title: string; fields: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-3">
        {fields.map((field) => (
          <label key={field} className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{field}</span>
            <input className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-500" placeholder={field} />
          </label>
        ))}
      </div>
    </div>
  );
}

function OrderSummary({ site, subtotal, tax, shipping, total, dark }: { site: DemoMiniSite; subtotal: number; tax: number; shipping: number; total: number; dark: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-950">Review order</h3>
        <div className="mt-4 space-y-3">
          {site.checkoutLines.map((line) => (
            <div key={line.name} className="flex justify-between gap-3 text-sm">
              <span className="text-slate-600">{line.name}</span>
              <span className="font-semibold text-slate-950">{line.price}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        {[
          ["Subtotal", subtotal],
          ["Estimated tax", tax],
          ["Shipping / pickup", shipping],
          ["Total", total]
        ].map(([label, value]) => (
          <div key={label as string} className="flex justify-between py-1">
            <span>{label as string}</span>
            <span className="font-semibold" style={{ color: label === "Total" ? dark : undefined }}>${(value as number).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        Confirmation, order number, receipt email, CRM record, fulfillment status, and analytics events can all be connected in a production build.
      </div>
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
        <button onClick={onDemoOnly.bind(null, "Demo-only form submitted. Production builds save this to CRM and internal workflows.")} className="rounded-lg px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: dark }}>
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
            <div className="relative h-32 overflow-hidden" style={{ background: `linear-gradient(135deg, ${index % 2 ? accent : dark}, ${item.imageTone || "#f8fafc"})` }}>
              <DemoVisual siteSlug="gallery" item={item} accent={accent} compact />
            </div>
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

function getDemoPageContent(site: DemoMiniSite, activePage: string) {
  const page = activePage || "Home";
  const baseCards = [
    {
      title: site.items[0]?.name || site.itemsTitle,
      text: site.items[0]?.description || site.heroText,
      meta: site.items[0]?.price || "Featured"
    },
    {
      title: site.services[0]?.name || site.servicesTitle,
      text: site.services[0]?.description || site.flowDescription,
      meta: site.services[0]?.meta || "Workflow"
    },
    {
      title: site.gallery[0]?.name || site.galleryTitle,
      text: site.gallery[0]?.description || site.promo,
      meta: site.gallery[0]?.meta || "Preview"
    }
  ];

  const pageMap: Record<string, { title: string; description: string; actions: string[] }> = {
    Home: {
      title: "Homepage experience",
      description: "The primary landing view combines brand messaging, high-value CTAs, featured records, social proof, and a realistic conversion path.",
      actions: [site.primaryAction, site.secondaryAction, "Open contact flow"]
    },
    Shop: {
      title: "Product catalog page",
      description: "A browsable storefront with categories, featured items, variants, reviews, inventory messaging, and event pickup context.",
      actions: ["Filter products", "Open cart", "Preview checkout"]
    },
    "Custom Orders": {
      title: "Custom order studio",
      description: "A guided personalization page for names, colors, product options, due dates, notes, and photo upload placeholders.",
      actions: ["Choose product base", "Add personalization", "Request maker quote"]
    },
    Events: {
      title: "Events and pickup page",
      description: "Vendor events, pickup windows, booth details, preorders, limited drops, and local pickup rules are presented as a real operations page.",
      actions: ["Reserve event pickup", "View booth details", "Join event list"]
    },
    Reviews: {
      title: "Customer proof page",
      description: "Testimonials, ratings, buyer photos, and trust messaging help visitors picture a real business with active customers.",
      actions: ["Read reviews", "Submit review", "Share product"]
    },
    Contact: {
      title: "Contact and lead capture page",
      description: "A complete contact page combines phone, email, location context, preferred-contact fields, and source tracking.",
      actions: ["Choose contact method", "Send message", "Request callback"]
    },
    Collections: {
      title: "Collection landing page",
      description: "Seasonal product groups, editorial collection copy, variant selectors, and style-led merchandising for boutique commerce.",
      actions: ["Open fall capsule", "Filter by size", "Save look"]
    },
    Lookbook: {
      title: "Lookbook page",
      description: "Editorial image panels connect complete outfits to shoppable items, newsletter capture, and collection navigation.",
      actions: ["Shop the look", "Save outfit", "Join drop list"]
    },
    "New Arrivals": {
      title: "New arrivals page",
      description: "Fresh inventory, low-stock messaging, product variants, and cart preview behavior simulate a real boutique launch.",
      actions: ["Select size", "Add to cart", "Apply promo"]
    },
    Journal: {
      title: "Journal and brand story",
      description: "Articles, styling notes, release previews, and brand updates deepen the site beyond a simple catalog.",
      actions: ["Read article", "Browse collection", "Subscribe"]
    },
    Offer: {
      title: "Single offer page",
      description: "A conversion-focused product page with urgency, trust badges, bundles, reviews, shipping estimates, and a sticky checkout path.",
      actions: ["Claim bundle", "Add warranty", "Review order"]
    },
    Bundles: {
      title: "Bundles and upsells",
      description: "Quantity breaks, add-ons, cross-sells, and bundle logic demonstrate revenue-focused ecommerce capability.",
      actions: ["Build bundle", "Compare savings", "Open checkout"]
    },
    Shipping: {
      title: "Shipping and fulfillment",
      description: "Delivery estimates, tracking messaging, return rules, and support prompts show the operational side of fulfillment.",
      actions: ["Estimate shipping", "Track order", "Read returns"]
    },
    FAQ: {
      title: "FAQ support page",
      description: "Structured answers reduce support friction while keeping shoppers moving toward checkout or contact.",
      actions: ["Open answer", "Contact support", "Start request"]
    },
    Menu: {
      title: "Restaurant menu page",
      description: "Pizza, wings, salads, desserts, drinks, modifiers, specials, and prep-time messaging are organized for fast ordering.",
      actions: ["Choose category", "Customize item", "Open pickup cart"]
    },
    "Order Pickup": {
      title: "Pickup ordering page",
      description: "A staged order builder with pickup time, cart totals, taxes, and confirmation messaging demonstrates restaurant ordering depth.",
      actions: ["Set pickup time", "Review cart", "Place fake order"]
    },
    Specials: {
      title: "Specials page",
      description: "Limited-time bundles, lunch combos, family meals, and promo banners give the restaurant demo real campaign texture.",
      actions: ["Add special", "Apply coupon", "Share deal"]
    },
    Catering: {
      title: "Catering request page",
      description: "Guest counts, trays, event dates, delivery notes, and callback requests turn catering into a structured lead flow.",
      actions: ["Select tray", "Enter guest count", "Request catering"]
    },
    Jobs: {
      title: "Careers page",
      description: "Open roles, availability, applicant information, and hiring workflow placeholders round out the business site.",
      actions: ["View roles", "Start application", "Submit interest"]
    },
    Careers: {
      title: "Careers page",
      description: "Open roles, availability, applicant information, and hiring workflow placeholders round out the business site.",
      actions: ["View roles", "Start application", "Submit interest"]
    },
    Services: {
      title: "Services page",
      description: "Service cards, care pathways, packages, and quote or appointment CTAs help the visitor find the right next step.",
      actions: ["Compare services", "Open request form", "View FAQ"]
    },
    Appointments: {
      title: "Appointment booking page",
      description: "Visit reason, preferred provider, date options, insurance or service details, and callback workflow are presented cleanly.",
      actions: ["Choose visit type", "Pick time", "Request appointment"]
    },
    Intake: {
      title: "Intake form preview",
      description: "A patient or service intake flow collects core details while showing how secure production forms could be connected.",
      actions: ["Start intake", "Upload file", "Save progress"]
    },
    "Patient Intake": {
      title: "Patient intake page",
      description: "New-patient context, insurance information, intake steps, and office review notes are organized for a healthcare workflow.",
      actions: ["Begin intake", "Verify insurance", "Read privacy notes"]
    },
    Insurance: {
      title: "Insurance and payment page",
      description: "Accepted plans, verification steps, self-pay options, and billing notes are displayed without overwhelming the visitor.",
      actions: ["Check plan", "View self-pay", "Ask billing question"]
    },
    Blog: {
      title: "Education article hub",
      description: "Guides, FAQs, and resource previews support SEO and help clients see how content can drive trust.",
      actions: ["Read guide", "Browse resources", "Request topic"]
    },
    Providers: {
      title: "Provider directory",
      description: "Provider profiles, specialties, availability, and appointment CTAs create a credible medical practice experience.",
      actions: ["View provider", "Choose location", "Request visit"]
    },
    Resources: {
      title: "Patient resource center",
      description: "Forms, refill instructions, announcements, portal links, and policy cards reduce front-desk friction.",
      actions: ["Open forms", "View announcement", "Contact office"]
    },
    Portal: {
      title: "Portal integration placeholder",
      description: "A future portal area can connect messages, records, invoices, files, and project or patient updates.",
      actions: ["Preview portal", "Request access", "Read security note"]
    },
    Announcements: {
      title: "Office announcements",
      description: "Clinic notices, holiday hours, vaccine clinics, portal updates, and maintenance messages are treated as real content.",
      actions: ["View notice", "Subscribe", "Contact office"]
    },
    "Repair Intake": {
      title: "Repair intake page",
      description: "Device model, issue type, service area, priority level, appointment window, and deposit preview form a complete intake.",
      actions: ["Select device", "Estimate quote", "Book priority"]
    },
    Devices: {
      title: "Device service catalog",
      description: "Phones, tablets, laptops, consoles, and accessory services are listed with pricing ranges and requirements.",
      actions: ["Choose device", "Check parts", "Start repair"]
    },
    Tracker: {
      title: "Repair tracker page",
      description: "Ticket status, technician notes, part availability, and customer updates show production-ready service tracking potential.",
      actions: ["Enter ticket", "View status", "Message tech"]
    },
    Invoice: {
      title: "Invoice and deposit page",
      description: "A branded invoice preview with deposit, line items, terms, and Square-powered payment placeholders.",
      actions: ["Approve invoice", "Request revision", "Pay fake deposit"]
    },
    "Tech Dashboard": {
      title: "Technician dashboard preview",
      description: "Route notes, device checklist, invoice status, repair stages, and customer communication are mocked for operations.",
      actions: ["Open route", "Update status", "Attach note"]
    },
    "Practice Areas": {
      title: "Practice area page",
      description: "Professional service categories, consultation paths, credentials, proof points, and article previews build trust.",
      actions: ["Choose matter", "Read credential", "Request consult"]
    },
    Attorneys: {
      title: "Team profile page",
      description: "Staff profiles, credentials, focus areas, and consultation CTAs make the firm feel established and credible.",
      actions: ["View profile", "Check availability", "Book consult"]
    },
    Consultation: {
      title: "Consultation intake page",
      description: "Matter type, urgency, conflict-check placeholder, document notes, and contact preferences are presented as a premium form.",
      actions: ["Start intake", "Upload document", "Schedule consult"]
    },
    Results: {
      title: "Results and case examples",
      description: "Outcome cards, disclaimers, testimonials, and resource links add proof without implying guaranteed results.",
      actions: ["Read result", "View resource", "Request consult"]
    },
    Listings: {
      title: "Property listings page",
      description: "Search filters, property cards, saved homes, listing details, and showing requests simulate a brokerage platform.",
      actions: ["Filter listings", "Save home", "Book showing"]
    },
    Neighborhoods: {
      title: "Neighborhood guide",
      description: "Lifestyle notes, schools, commute context, market stats, and featured listings support buyers researching areas.",
      actions: ["Explore area", "View listings", "Contact agent"]
    },
    Agents: {
      title: "Agent profile page",
      description: "Agent bios, specialties, reviews, active listings, and lead forms make the team feel real.",
      actions: ["View agent", "Ask question", "Book showing"]
    },
    Valuation: {
      title: "Home valuation flow",
      description: "Address entry, property condition, timeline, and contact capture demonstrate seller lead generation.",
      actions: ["Enter address", "Estimate value", "Request CMA"]
    },
    Gallery: {
      title: "Visual gallery page",
      description: "Image grids, before-and-after cards, property photos, or project photos demonstrate visual credibility.",
      actions: ["Open gallery", "Compare views", "Request quote"]
    },
    Financing: {
      title: "Financing page",
      description: "Monthly payment messaging, qualifying project types, FAQ, and call-to-action cards support larger-ticket projects.",
      actions: ["Estimate monthly", "Read terms", "Request quote"]
    },
    "Service Areas": {
      title: "Service area page",
      description: "Coverage maps, city lists, travel notes, and local proof help visitors know whether the business serves them.",
      actions: ["Check zip code", "View map", "Request visit"]
    },
    Quote: {
      title: "Quote request page",
      description: "Project details, timeline, budget, photos, financing interest, and scheduling preferences feed a structured lead workflow.",
      actions: ["Add project details", "Upload photos", "Submit quote"]
    }
  };

  const fallback = pageMap.Home;
  const content = pageMap[page] || fallback;
  return {
    label: page,
    heroTitle: page === "Home" ? site.heroTitle : content.title,
    heroText: page === "Home" ? site.heroText : content.description,
    title: content.title,
    description: content.description,
    actions: content.actions,
    cards: baseCards
  };
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

function parseMoney(value?: string) {
  if (!value) return 0;
  const match = value.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
