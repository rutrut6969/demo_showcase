import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  requestId: z.string().optional(),
  reason: z.string().optional(),
  selectedDemo: z.string().optional()
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const requestId = body.requestId?.startsWith("local-") ? undefined : body.requestId;

  try {
    if (requestId) {
      await prisma.projectRequest.update({
        where: { id: requestId },
        data: {
          status: "ADMIN_REVIEW_REQUESTED",
          internalNotes: body.reason ? `Client requested manual review: ${body.reason}` : "Client requested manual estimate review."
        }
      });
    }

    await prisma.siteLog.create({
      data: {
        source: "checkout",
        message: "Client requested admin review of AI estimate",
        metadata: {
          requestId,
          selectedDemo: body.selectedDemo,
          reason: body.reason,
          notify: process.env.ADMIN_NOTIFY_EMAIL
        }
      }
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, persisted: Boolean(requestId) });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      warning: error instanceof Error ? error.message : "Manual review request could not be persisted"
    });
  }
}
