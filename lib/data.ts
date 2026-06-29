import type { ComplexityLevel } from "@prisma/client";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  Gauge,
  BadgeDollarSign,
  Image,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  Megaphone,
  MonitorCog,
  PanelTop,
  ShieldCheck,
  Sparkles,
  SquareStack,
  ToggleLeft,
  Users,
  Workflow
} from "lucide-react";

export const demoNotice =
  "This experience is part of the Obsidian Systems Showcase Platform. Navigation, layouts, animations, and interface systems are interactive for demonstration purposes. Backend functionality, ecommerce systems, scheduling systems, payment processing, customer management, and operational integrations shown throughout these demos can be fully implemented and customized for production deployment.";

export const featuredProjects = [
  {
    name: "HarborSync",
    status: "Concept Build",
    description: "Operations portal concept for harbor teams coordinating scheduling, assets, alerts, and client communication.",
    tags: ["Operations", "Scheduling", "Dashboard"],
    link: "/demos?demo=harbor-family-practice"
  },
  {
    name: "K&K Kustom Kreations",
    status: "Commerce Ready",
    description: "Handmade vendor commerce workflow with product catalog, events, inventory, and AI-assisted item onboarding.",
    tags: ["Ecommerce", "Square", "Vendors"],
    link: "/demos?demo=crafted-commerce"
  },
  {
    name: "Obsidian Tech E.R.",
    status: "Active Demo",
    description: "Emergency mobile repair intake system with quote capture, device diagnostics, deposit, and technician workflow.",
    tags: ["Repair Intake", "Invoices", "Field Ops"],
    link: "/demos?demo=obsidian-tech-er"
  },
  {
    name: "espress.coffee",
    status: "MVP Platform",
    description: "Coffee ordering and brand platform with menu concepts, subscriptions, analytics, and customer flows.",
    tags: ["Restaurant", "Subscriptions", "Brand"],
    link: "/demos?demo=petes-kitchen"
  },
  {
    name: "Obsidian Systems Showcase Platform",
    status: "This Build",
    description: "Full-stack lead generation, demo showcase, AI quote, invoice, CRM, and internal operations platform.",
    tags: ["Next.js", "Prisma", "AI Quotes"],
    link: "/demos"
  }
];

export type DemoTemplateData = {
  slug: string;
  name: string;
  type: string;
  audience: string;
  style: string;
  description: string;
  palette: Record<string, string>;
  features: string[];
  pages: string[];
  recommendedPackage: string;
  complexity: ComplexityLevel;
  accentClass: string;
};

