import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { demoTemplates, retainerTiers } from "../lib/data";

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

  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { roleId: ownerRole.id },
    create: {
      name: "Isaac Rutledge",
      email: superAdminEmail,
      passwordHash,
      roleId: ownerRole.id,
      mustChangePassword: true
    }
  });

  if (!process.env.SEED_SUPER_ADMIN_TEMP_PASSWORD) {
    console.info(`Generated temporary Super Admin password for ${superAdminEmail}: ${temporaryPassword}`);
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
