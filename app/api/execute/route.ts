import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/http";
import { LANGUAGES, LANGUAGE_IDS } from "@/lib/languages";

const schema = z.object({ language: z.enum(LANGUAGE_IDS), code: z.string().min(1).max(50_000) });
export async function POST(request: Request) {
  const auth=await requireSession(); if("error" in auth)return auth.error;
  try { const input=schema.parse(await request.json()); const endpoint=process.env.PISTON_API_URL; if(!endpoint)return NextResponse.json({error:"Multi-language execution is not configured. Add PISTON_API_URL and, if required, PISTON_AUTH_TOKEN in Vercel."},{status:503}); const language=LANGUAGES[input.language]; const token=process.env.PISTON_AUTH_TOKEN; const response=await fetch(`${endpoint.replace(/\/$/,"")}/execute`,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({language:language.piston,version:"*",files:[{name:language.fileName,content:input.code}],compile_timeout:10_000,run_timeout:3_000}),signal:AbortSignal.timeout(15_000)});const result=await response.json();if(!response.ok)return NextResponse.json({error:result.message||"The compiler rejected this request."},{status:response.status});const output=[result.compile?.output,result.run?.output].filter(Boolean).join("")||result.message||"Program finished with no output.";return NextResponse.json({output,code:result.run?.code}); } catch(error){return NextResponse.json({error:error instanceof z.ZodError?"Choose a supported language and non-empty program.":"Runner did not respond. Try again shortly."},{status:400});}
}
