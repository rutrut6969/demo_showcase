"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, MonitorSmartphone, PanelLeftClose, PanelLeftOpen, ShoppingBag, X } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { RequestQuoteModal, type RequestMetadata } from "@/components/RequestQuoteModal";
import { demoNotice, demoTemplates, type DemoTemplateData } from "@/lib/data";

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
  }, [activeDemo.slug, router]);

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
                <Button variant="secondary" onClick={() => setRequest({ ...metadata, recommendedPackage: "Style Customization" })}>
                  Customize This Platform
                </Button>
                <Button onClick={() => setRequest(metadata)}>Get AI Estimate</Button>
              </div>
            </div>
          </header>

          <div className="px-4 py-5 xl:px-8">
            <div className="rounded-lg border border-obsidian-green/25 bg-obsidian-green/10 p-4 text-sm leading-6 text-emerald-50">
              {demoNotice}
            </div>
          </div>

          <DemoExperience
            demo={activeDemo}
            activePage={activePage}
            onPageChange={setActivePage}
            onRequest={(recommendedPackage) => setRequest({ ...metadata, recommendedPackage })}
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
        <Button onClick={() => setRequest(metadata)}>Get AI Estimate</Button>
        <Button variant="secondary" onClick={() => setRequest({ ...metadata, recommendedPackage: "Style Customization" })}>
          Customize This Platform
        </Button>
      </div>

      <RequestQuoteModal open={Boolean(request)} onClose={() => setRequest(null)} metadata={request || {}} />
    </main>
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
  const pages = ["Home", ...demo.pages];
  const paletteValues = Object.values(demo.palette);

  return (
    <div className="px-4 pb-28 xl:px-8">
      <div className="demo-surface overflow-hidden rounded-lg border border-white/10">
        <div className={`bg-gradient-to-br ${demo.accentClass} p-[1px]`}>
          <div className="rounded-t-lg bg-black/78 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-white/20 bg-white/14">Demo experience</Badge>
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

        <div className="border-b border-white/10 bg-black/34 p-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`focus-ring shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activePage === page ? "bg-white text-black" : "bg-white/8 text-slate-200 hover:bg-white/14"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
          <div className="p-4 sm:p-6">
            <DemoPageContent demo={demo} activePage={activePage} paletteValues={paletteValues} onRequest={onRequest} />
          </div>
          <aside className="border-t border-white/10 bg-black/28 p-4 sm:p-6 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-obsidian-green" />
              <h2 className="font-semibold text-white">Platform controls</h2>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Audience</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{demo.audience}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Palette</p>
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {Object.entries(demo.palette).map(([name, color]) => (
                    <div key={name} title={name} className="h-10 rounded-lg border border-white/15" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Features shown</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {demo.features.map((feature) => (
                    <Badge key={feature}>{feature}</Badge>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => onRequest("AI Quote Funnel Package")}>
                Get AI Estimate
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DemoPageContent({
  demo,
  activePage,
  paletteValues,
  onRequest
}: {
  demo: DemoTemplateData;
  activePage: string;
  paletteValues: string[];
  onRequest: (recommendedPackage: string) => void;
}) {
  const primary = paletteValues[0] || "#fff";
  const secondary = paletteValues[1] || "#8B5CF6";
  const dark = getDarkestSwatch(paletteValues) || "#111827";

  const pageCards = demo.features.slice(0, 6);

  return (
    <div className="rounded-lg bg-white text-slate-950 shadow-2xl">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg text-white" style={{ backgroundColor: dark }}>
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{demo.name}</p>
            <p className="text-xs text-slate-500">{activePage} preview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Contact</button>
          <button className="rounded-full px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: dark }}>
            Start request
          </button>
        </div>
      </div>

      <section className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: dark }}>
            {demo.style}
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
            {activePage === "Home" ? `A production-ready direction for ${demo.audience.split(",")[0].toLowerCase()}.` : `${activePage} systems with real workflow depth.`}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            This mock page shows how navigation, conversion sections, content hierarchy, and operational modules can be adapted into a live business platform.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => onRequest(demo.recommendedPackage)}
              className="rounded-lg px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: dark }}
            >
              Request This Demo Style
            </button>
            <button
              onClick={() => onRequest("Custom Production Deployment")}
              className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Customize This Platform
            </button>
          </div>
        </div>
        <div className="grid min-h-[360px] grid-cols-2 gap-3">
          <div className="rounded-lg p-4" style={{ backgroundColor: primary }}>
            <div className="h-full rounded-lg border border-black/10 bg-white/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Featured</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{demo.features[0]}</p>
            </div>
          </div>
          <div className="rounded-lg p-4 text-white" style={{ backgroundColor: dark }}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">Operations</p>
            <p className="mt-3 text-2xl font-semibold">{demo.features[1] || "Lead workflow"}</p>
            <div className="mt-8 h-2 rounded-full bg-white/20">
              <div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: secondary }} />
            </div>
          </div>
          <div className="col-span-2 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{activePage} module preview</p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Interactive demo</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {pageCards.slice(2, 5).map((feature) => (
                <div key={feature} className="rounded-lg bg-slate-100 p-3">
                  <p className="text-sm font-semibold">{feature}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Production logic, admin settings, and integrations can be connected.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 p-5 sm:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          {demo.features.slice(0, 3).map((feature, index) => (
            <div key={feature} className="rounded-lg border border-slate-200 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: index % 2 ? secondary : dark }}>
                0{index + 1}
              </div>
              <h3 className="mt-4 font-semibold">{feature}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">A client-ready interface pattern with admin-operable backend potential.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between gap-4 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="font-semibold">Ready to turn this direction into a real platform?</p>
          <p className="mt-1 text-sm text-slate-600">Send the metadata into the AI quote funnel and admin review workflow.</p>
        </div>
        <button
          onClick={() => onRequest("AI Quote Funnel Package")}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: dark }}
        >
          Get AI Estimate <ChevronRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
}

function getDarkestSwatch(colors: string[]) {
  return colors
    .filter((color) => /^#[0-9a-f]{6}$/i.test(color))
    .sort((a, b) => luminance(a) - luminance(b))[0];
}

function luminance(color: string) {
  const value = color.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
