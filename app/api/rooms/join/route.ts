import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
const schema = z.object({ joinCode: z.string().trim().toUpperCase().regex(/^[A-Z2-9]{6}$/) });
export async function POST(request: Request) { const auth = await requireSession(); if ("error" in auth) return auth.error; if (!(await rateLimit(request, "join-room", 12))) return NextResponse.json({ error: "Too many join attempts. Please try again shortly." }, { status: 429 }); try { const { joinCode } = schema.parse(await request.json()); const database = await db(); const room = await database.collection("rooms").findOne({ joinCode }); if (!room) return NextResponse.json({ error: "We couldn’t find a classroom with that code." }, { status: 404 }); const now = new Date(); await database.collection("roomMembers").updateOne({ roomId: room._id, userId: auth.session.userId }, { $set: { updatedAt: now }, $setOnInsert: { role: "learner", joinedAt: now } }, { upsert: true }); return NextResponse.json({ roomId: room._id.toString() }); } catch { return NextResponse.json({ error: "Enter the six-character classroom code from your host." }, { status: 400 }); } }
