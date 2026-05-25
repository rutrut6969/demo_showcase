import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { demoTemplates } from "@/lib/data";

export async function GET() {
  const demos = await prisma.demoTemplate.findMany({ orderBy: { name: "asc" } }).catch(() => demoTemplates);
  return NextResponse.json({ demos });
}

export async function PATCH(request: Request) {
  const data = await request.json();
  const demo = await prisma.demoTemplate.update({ where: { slug: data.slug }, data });
  return NextResponse.json({ demo });
}
