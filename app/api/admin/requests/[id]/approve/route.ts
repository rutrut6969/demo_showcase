import { NextResponse } from "next/server";
import { z } from "zod";
import { canApproveComplexity, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  complexity: z.enum(["LOW", "MODERATE", "HIGH", "CUSTOM_ENTERPRISE"]),
  approved: z.boolean().default(true)
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser();
  const body = schema.parse(await request.json());

  if (!session || !canApproveComplexity(session.role, body.complexity)) {
    return NextResponse.json({ error: "Insufficient approval permission" }, { status: 403 });
  }

  const updated = await prisma.projectRequest.update({
    where: { id: params.id },
    data: { status: body.approved ? "APPROVED" : "DENIED" }
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: body.approved ? "request.approved" : "request.denied",
      entityType: "ProjectRequest",
      entityId: params.id,
      metadata: { complexity: body.complexity }
    }
  });

  return NextResponse.json({ request: updated });
}
