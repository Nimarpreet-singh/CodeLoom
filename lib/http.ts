import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function requireSession() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Please sign in to continue." }, { status: 401 }) };
  return { session };
}
