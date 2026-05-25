import { NextResponse } from "next/server";
import { generateAIQuote, quoteInputSchema } from "@/lib/ai";

export async function POST(request: Request) {
  const body = await request.json();
  const quote = await generateAIQuote(quoteInputSchema.parse(body));
  return NextResponse.json({ quote });
}
