import Link from "next/link";

const Bolt = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-13h-7z" fill="currentColor" /></svg>;

export default function Home() {
  return <main className="landing">
    <nav className="nav"><Link className="brand" href="/"><span className="brand-mark"><Bolt /></span>codeloom</Link><div className="nav-actions"><Link href="/login" className="text-link">Sign in</Link><Link href="/login?mode=signup" className="button small">Create free account</Link></div></nav>
    <section className="hero">
      <div className="eyebrow"><i />Built for the way code is taught</div>
      <h1>Your classroom, <em>in sync.</em></h1>
      <p className="hero-copy">Live video, a shared teaching editor, and individual workspaces in one focused place. No context switching. No code blurred inside a screen share.</p>
      <div className="hero-actions"><Link className="button" href="/login?mode=signup">Start teaching for free <span>→</span></Link><a className="watch-link" href="#how-it-works"><span className="play">▶</span> See how it works</a></div>
      <div className="product-shot" aria-label="Preview of the teaching workspace">
        <div className="shot-top"><span className="traffic"><b/><b/><b/></span><span className="live-dot">LIVE&nbsp; • &nbsp;Arrays &amp; loops</span><span>⋯</span></div>
        <aside className="shot-rail"><div className="avatar host">AR</div><div className="avatar">SK</div><div className="avatar">JM</div><div className="more">+18</div></aside>
        <section className="shot-editor"><div className="code-head"><div><strong>lesson.js</strong><span>JavaScript</span></div><span className="saving">● All changes live</span></div><pre><code><i>1</i><span className="purple">const</span> numbers = [<span className="orange">12</span>, <span className="orange">8</span>, <span className="orange">21</span>, <span className="orange">4</span>];{`\n`}<i>2</i>{`\n`}<i>3</i><span className="purple">const</span> doubled = numbers.<span className="blue">map</span>((number) =&gt; {'{'}{`\n`}<i>4</i>  <span className="purple">return</span> number * <span className="orange">2</span>;{`\n`}<i>5</i>{'}'});<span className="cursor" />{`\n`}<i>6</i>{`\n`}<i>7</i>console.<span className="blue">log</span>(doubled);</code></pre><div className="teacher-cursor"><span />Aarav is explaining this</div></section>
        <aside className="shot-chat"><strong>Class chat</strong><p><b>Sofia K.</b><br/>Why does <code>map</code> make a new array?</p><p><b>You</b><br/>Great question — let&apos;s test it.</p><div className="chat-input">Message everyone <span>↵</span></div></aside>
      </div>
    </section>
    <section id="how-it-works" className="promise"><div><span className="section-kicker">ONE ROOM. REAL LEARNING.</span><h2>Teach the thinking,<br/><em>not the tooling.</em></h2></div><div className="promise-grid"><article><span>01</span><h3>A shared teaching surface</h3><p>Every keystroke in your editor lands as real, selectable code for the whole room.</p></article><article><span>02</span><h3>Private space to try</h3><p>Learners work in their own editor without losing sight of your explanation.</p></article><article><span>03</span><h3>Feedback at the right moment</h3><p>Choose when to see learner code, share it, and bring the group back together.</p></article></div></section>
    <footer><span className="brand"><span className="brand-mark"><Bolt /></span>codeloom</span><span>Made for teachers who care about the craft.</span></footer>
  </main>;
}
