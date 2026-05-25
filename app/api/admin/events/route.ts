import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: "desc" } }).catch(() => []);
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const event = await prisma.event.create({ data: await request.json() });
  return NextResponse.json({ event });
}
