import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

export async function GET() {
  signOut();
  redirect("/admin/login");
}

export async function POST() {
  signOut();
  redirect("/admin/login");
}
