import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, ensureIndexes } from "@/lib/db";
import { createSession, sessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(8).max(128) });
export async function POST(request: Request) {
  if (!(await rateLimit(request, "register", 3))) return NextResponse.json({ error: "Too many account attempts. Please try again shortly." }, { status: 429 });
  try {
    const input = schema.parse(await request.json()); await ensureIndexes();
    const users = (await db()).collection("users");
    if (await users.findOne({ email: input.email })) return NextResponse.json({ error: "An account already exists for that email." }, { status: 409 });
    const result = await users.insertOne({ name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), createdAt: new Date() });
    const response = NextResponse.json({ ok: true }); response.cookies.set(sessionCookie(await createSession({ userId: result.insertedId.toString(), email: input.email, name: input.name }))); return response;
  } catch (error) { return NextResponse.json({ error: error instanceof z.ZodError ? "Please provide a name, valid email, and password of at least 8 characters." : "Could not create your account." }, { status: 400 }); }
}
