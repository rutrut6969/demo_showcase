import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  await prisma.analyticsEvent.create({
    data: {
      eventName: body.eventName,
      sourcePage: body.sourcePage,
      demoSlug: body.demoSlug,
      requestId: body.requestId,
      visitorId: body.visitorId,
      metadata: body.metadata
    }
  }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
