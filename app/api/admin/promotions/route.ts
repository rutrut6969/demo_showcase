import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { normalizeCents } from "@/lib/pricing";

const promotionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  active: z.boolean().default(false),
  normalPrice: z.number(),
  promoPrice: z.number(),
  normalRetainer: z.number().nullable().optional(),
  promoRetainer: z.number().nullable().optional(),
  maxUses: z.number().int().nullable().optional(),
  currentUses: z.number().int().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional()
});

export async function GET() {
  const auth = await requireAdminSession("*");
  if (auth.response) return auth.response;
  const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promotions });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession("*", request);
  if (auth.response) return auth.response;
  const body = promotionSchema.parse(await request.json());
  const promotion = await prisma.promotion.create({
    data: {
      name: body.name,
      description: body.description,
      active: body.active,
      normalPrice: normalizeCents(body.normalPrice),
      promoPrice: normalizeCents(body.promoPrice),
      normalRetainer: body.normalRetainer == null ? null : normalizeCents(body.normalRetainer, 0),
      promoRetainer: body.promoRetainer == null ? null : normalizeCents(body.promoRetainer, 0),
      maxUses: body.maxUses,
      currentUses: body.currentUses || 0,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null
    }
  });
  return NextResponse.json({ promotion });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession("*", request);
  if (auth.response) return auth.response;
  const body = promotionSchema.extend({ id: z.string() }).parse(await request.json());
  const promotion = await prisma.promotion.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description,
      active: body.active,
      normalPrice: normalizeCents(body.normalPrice),
      promoPrice: normalizeCents(body.promoPrice),
      normalRetainer: body.normalRetainer == null ? null : normalizeCents(body.normalRetainer, 0),
      promoRetainer: body.promoRetainer == null ? null : normalizeCents(body.promoRetainer, 0),
      maxUses: body.maxUses,
      currentUses: body.currentUses,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null
    }
  });
  return NextResponse.json({ promotion });
}