export const demoTemplates: DemoTemplateData[] = [
  {
    slug: "crafted-commerce",
    name: "Crafted Commerce",
    type: "Handmade/vendor ecommerce demo",
    audience: "Craft vendors, handmade sellers, vendor malls, event merchants",
    style: "Warm boutique ecommerce",
    description: "A vendor-ready storefront with catalog, cart, event promotion, Square checkout concepts, and inventory sync patterns.",
    palette: {
      "Warm Cream": "#F7F2EC",
      "Soft Clay": "#D9B8A1",
      "Walnut Brown": "#6B4F43",
      "Sage Green": "#8DAA91",
      Charcoal: "#2E2E2E"
    },
    features: [
      "Product catalog",
      "Featured products",
      "Cart UI",
      "Square checkout concept",
      "Inventory sync concept",
      "Events section",
      "AI-assisted product upload concept",
      "Creator dashboard preview"
    ],
    pages: ["Shop", "Events", "Maker Story", "Cart", "Studio Preview"],
    recommendedPackage: "Commerce Launch",
    complexity: "MODERATE",
    accentClass: "from-[#D9B8A1] via-[#8DAA91] to-[#6B4F43]"
  },
  {
    slug: "ember-oak",
    name: "Ember & Oak",
    type: "Boutique fashion ecommerce demo",
    audience: "Boutiques, apparel drops, premium lifestyle shops",
    style: "Luxury minimal fashion",
    description: "A polished fashion commerce experience with collections, variants, lookbook storytelling, and cart conversion patterns.",
    palette: {
      "Matte Black": "#121212",
      Ivory: "#F5F2ED",
      Gold: "#C8A96B",
      "Dust Gray": "#8B8B8B",
      "Deep Olive": "#4E5B50"
    },
    features: ["Collections", "Product variants", "Lookbook", "Promo banner", "Featured products", "Newsletter signup", "Cart preview"],
    pages: ["Collections", "Lookbook", "New Arrivals", "Cart", "Journal"],
    recommendedPackage: "Premium Commerce",
    complexity: "MODERATE",
    accentClass: "from-[#121212] via-[#C8A96B] to-[#4E5B50]"
  },
  {
    slug: "velocity-fulfillment",
    name: "Velocity Fulfillment",
    type: "Dropshipping ecommerce demo",
    audience: "Product entrepreneurs, direct-response stores, dropshipping operators",
    style: "High-conversion ecommerce",
    description: "A conversion-focused product funnel with urgency, trust, reviews, sticky cart, and upsell messaging.",
    palette: {
      "Electric Blue": "#2563EB",
      White: "#FFFFFF",
      "Dark Slate": "#111827",
      "Neon Green": "#22C55E",
      "Light Gray": "#E5E7EB"
    },
    features: ["Trending product page", "Urgency banner", "Trust badges", "Reviews", "Sticky add-to-cart", "Upsells/cross-sells", "Shipping messaging"],
    pages: ["Offer", "Reviews", "Bundles", "Shipping", "Checkout"],
    recommendedPackage: "Growth Commerce",
    complexity: "MODERATE",
    accentClass: "from-[#2563EB] via-[#22C55E] to-[#111827]"
  },
  {
    slug: "petes-kitchen",
    name: "Pete's Kitchen",
    type: "Restaurant ordering demo",
    audience: "Pizza shops, cafes, food trucks, family restaurants",
    style: "Warm modern restaurant / pizza shop",
    description: "A restaurant ordering interface with menu browsing, pickup flow, specials, catering, hiring, and location CTAs.",
    palette: {
      "Tomato Red": "#C0392B",
      "Pizza Gold": "#E0A106",
      Cream: "#F8F4EC",
      "Olive Green": "#556B2F",
      "Brick Brown": "#5C4033"
    },
    features: ["Menu", "Pickup ordering flow UI", "Specials", "Catering request", "Job application portal", "Location/contact section"],
    pages: ["Menu", "Order Pickup", "Specials", "Catering", "Careers"],
    recommendedPackage: "Local Ordering Platform",
    complexity: "LOW",
    accentClass: "from-[#C0392B] via-[#E0A106] to-[#556B2F]"
  },
  {
    slug: "northwood-chiropractic",
    name: "Northwood Chiropractic",
    type: "Chiropractic clinic demo",
    audience: "Chiropractors, wellness clinics, small healthcare providers",
    style: "Clean wellness healthcare",
    description: "A patient-friendly clinic site with appointment requests, intake concepts, services, FAQs, provider bios, and education.",
    palette: {
      "Soft Blue": "#7DA8BE",
      Sage: "#A8C3B0",
      White: "#FFFFFF",
      "Stone Gray": "#D9D9D9",
      "Deep Navy": "#243447"
    },
    features: ["Appointment request", "Services", "Patient intake form concept", "Insurance info", "Provider bios", "FAQ", "Educational blog preview"],
    pages: ["Services", "Appointments", "Patient Intake", "Insurance", "Blog"],
    recommendedPackage: "Healthcare Presence",
    complexity: "MODERATE",
    accentClass: "from-[#7DA8BE] via-[#A8C3B0] to-[#243447]"
  },
  {
    slug: "harbor-family-practice",
    name: "Harbor Family Practice",
    type: "Medical practitioner demo",
    audience: "Family practices, medical offices, provider groups",
    style: "Professional healthcare",
    description: "A professional medical platform with provider directory, resources, announcements, appointment request, and portal placeholders.",
    palette: {
      "Medical Blue": "#2563EB",
      White: "#FFFFFF",
      "Slate Gray": "#64748B",
      "Soft Cyan": "#DFF6FF",
      "Deep Navy": "#0F172A"
    },
    features: ["Provider directory", "Appointment request", "Patient resources", "Office announcements", "Insurance/payment info", "Portal integration placeholder"],
    pages: ["Providers", "Appointments", "Resources", "Announcements", "Portal"],
    recommendedPackage: "Healthcare Operations",
    complexity: "HIGH",
    accentClass: "from-[#2563EB] via-[#DFF6FF] to-[#0F172A]"
  },
  {
    slug: "obsidian-tech-er",
    name: "Obsidian Tech E.R.",
    type: "Mobile tech repair demo",
    audience: "Mobile repair, electronics service, IT support operators",
    style: "Cyber-tech emergency repair",
    description: "A repair intake and field service workflow with quote requests, travel logic, appointment scheduling, deposits, and dashboard previews.",
    palette: {
      "Obsidian Black": "#0B0F14",
      "Neon Purple": "#7C3AED",
      "Cyber Green": "#22C55E",
      "Metallic Gray": "#A1A1AA",
      White: "#F8FAFC"
    },
    features: ["Repair quote request", "Device intake form", "Travel fee logic concept", "Appointment request", "Invoice/deposit workflow", "Technician dashboard preview"],
    pages: ["Repair Intake", "Devices", "Appointments", "Invoice", "Tech Dashboard"],
    recommendedPackage: "Service Operations Platform",
    complexity: "HIGH",
    accentClass: "from-[#7C3AED] via-[#22C55E] to-[#0B0F14]"
  },
  {
    slug: "summit-legal-group",
    name: "Summit Legal Group",
    type: "Professional services / law firm demo",
    audience: "Law firms, consulting practices, professional service teams",
    style: "Luxury corporate professionalism",
    description: "A polished legal services site with consultation intake, practice areas, team profiles, proof points, and lead capture.",
    palette: {
      "Midnight Navy": "#0F172A",
      Gold: "#C8A96B",
      White: "#FFFFFF",
      "Cool Gray": "#CBD5E1",
      Charcoal: "#1E293B"
    },
    features: ["Consultation request", "Attorney/staff profiles", "Practice areas", "Testimonials", "Lead capture form", "Case study cards"],
    pages: ["Practice Areas", "Attorneys", "Consultation", "Results", "Resources"],
    recommendedPackage: "Professional Services Platform",
    complexity: "MODERATE",
    accentClass: "from-[#0F172A] via-[#C8A96B] to-[#1E293B]"
  },
  {
    slug: "bluepeak-realty",
    name: "BluePeak Realty",
    type: "Real estate demo",
    audience: "Agents, brokerages, property teams, developers",
    style: "Upscale realty platform",
    description: "A realty experience with listings, property galleries, lead capture, neighborhood highlights, and agent profiles.",
    palette: {
      "Sky Blue": "#3B82F6",
      White: "#FFFFFF",
      Slate: "#334155",
      "Sand Beige": "#E8DCCF",
      "Forest Accent": "#4B6B4E"
    },
    features: ["Property listings", "Image galleries", "Lead capture", "Featured properties", "Agent profiles", "Neighborhood highlights"],
    pages: ["Listings", "Neighborhoods", "Agents", "Valuation", "Gallery"],
    recommendedPackage: "Real Estate Lead Platform",
    complexity: "MODERATE",
    accentClass: "from-[#3B82F6] via-[#E8DCCF] to-[#4B6B4E]"
  },
  {
    slug: "evergreen-outdoor-living",
    name: "Evergreen Outdoor Living",
    type: "Home services / contractor demo",
    audience: "Landscapers, deck builders, outdoor living contractors, home service providers",
    style: "Premium outdoor/home service",
    description: "A contractor lead platform with quote requests, service areas, before/after proof, financing, reviews, and scheduling CTAs.",
    palette: {
      "Forest Green": "#2F5D50",
      Cream: "#F7F4ED",
      "Earth Brown": "#8B5E3C",
      "Slate Gray": "#475569",
      "Warm Orange": "#EA580C"
    },
    features: ["Quote request", "Service areas", "Before/after gallery", "Financing banner", "Reviews", "Seasonal promotions", "Scheduling/contact CTA"],
    pages: ["Services", "Gallery", "Financing", "Reviews", "Quote"],
    recommendedPackage: "Home Services Growth Platform",
    complexity: "LOW",
    accentClass: "from-[#2F5D50] via-[#EA580C] to-[#8B5E3C]"
  }
];

