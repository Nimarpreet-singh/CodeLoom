import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// A deliberately tiny authenticated read. Vercel Cron calls this once daily on production.
export async function GET(request: Request) {
  const authorized = Boolean(process.env.CRON_SECRET) && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await (await db()).command({ ping: 1 });
  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
