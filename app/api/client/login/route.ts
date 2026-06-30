import { NextResponse } from "next/server";
import { z } from "zod";
import { signInClient } from "@/lib/client-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter a valid email and password." }, { status: 400 });
  const session = await signInClient(parsed.data.email, parsed.data.password);
  if (!session) return NextResponse.json({ ok: false, error: "Invalid client login." }, { status: 401 });
  return NextResponse.json({ ok: true, session, redirectTo: "/client/payment-methods" });
}
