import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/http";
import { LANGUAGES, LANGUAGE_IDS } from "@/lib/languages";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ language: z.enum(LANGUAGE_IDS), code: z.string().min(1).max(50_000) });
export async function POST(request: Request) {
  const auth=await requireSession(); if("error" in auth)return auth.error;
  if (!await rateLimit(request, "execute", 12)) return NextResponse.json({ error:"Execution limit reached. Please wait a minute before running more code." }, { status:429 });
  try {
    const input=schema.parse(await request.json());
    const endpoint=(process.env.JUDGE0_URL || "https://ce.judge0.com").replace(/\/$/, "");
    const response=await fetch(`${endpoint}/submissions?base64_encoded=false&wait=true`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ source_code:input.code, language_id:LANGUAGES[input.language].judge0, cpu_time_limit:3, wall_time_limit:5, memory_limit:128000 }),
      signal:AbortSignal.timeout(12_000),
      cache:"no-store",
    });
    const result=await response.json().catch(() => ({}));
    if(!response.ok) return NextResponse.json({error:result.message || "The free compiler is busy. Try again shortly."},{status:response.status});
    const output=[result.compile_output,result.stderr,result.stdout,result.message].filter((value): value is string => typeof value === "string" && value.length > 0).join("") || "Program finished with no output.";
    return NextResponse.json({ output, status:result.status?.description || "Finished" });
  } catch(error) {
    return NextResponse.json({error:error instanceof z.ZodError?"Choose a supported language and non-empty program.":"The free compiler did not respond. Try again shortly."},{status:400});
  }
}
