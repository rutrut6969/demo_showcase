import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminSession("*");
  if (auth.response) return auth.response;
  const settings = await prisma.integrationSetting.findMany({ orderBy: { key: "asc" } }).catch(() => []);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession("*");
  if (auth.response) return auth.response;
  const body = await request.json();
  const setting = await prisma.integrationSetting.upsert({
    where: { key: body.key },
    update: body,
    create: body
  });
  return NextResponse.json({ setting });
}
