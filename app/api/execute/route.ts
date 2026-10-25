import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/http";

const schema = z.object({ language: z.enum(["javascript", "python", "typescript"]).default("javascript"), code: z.string().min(1).max(50_000) });
const runtimes: Record<string, { language:string; version:string }> = { javascript:{language:"javascript",version:"18.15.0"}, typescript:{language:"typescript",version:"5.0.3"}, python:{language:"python",version:"3.10.0"} };
export async function POST(request: Request) {
  const auth=await requireSession(); if("error" in auth)return auth.error;
  try { const input=schema.parse(await request.json()); const endpoint=process.env.PISTON_API_URL; if(!endpoint)return NextResponse.json({error:"Code execution is not configured yet. Add a PISTON_API_URL environment variable to use a trusted Piston instance."},{status:503}); const response=await fetch(`${endpoint.replace(/\/$/,"")}/execute`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...runtimes[input.language],files:[{content:input.code}] }),signal:AbortSignal.timeout(10_000)});if(!response.ok)throw new Error();const result=await response.json();return NextResponse.json({output:result.run?.output||result.message||"Program finished with no output.",code:result.run?.code}); } catch(error){return NextResponse.json({error:error instanceof z.ZodError?"Choose a supported language and non-empty program.":"Runner did not respond. Try again shortly."},{status:400});}
}
