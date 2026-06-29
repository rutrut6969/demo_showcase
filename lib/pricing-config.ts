import type { ComplexityLevel } from "@prisma/client";

export const MINIMUM_PROJECT_PRICE = 50000;

export const defaultPricingRules = [
  {
    key: "basic_website",
    label: "Basic Website",
    description: "Simple professional website or landing presence.",
    complexityLevel: "LOW" as ComplexityLevel,
    basePrice: 50000,
    minPrice: 50000,
    maxPrice: 100000,
    retainerTier: "Essential Retainer",
    retainerMin: 20000,
    retainerMax: 20000,
    sortOrder: 1
  },
  {
    key: "business_website",
    label: "Business Website",
    description: "Multi-page business site with lead capture and managed content.",
    complexityLevel: "MODERATE" as ComplexityLevel,
    basePrice: 100000,
    minPrice: 100000,
    maxPrice: 200000,
    retainerTier: "Essential Retainer",
    retainerMin: 20000,
    retainerMax: 20000,
    sortOrder: 2
  },
  {
    key: "ecommerce_website",
    label: "Ecommerce Website",
    description: "Storefront, product/catalog flow, checkout, and commerce operations.",
    complexityLevel: "MODERATE" as ComplexityLevel,
    basePrice: 200000,
    minPrice: 200000,
    maxPrice: 350000,
    retainerTier: "Commerce Retainer",
    retainerMin: 35000,
    retainerMax: 50000,
    sortOrder: 3
  },
  {
    key: "custom_web_app",
    label: "Custom Web Application",
    description: "Custom app, portals, dashboards, workflows, or advanced integrations.",
    complexityLevel: "HIGH" as ComplexityLevel,
    basePrice: 300000,
    minPrice: 300000,
    maxPrice: 750000,
    retainerTier: "Enterprise Retainer",
    retainerMin: null,
    retainerMax: null,
    sortOrder: 4
  },
  {
    key: "complex_system",
    label: "Complex Business System",
    description: "Enterprise-grade operational system with custom pricing.",
    complexityLevel: "CUSTOM_ENTERPRISE" as ComplexityLevel,
    basePrice: 750000,
    minPrice: 750000,
    maxPrice: null,
    retainerTier: "Enterprise Retainer",
    retainerMin: null,
    retainerMax: null,
    sortOrder: 5
  }
];

export function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
