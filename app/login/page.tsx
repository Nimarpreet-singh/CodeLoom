"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const search = useSearchParams(); const router = useRouter();
  const [signup, setSignup] = useState(search.get("mode") === "signup");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch(signup ? "/api/auth/register" : "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) return setError(result.error || "Something went wrong.");
    router.push("/dashboard"); router.refresh();
  }
  return <main className="auth-page"><aside className="auth-aside"><Link className="brand" href="/"><span className="brand-mark">ϟ</span>codeloom</Link><div className="auth-quote"><span className="quote-mark">“</span><h1>The editor is where understanding becomes visible.</h1><p>Built around the tiny, meaningful moments of learning to code.</p></div><p>© {new Date().getFullYear()} CodeLoom</p></aside><section className="auth-main"><form className="auth-card" onSubmit={submit}><h2>{signup ? "Make a space to teach." : "Welcome back."}</h2><p>{signup ? "Start with a free, private teaching workspace." : "Sign in to return to your classrooms."}</p>{signup && <div className="field"><label htmlFor="name">YOUR NAME</label><input required id="name" name="name" minLength={2} placeholder="Ada Lovelace" /></div>}<div className="field"><label htmlFor="email">EMAIL ADDRESS</label><input required id="email" name="email" type="email" placeholder="you@example.com" /></div><div className="field"><label htmlFor="password">PASSWORD</label><input required id="password" name="password" type="password" minLength={8} placeholder="At least 8 characters" /></div>{error && <p className="form-error">{error}</p>}<button className="button" disabled={busy}>{busy ? "One moment…" : signup ? "Create my account" : "Sign in"}</button><p className="form-switch">{signup ? "Already have an account?" : "New to CodeLoom?"} <button type="button" onClick={() => { setSignup(!signup); setError(""); }}>{signup ? "Sign in" : "Create one"}</button></p></form></section></main>;
}