export const retainerTiers = [
  {
    name: "Essential Retainer",
    price: "starting at $200/month",
    description: "Managed platform care for professional sites that need security, uptime, edits, and dependable support.",
    includes: [
      "Hosting management",
      "Domain procurement/management",
      "SSL/security configuration",
      "Site maintenance",
      "Bug fixes",
      "Core updates",
      "Minor content/design updates",
      "Basic SEO maintenance",
      "Analytics monitoring",
      "Integration monitoring",
      "Platform support"
    ]
  },
  {
    name: "Commerce Retainer",
    price: "starting at $350-500/month",
    description: "For stores, ordering flows, invoices, analytics, products, Square workflows, and revenue-critical integrations.",
    includes: ["Everything in Essential", "Commerce monitoring", "Product/support updates", "Checkout/invoice checks", "Conversion reporting"]
  },
  {
    name: "Enterprise Retainer",
    price: "custom pricing",
    description: "For complex integrations, internal tools, client portals, advanced automations, and multi-role operations.",
    includes: ["Custom SLA", "Advanced integrations", "Workflow automation", "Priority support", "Quarterly roadmap reviews"]
  }
];

export const adminModules = [
  { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Requests, approvals, activity, revenue signals, site health, and operations snapshots." },
  { slug: "requests", label: "Requests", icon: ClipboardCheck, description: "Incoming leads, AI quote results, assignment, notes, communication history, and approvals." },
  { slug: "clients", label: "CRM", icon: Users, description: "Client records, consent, histories, exports, assets, invoices, retainers, and lead filters." },
  { slug: "invoices", label: "Invoices", icon: CreditCard, description: "Square-backed custom invoice workflow, deposits, revision states, and payment sync." },
  { slug: "retainers", label: "Retainers", icon: ShieldCheck, description: "Managed platform retainers, billing cycles, domains, hosting, maintenance, and subscription state." },
  { slug: "pipeline", label: "Pipeline", icon: Workflow, description: "Kanban stages from lead through retainer active and completed deployments." },
  { slug: "proposals", label: "Proposals", icon: FileText, description: "Branded proposal previews with scope, timeline, pricing, retainers, add-ons, and AI summaries." },
  { slug: "analytics", label: "Analytics", icon: BarChart3, description: "Traffic, demo popularity, conversions, quote acceptance, CTA clicks, and funnel dropoff." },
  { slug: "pricing", label: "Pricing & Promotions", icon: BadgeDollarSign, description: "Central pricing rules, promotional offers, retainer pricing, usage slots, and quote pricing controls." },
  { slug: "marketing", label: "Marketing", icon: Gauge, description: "GA4, GTM, Meta Pixel, event mapping, and audience export controls." },
  { slug: "logs", label: "Logs", icon: AlertTriangle, description: "Frontend, API, AI, payment, auth, uptime, and suspicious activity monitoring." },
  { slug: "announcements", label: "Announcements", icon: Megaphone, description: "Public, internal, maintenance, feature release, and platform update notices." },
  { slug: "events", label: "Events", icon: CalendarDays, description: "Vendor events, expos, launches, promotions, consultations, and calendar listings." },
  { slug: "demos", label: "Demo Management", icon: PanelTop, description: "Visibility, descriptions, categories, screenshots, feature lists, CTAs, packages, and complexity." },
  { slug: "media", label: "Media Library", icon: Image, description: "Logos, screenshots, client uploads, branding, demo images, and proposal assets." },
  { slug: "users", label: "Users & Roles", icon: KeyRound, description: "Admin accounts, role assignment, trusted devices, login history, MFA placeholders, and suspension." },
  { slug: "devices", label: "Trusted Devices", icon: MonitorCog, description: "New device detection, approval, login alerts, sessions, and IP/device history." },
  { slug: "audit", label: "Audit Logs", icon: Activity, description: "Role changes, approvals, invoices, pricing, AI overrides, deletion, and integration changes." },
  { slug: "tasks", label: "Tasks", icon: BriefcaseBusiness, description: "Internal tasks, priorities, due dates, linked clients/projects/requests, notes, and completion." },
  { slug: "ai-control", label: "AI Control", icon: Sparkles, description: "Quote prompts, pricing rules, complexity scoring, proposal prompts, lead scoring, and overrides." },
  { slug: "feature-toggles", label: "Feature Toggles", icon: ToggleLeft, description: "Deployment module profiles for ecommerce, events, CRM, repair, medical, AI, invoices, and portals." },
  { slug: "client-portal", label: "Client Portal", icon: SquareStack, description: "Placeholder structure for future client login, project progress, invoices, sharing, and revision support." },
  { slug: "case-studies", label: "Case Studies", icon: LibraryBig, description: "Completed project case studies, before/after, screenshots, technology, timeline, results, testimonials." }
];

export const requestStatuses = [
  "New",
  "AI Quoted",
  "AI Reviewed",
  "Under Review",
  "Approved",
  "Client Accepted Estimate",
  "Checkout Pending",
  "Invoice Sent",
  "Deposit Paid",
  "Admin Review Requested",
  "Admin Reviewed",
  "Updated Estimate Sent",
  "In Progress",
  "Completed",
  "Archived",
  "Denied",
  "Revision Requested"
];

export const pipelineStages = [
  "Lead",
  "Qualified",
  "AI Quoted",
  "Consultation",
  "Proposal Sent",
  "Invoice Pending",
  "Deposit Paid",
  "Development",
  "Review",
  "Deployment",
  "Retainer Active",
  "Completed"
];

export const approvalRules = [
  { complexity: "Low Complexity", approver: "Site Overseer or higher" },
  { complexity: "Moderate Complexity", approver: "Admin or higher" },
  { complexity: "High Complexity", approver: "Super Admin only" },
  { complexity: "Custom/Enterprise", approver: "Super Admin only" }
];

export const quoteDisclaimer =
  "This estimate is generated automatically based on the information provided. Final pricing may vary after manual review by Obsidian Systems LLC depending on project scope, integrations, content needs, technical requirements, and timeline.";
