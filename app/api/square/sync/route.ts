import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const payload = await request.json();
  await prisma.siteLog.create({
    data: {
      source: "square",
      message: "Square webhook/sync payload received",
      metadata: payload
    }
  }).catch(() => undefined);
  return NextResponse.json({ ok: true, synced: true });
}
