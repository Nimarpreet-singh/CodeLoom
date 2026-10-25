import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, sessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(1) });
export async function POST(request: Request) {
  if (!(await rateLimit(request, "login", 5))) return NextResponse.json({ error: "Too many sign-in attempts. Please try again shortly." }, { status: 429 });
  try { const input = schema.parse(await request.json()); const user = await (await db()).collection("users").findOne({ email: input.email });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return NextResponse.json({ error: "Email or password is not correct." }, { status: 401 });
    const response = NextResponse.json({ ok: true }); response.cookies.set(sessionCookie(await createSession({ userId: user._id.toString(), email: user.email, name: user.name }))); return response;
  } catch { return NextResponse.json({ error: "Please enter a valid email and password." }, { status: 400 }); }
}
