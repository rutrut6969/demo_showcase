import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { demoTemplates, retainerTiers } from "../lib/data";
import { defaultPricingRules } from "../lib/pricing-config";

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: RoleName.SUPER_ADMIN,
      description: "Owner-level access across platform settings, users, integrations, and approvals.",
      permissions: ["*"]
    },
    {
      name: RoleName.ADMIN,
      description: "Operational admin access for requests, clients, content, analytics, and moderate approvals.",
      permissions: [
        "requests:view",
        "requests:approve:moderate",
        "clients:manage",
        "content:manage",
        "tasks:manage",
        "analytics:view",
        "reports:export"
      ]
    },
    {
      name: RoleName.SITE_OVERSEER,
      description: "Read-heavy oversight access with low-complexity approvals and limited exports.",
      permissions: [
        "requests:view",
        "requests:approve:low",
        "analytics:view",
        "logs:view",
        "notes:add",
        "reports:export:limited"
      ]
    }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role
    });
  }

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.SUPER_ADMIN } });
  const superAdminEmail = "isaac.rutledgev@obsidian-systems.tech";
  const temporaryPassword = process.env.SEED_SUPER_ADMIN_TEMP_PASSWORD || randomBytes(18).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const existingSuperAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  const shouldResetPassword = process.env.RESET_SUPER_ADMIN_PASSWORD === "1";

  if (existingSuperAdmin) {
    await prisma.user.update({
      where: { email: superAdminEmail },
      data: {
        roleId: ownerRole.id,
        ...(shouldResetPassword
          ? {
              passwordHash,
              mustChangePassword: true
            }
          : {})
      }
    });
  } else {
    await prisma.user.create({
      data: {
      name: "Isaac Rutledge",
      email: superAdminEmail,
      passwordHash,
      roleId: ownerRole.id,
      mustChangePassword: true
      }
    });
  }

  if (!existingSuperAdmin || shouldResetPassword) {
    console.info(`Generated temporary Super Admin password for ${superAdminEmail}: ${temporaryPassword}`);
  } else {
    console.info(`Super Admin already exists for ${superAdminEmail}. Set RESET_SUPER_ADMIN_PASSWORD=1 to generate a new temporary password.`);
  }

  for (const demo of demoTemplates) {
    await prisma.demoTemplate.upsert({
      where: { slug: demo.slug },
      update: {
        name: demo.name,
        category: demo.type,
        description: demo.description,
        palette: demo.palette,
        features: demo.features,
        visible: true,
        recommendedPackage: demo.recommendedPackage,
        estimatedComplexity: demo.complexity
      },
      create: {
        slug: demo.slug,
        name: demo.name,
        category: demo.type,
        description: demo.description,
        palette: demo.palette,
        features: demo.features,
        visible: true,
        recommendedPackage: demo.recommendedPackage,
        estimatedComplexity: demo.complexity
      }
    });
  }

  await prisma.integrationSetting.upsert({
    where: { key: "managed_platform_retainers" },
    update: { value: JSON.stringify(retainerTiers), enabled: true },
    create: {
      key: "managed_platform_retainers",
      value: JSON.stringify(retainerTiers),
      enabled: true,
      metadata: { source: "seed" }
    }
  });

  for (const rule of defaultPricingRules) {
    await prisma.pricingRule.upsert({
      where: { key: rule.key },
      update: rule,
      create: rule
    });
  }

  await prisma.promotion.upsert({
    where: { id: "seed-launch-promo" },
    update: {
      name: "$500 Website Launch Promotion",
      description: "Optional launch promo: first 10 qualifying clients receive a $500 build and $100/month Essential Retainer offer.",
      active: false,
      normalPrice: 100000,
      promoPrice: 50000,
      normalRetainer: 20000,
      promoRetainer: 10000,
      maxUses: 10
    },
    create: {
      id: "seed-launch-promo",
      name: "$500 Website Launch Promotion",
      description: "Optional launch promo: first 10 qualifying clients receive a $500 build and $100/month Essential Retainer offer.",
      active: false,
      normalPrice: 100000,
      promoPrice: 50000,
      normalRetainer: 20000,
      promoRetainer: 10000,
      maxUses: 10
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
