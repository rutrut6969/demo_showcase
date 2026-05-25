"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bot, CreditCard, DatabaseZap, LockKeyhole, Menu, Sparkles, X } from "lucide-react";
import { Badge, Button, Section, StatCard } from "@/components/ui";
import { RequestQuoteModal, type RequestMetadata } from "@/components/RequestQuoteModal";
import { demoTemplates, featuredProjects, retainerTiers } from "@/lib/data";

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [request, setRequest] = useState<RequestMetadata | null>(null);

  return (
    <main className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[720px]" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-obsidian-950/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-obsidian-purple/40 bg-obsidian-purple/16 shadow-glow">
              <Sparkles className="h-5 w-5 text-obsidian-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Obsidian Systems LLC</p>
              <p className="text-xs text-slate-400">Showcase Platform</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
            <a href="#projects" className="hover:text-white">Projects</a>
            <Link href="/demos" className="hover:text-white">Demos</Link>
            <a href="#retainers" className="hover:text-white">Retainers</a>
            <Link href="/admin" className="hover:text-white">Admin</Link>
          </nav>
          <div className="hidden lg:block">
            <Button onClick={() => setRequest({ sourcePage: "landing-hero", recommendedPackage: "Custom Platform Build", estimatedComplexity: "MODERATE" })}>
              Request platform
            </Button>
          </div>
          <button
            aria-label="Open menu"
            className="focus-ring rounded-lg border border-white/12 bg-white/8 p-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur lg:hidden">
          <div className="ml-auto h-full w-[86vw] max-w-sm border-l border-white/10 bg-obsidian-900 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Navigation</p>
              <button aria-label="Close menu" className="focus-ring rounded-lg p-2 hover:bg-white/10" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8 grid gap-3 text-slate-200">
              {[
                ["Projects", "#projects"],
                ["Demos", "/demos"],
                ["Retainers", "#retainers"],
                ["Admin", "/admin"]
              ].map(([label, href]) => (
                <Link key={label} href={href} onClick={() => setMobileOpen(false)} className="rounded-lg border border-white/10 bg-white/7 px-4 py-3">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <Section className="relative grid min-h-[calc(100vh-72px)] items-center gap-10 pb-12 pt-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Badge className="border-obsidian-green/35 bg-obsidian-green/10 text-obsidian-green">Interactive software demos plus operations</Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
            Obsidian Systems Showcase Platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A premium client-facing demo gallery, AI quote funnel, custom invoice workflow, CRM, analytics hub, and internal admin operating system built for real business development.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/demos">
              <Button className="w-full sm:w-auto">
                Explore demos <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setRequest({ sourcePage: "landing-hero", recommendedPackage: "Custom Platform Build", estimatedComplexity: "MODERATE" })}>
              Get AI estimate
            </Button>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <StatCard label="Demo verticals" value="10" detail="Commerce, healthcare, repair, legal, realty, restaurant, and services." />
            <StatCard label="Admin modules" value="22" detail="CRM, invoices, retainers, AI control, logs, users, tasks, toggles." />
            <StatCard label="Retainers" value="$200+" detail="Managed platform retainers framed around operational care." />
          </div>
        </div>

        <div className="relative">
          <div className="glass animate-floaty rounded-lg p-4">
            <div className="rounded-lg border border-white/10 bg-obsidian-950 p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-semibold text-white">Live operations preview</p>
                  <p className="text-xs text-slate-400">Requests, quotes, invoices, and retainers</p>
                </div>
                <Badge className="border-obsidian-purple/40 text-violet-200">Production-shaped</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  ["AI Quote Generated", "$4.8k-$9.2k", "Commerce Retainer suggested"],
                  ["Invoice Awaiting Review", "$2,500 deposit", "Square payment placeholder ready"],
                  ["Demo Conversion", "24 CTA clicks", "Obsidian Tech E.R. trending"],
                  ["Retainer Health", "8 active", "All integrations monitored"]
                ].map(([title, metric, detail]) => (
                  <div key={title} className="rounded-lg border border-white/10 bg-white/[0.055] p-4 transition hover:border-obsidian-green/35 hover:bg-white/[0.08]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-sm text-obsidian-green">{metric}</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge>Company intro</Badge>
            <h2 className="mt-4 text-3xl font-semibold text-white">Software platforms that sell the vision and run the workflow.</h2>
          </div>
          <p className="text-lg leading-8 text-slate-300">
            Obsidian Systems LLC builds polished, practical web systems for businesses that need more than a brochure. The platform demonstrates vertical-specific experiences while capturing leads, quoting projects, producing branded invoices, and giving the internal team a command center for approvals and delivery.
          </p>
        </div>
      </Section>

      <Section id="projects">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge>Featured projects</Badge>
            <h2 className="mt-4 text-3xl font-semibold text-white">Built to show real operational possibilities.</h2>
          </div>
          <Link href="/demos" className="text-sm font-semibold text-obsidian-green hover:text-white">
            View demo showcase
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {featuredProjects.map((project) => (
            <Link
              key={project.name}
              href={project.link}
              className="glass group flex min-h-[260px] flex-col rounded-lg p-5 transition duration-300 hover:-translate-y-1 hover:border-obsidian-green/35"
            >
              <div className="h-28 rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(139,92,246,0.32),rgba(34,197,94,0.12),rgba(255,255,255,0.06))]" />
              <Badge className="mt-4 w-fit">{project.status}</Badge>
              <h3 className="mt-4 text-lg font-semibold text-white">{project.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/8 px-2 py-1 text-[11px] text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section className="py-10">
        <div className="glass rounded-lg p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <Badge>Demo showcase preview</Badge>
              <h2 className="mt-4 text-3xl font-semibold text-white">Ten complete business directions, one request funnel.</h2>
              <p className="mt-4 text-slate-300">
                Every demo includes a notice banner, multiple UI sections, business-specific CTAs, and metadata-aware request buttons.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {demoTemplates.slice(0, 6).map((demo) => (
                <Link key={demo.slug} href={`/demos?demo=${demo.slug}`} className="rounded-lg border border-white/10 bg-white/6 p-4 transition hover:border-obsidian-green/35 hover:bg-white/10">
                  <p className="text-sm font-semibold text-white">{demo.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{demo.type}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Bot, title: "AI quote funnel", text: "OpenAI-backed quote generation with build range, timeframe, scope, retainer, add-ons, and manual review notes." },
            { icon: CreditCard, title: "Custom invoice workflow", text: "Client-facing invoice pages stay branded while Square powers deposits and payment sync underneath." },
            { icon: LockKeyhole, title: "RBAC admin operations", text: "Super Admin, Admin, and Site Overseer permissions align with approval complexity and sensitive settings." },
            { icon: DatabaseZap, title: "Prisma data model", text: "PostgreSQL-ready relationships for clients, requests, quotes, invoices, retainers, analytics, logs, media, and tasks." }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.055] p-5">
              <item.icon className="h-6 w-6 text-obsidian-green" />
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="retainers">
        <div className="max-w-3xl">
          <Badge>Managed Platform Retainers</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-white">Monthly care is positioned as operational platform management, not basic hosting.</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {retainerTiers.map((tier) => (
            <div key={tier.name} className="glass rounded-lg p-6">
              <p className="text-sm font-semibold text-obsidian-green">{tier.price}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{tier.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{tier.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                {tier.includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-obsidian-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pb-20">
        <div className="glass flex flex-col justify-between gap-6 rounded-lg p-6 sm:p-8 lg:flex-row lg:items-center">
          <div>
            <Badge>Request custom platform</Badge>
            <h2 className="mt-4 text-3xl font-semibold text-white">Start with a demo style, then shape it around the real business.</h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Capture requirements, generate a first estimate, review internally, produce a branded invoice, and move the project into delivery.
            </p>
          </div>
          <Button onClick={() => setRequest({ sourcePage: "landing-cta", recommendedPackage: "Custom Platform Build", estimatedComplexity: "MODERATE" })}>
            Contact / request quote
          </Button>
        </div>
      </Section>

      <RequestQuoteModal open={Boolean(request)} onClose={() => setRequest(null)} metadata={request || {}} />
    </main>
  );
}
