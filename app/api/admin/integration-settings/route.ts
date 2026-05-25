import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.integrationSetting.findMany({ orderBy: { key: "asc" } }).catch(() => []);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const setting = await prisma.integrationSetting.upsert({
    where: { key: body.key },
    update: body,
    create: body
  });
  return NextResponse.json({ setting });
}
