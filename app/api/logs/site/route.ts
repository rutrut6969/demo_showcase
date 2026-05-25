import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  await prisma.siteLog.create({
    data: {
      severity: body.severity || "ERROR",
      source: body.source || "frontend",
      message: body.message || "Unknown site error",
      metadata: body.metadata
    }
  }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
