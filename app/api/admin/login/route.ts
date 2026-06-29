import { NextResponse } from "next/server";
import { z } from "zod";
import { signIn } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Enter a valid email and password." }, { status: 400 });
  }

  const user = await signIn(parsed.data.email, parsed.data.password);
  if (!user) {
    console.info("Admin login failed");
    return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
  }

  const redirectTo = user.mustChangePassword ? "/admin/password" : "/admin";
  console.info("Admin login succeeded", { userId: user.id, mustChangePassword: user.mustChangePassword });

  return NextResponse.json({
    success: true,
    session: {
      userId: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    },
    mustChangePassword: user.mustChangePassword,
    redirectTo
  });
}
