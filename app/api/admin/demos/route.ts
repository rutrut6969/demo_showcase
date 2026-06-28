import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { demoTemplates } from "@/lib/data";

export async function GET() {
  const auth = await requireAdminSession("content:manage");
  if (auth.response) return auth.response;
  const demos = await prisma.demoTemplate.findMany({ orderBy: { name: "asc" } }).catch(() => demoTemplates);
  return NextResponse.json({ demos });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession("content:manage");
  if (auth.response) return auth.response;
  const data = await request.json();
  const demo = await prisma.demoTemplate.update({ where: { slug: data.slug }, data });
  return NextResponse.json({ demo });
}
