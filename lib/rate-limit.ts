import { db } from "@/lib/db";

type RateLimitDocument = { _id:string; count:number; expiresAt:Date };

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Fixed-window guard backed by Atlas; suitable for Vercel's stateless functions. */
export async function rateLimit(request: Request, scope: string, max: number, windowMs = 60_000) {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const expiresAt = new Date((bucket + 1) * windowMs + 60_000);
  const result = await (await db()).collection<RateLimitDocument>("rateLimits").findOneAndUpdate(
    { _id: `${scope}:${clientKey(request)}:${bucket}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, returnDocument: "after" },
  );
  return (result?.count || 0) <= max;
}
