import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminSession("content:manage");
  if (auth.response) return auth.response;
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } }).catch(() => []);
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("content:manage");
  if (auth.response) return auth.response;
  const event = await prisma.event.create({ data: await request.json() });
  return NextResponse.json({ event });
}
