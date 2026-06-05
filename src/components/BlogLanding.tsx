import { useState, useEffect, useRef } from "react";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

  :root {
    --brand-blue: #2563EB;
    --brand-purple: #9333EA;
    --brand-pink: #DB2777;
    --brand-gradient: linear-gradient(135deg, #2563EB, #9333EA, #DB2777);
    --brand-glow: rgba(37, 99, 235, 0.28);
    --brand-light: #EFF6FF;
    --dark: #141416;
    --dark2: #1E1E22;
    --mid: #5A5A64;
    --light: #F8F7F3;
    --white: #FFFFFF;
    --card-shadow: 0 8px 48px rgba(0,0,0,0.10);
    --font-body: 'DM Sans', sans-serif;
  }

  html { scroll-behavior: smooth; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--light); }
  ::-webkit-scrollbar-thumb { background: var(--brand-blue); border-radius: 3px; }

  .reveal {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.75s cubic-bezier(.22,1,.36,1),
                transform 0.75s cubic-bezier(.22,1,.36,1);
  }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  .stagger > * { opacity: 0; transform: translateY(32px);
    transition: opacity 0.6s cubic-bezier(.22,1,.36,1),
                transform 0.6s cubic-bezier(.22,1,.36,1); }
  .stagger.visible > *:nth-child(1) { opacity:1; transform:none; transition-delay:0s; }
  .stagger.visible > *:nth-child(2) { opacity:1; transform:none; transition-delay:.12s; }
  .stagger.visible > *:nth-child(3) { opacity:1; transform:none; transition-delay:.24s; }
  .stagger.visible > *:nth-child(4) { opacity:1; transform:none; transition-delay:.36s; }

  .nav {
    position: fixed; top:0; left:0; right:0; z-index:200;
    display:flex; align-items:center; justify-content:space-between;
    padding: 18px 64px;
    transition: background 0.4s, box-shadow 0.4s;
  }
  .nav.scrolled {
    background: rgba(248,247,243,0.9);
    backdrop-filter: blur(18px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.07);
  }
  .nav-logo {
    font-family: var(--font-body);
    font-size: 1.55rem; font-weight: 700;
    color: var(--dark); letter-spacing: -0.5px; cursor:pointer;
  }
  .nav-logo span { color: var(--brand-blue); }
  .nav-links { display:flex; gap:36px; list-style:none; }
  .nav-links a {
    text-decoration:none; color: var(--mid);
    font-size:0.92rem; font-weight:500;
    position:relative; padding-bottom:2px;
    transition: color 0.2s;
  }
  .nav-links a::after {
    content:''; position:absolute; bottom:0; left:0; right:100%;
    height:1.5px; background: var(--brand-blue);
    transition: right 0.25s cubic-bezier(.22,1,.36,1);
  }
  .nav-links a:hover { color: var(--dark); }
  .nav-links a:hover::after { right:0; }
  .nav-cta {
    background: var(--dark); color: var(--white);
    border:none; padding:10px 22px; border-radius:50px;
    font-family: var(--font-body); font-size:0.88rem; font-weight:600;
    cursor:pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .nav-cta:hover { background: var(--brand-blue); transform: translateY(-1px); box-shadow:0 4px 18px var(--brand-glow); }
  .hamburger { display:none; flex-direction:column; gap:5px; cursor:pointer; background:none; border:none; }
  .hamburger span { display:block; width:24px; height:2px; background:var(--dark); border-radius:2px; transition:0.3s; }

  .mob-menu {
    position:fixed; top:60px; left:0; right:0; z-index:199;
    background: var(--white);
    display:flex; flex-direction:column; gap:0;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    transform: translateY(-10px);
    opacity:0; pointer-events:none;
    transition: transform 0.3s cubic-bezier(.22,1,.36,1), opacity 0.3s;
  }
  .mob-menu.open { transform:translateY(0); opacity:1; pointer-events:all; }
  .mob-menu a {
    text-decoration:none; color: var(--dark);
    font-size:1rem; font-weight:500; padding:16px 24px;
    border-bottom:1px solid rgba(0,0,0,0.06);
    transition: background 0.15s;
  }
  .mob-menu a:hover { background: var(--brand-light); }
  .mob-menu .mob-cta {
    background: var(--brand-blue); color: var(--white);
    text-align:center; font-weight:600; margin:16px;
    border-radius:50px; padding:14px; border:none;
    cursor:pointer; font-family:var(--font-body); font-size:0.95rem;
    border-bottom:none;
  }

  .hero {
    min-height: 100vh;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    text-align:center;
    padding: 130px 32px 80px;
    position:relative; overflow:hidden;
  }
  .hero-stripe {
    position:absolute; inset:0; pointer-events:none;
    background: repeating-linear-gradient(
      -55deg, transparent, transparent 28px,
      rgba(0,0,0,0.022) 28px, rgba(0,0,0,0.022) 29px
    );
  }
  .hero-blob {
    position:absolute; border-radius:50%; filter:blur(80px);
    pointer-events:none; will-change:transform;
  }
  .hero-blob-1 {
    width:520px; height:520px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%);
    top:-100px; right:-80px;
  }
  .hero-blob-2 {
    width:400px; height:400px;
    background: radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%);
    bottom:-60px; left:-80px;
  }
  .hero-eyebrow {
    display:inline-flex; align-items:center; gap:8px;
    background: var(--brand-light); color: var(--brand-blue);
    font-size:0.76rem; font-weight:600; letter-spacing:0.09em;
    text-transform:uppercase; padding:6px 16px; border-radius:50px;
    margin-bottom:28px;
    animation: heroFadeUp 0.8s 0.1s both;
  }
  .hero-title {
    font-family: var(--font-body);
    font-size: clamp(3rem, 6.5vw, 5.8rem);
    font-weight:800; line-height:1.04; letter-spacing:-3px;
    color: var(--dark); max-width:880px;
    animation: heroFadeUp 0.8s 0.2s both;
  }
  .hero-title .highlight {
    background: linear-gradient(to right, #2563EB, #9333EA, #DB2777);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-style:italic;
    letter-spacing: normal;
    position:relative;
    display:inline-block;
    padding-left: 2px;
    padding-right: 16px;
  }

  .hero-sub {
    max-width:600px; font-size:1.07rem; line-height:1.75;
    color: var(--mid); margin-top:26px;
    animation: heroFadeUp 0.8s 0.3s both;
  }
  .hero-sub strong { color: var(--dark); font-weight:600; }
  .hero-sub .hl {
    background: linear-gradient(180deg,transparent 55%,rgba(37, 99, 235, 0.2) 55%);
  }
  .hero-actions {
    display:flex; align-items:center; gap:16px; margin-top:42px;
    flex-wrap:wrap; justify-content:center;
    animation: heroFadeUp 0.8s 0.4s both;
  }
  @keyframes heroFadeUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .btn-primary {
    background: var(--brand-blue); color: var(--white);
    border:none; padding:15px 36px; border-radius:50px;
    font-family:var(--font-body); font-size:0.97rem; font-weight:600;
    cursor:pointer; display:inline-flex; align-items:center; gap:8px;
    box-shadow:0 4px 22px var(--brand-glow);
    transition: transform 0.2s, box-shadow 0.2s;
    position:relative; overflow:hidden;
  }
  .btn-primary::before {
    content:''; position:absolute; inset:0;
    background:rgba(255,255,255,0.15); transform:translateX(-100%);
    transition: transform 0.35s ease;
    pointer-events:none;
  }
  .btn-primary:hover::before { transform:translateX(100%); }
  .btn-primary:hover { transform:translateY(-3px); box-shadow:0 10px 32px var(--brand-glow); }
  .btn-secondary {
    background:transparent; color:var(--dark);
    border:2px solid rgba(0,0,0,0.15); padding:13px 30px;
    border-radius:50px; font-family:var(--font-body);
    font-size:0.97rem; font-weight:500; cursor:pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
  }
  .btn-secondary:hover { border-color:var(--dark); transform:translateY(-2px); }

  .marquee-wrap {
    overflow:hidden; background:var(--dark); padding:18px 0;
    border-top:1px solid rgba(255,255,255,0.06);
    border-bottom:1px solid rgba(255,255,255,0.06);
  }
  .marquee-track {
    display:flex; gap:48px; white-space:nowrap;
    animation: marquee 22s linear infinite;
  }
  .marquee-track:hover { animation-play-state:paused; }
  .marquee-item {
    display:inline-flex; align-items:center; gap:10px;
    font-family:var(--font-body); font-size:1rem; font-weight:600;
    color:rgba(255,255,255,0.55); letter-spacing:-0.3px; flex-shrink:0;
  }
  .marquee-item .m-icon { color: rgba(255,255,255,0.4); font-size:1.1rem; }
  @keyframes marquee {
    from { transform:translateX(0); }
    to   { transform:translateX(-50%); }
  }

  .section { padding:110px 64px; max-width:1240px; margin:0 auto; }
  .section-tag {
    display:inline-block; background:var(--brand-light); color:var(--brand-blue);
    font-size:0.74rem; font-weight:600; letter-spacing:0.1em;
    text-transform:uppercase; padding:5px 14px; border-radius:50px; margin-bottom:16px;
  }
  .section-title {
    font-family:var(--font-body);
    font-size:clamp(2rem,3.8vw,3rem); font-weight:800;
    letter-spacing:-1.5px; color:var(--dark); line-height:1.12; margin-bottom:12px;
  }
  .section-sub { color:var(--mid); font-size:0.97rem; line-height:1.75; max-width:440px; margin-bottom:60px; }

  .feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
  .feat-card {
    background:var(--white); border-radius:22px;
    padding:34px 30px; box-shadow:0 2px 20px rgba(0,0,0,0.055);
    transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s;
    position:relative; overflow:hidden;
    cursor:default;
  }
  .feat-card::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,var(--brand-light),transparent);
    opacity:0; transition:opacity 0.35s;
  }
  .feat-card:hover { transform:translateY(-8px); box-shadow:0 20px 50px rgba(0,0,0,0.13); }
  .feat-card:hover::before { opacity:1; }
  .feat-card.dark { background:var(--dark); color:var(--white); }
  .feat-card.dark::before { background:linear-gradient(135deg,rgba(37, 99, 235, 0.18),transparent); }
  .feat-card.dark .feat-title { color:var(--white); }
  .feat-card.dark .feat-desc { color:rgba(255,255,255,0.62); }
  .feat-icon {
    width:52px; height:52px; border-radius:16px;
    background:var(--brand-light); color:var(--brand-blue);
    display:flex; align-items:center; justify-content:center;
    font-size:1.35rem; margin-bottom:22px;
    position:relative; z-index:1;
  }
  .feat-card.dark .feat-icon { background:rgba(37, 99, 235, 0.22); }
  .feat-title {
    font-family:var(--font-body); font-size:1.18rem; font-weight:700;
    color:var(--dark); margin-bottom:10px; letter-spacing:-0.3px;
    position:relative; z-index:1;
  }
  .feat-desc { color:var(--mid); font-size:0.88rem; line-height:1.75; position:relative; z-index:1; }

  footer {
    background:var(--white); padding:52px 64px;
    display:flex; align-items:center; justify-content:space-between;
    flex-wrap:wrap; gap:20px;
    border-top:1px solid rgba(0,0,0,0.07);
  }
  .footer-logo { font-family:var(--font-body); font-size:1.4rem; font-weight:700; color:var(--dark); }
  .footer-logo span { color:var(--brand-blue); }
  .footer-links { display:flex; gap:28px; list-style:none; }
  .footer-links a { text-decoration:none; color:var(--mid); font-size:0.86rem; transition:color .2s; }
  .footer-links a:hover { color:var(--dark); }
  .footer-copy { color:var(--mid); font-size:0.8rem; }

  @media (max-width:1024px) {
    .nav { padding:16px 32px; }
    .section { padding:80px 32px; }
    footer { padding:44px 32px; }
    .feat-grid { grid-template-columns:repeat(2,1fr); }
  }
  @media (max-width:768px) {
    .nav { padding:14px 20px; }
    .nav-links, .nav-cta { display:none; }
    .hamburger { display:flex; }
    .hero { padding:100px 20px 56px; }
    .hero-title { font-size:2.6rem; letter-spacing:-1.5px; }
    .section { padding:60px 20px; }
    .feat-grid { grid-template-columns:1fr; }
    footer { padding:36px 20px; flex-direction:column; align-items:flex-start; }
    .footer-links { flex-wrap:wrap; gap:16px; }
  }
`;

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal, .stagger");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useParallax(ref, factor = 0.04) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) * factor;
      const dy = (e.clientY - cy) * factor;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [ref, factor]);
}

const marqueeItems = [
  "Easy Formatting",
  "Private & Public Collections",
  "Safe Blogs",
  "Rich Templates",
  "Pin Your Favorites",
  "Stay Organized",
  "Write Freely",
];

export default function BlogLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);

  useParallax(blob1Ref, 0.035);
  useParallax(blob2Ref, -0.028);
  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-logo">Blog<span>Hub</span></div>
        <button className="nav-cta" onClick={() => window.location.href = '/login'}>Start Reading →</button>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="menu">
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mob-menu${menuOpen ? " open" : ""}`}>
        <a href="/login" className="mob-cta" onClick={() => setMenuOpen(false)}>Start Reading →</a>
      </div>

      <section className="hero">
        <div className="hero-stripe" />
        <div className="hero-blob hero-blob-1" ref={blob1Ref} />
        <div className="hero-blob hero-blob-2" ref={blob2Ref} />

        <div className="hero-eyebrow">✦ Your Blogging Platform</div>

        <h1 className="hero-title">
          Make Your Writing<br />
          <span className="highlight">Bold</span>
        </h1>

        <p className="hero-sub">
          Discover stories, thinking, and expertise from writers on any topic
          that matters to you. <strong>A modern space</strong> for creators{" "}
          <span className="hl">and readers</span>.
        </p>

        <div className="hero-actions">
          <button className="btn-primary" onClick={() => window.location.href = '/login'}>Start Writing →</button>
          <button className="btn-secondary" onClick={() => window.location.href = '/login'}>Browse Articles</button>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div className="marquee-item" key={i}>
              <span className="m-icon">✦</span> {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <section className="section">
          <div className="reveal"><span className="section-tag">Why Choose Us</span></div>
          <h2 className="section-title reveal">Everything you need<br />to write and share</h2>
          <p className="section-sub reveal">
            A clean, powerful platform built for writers who want to focus on what matters — their words.
          </p>
          <div className="feat-grid stagger">
            {[
              { icon:"📁", title:"Folders & Pins", desc:"Organize your writing with public and private folders. Pin your favorite pieces for quick access whenever you need them.", dark:false },
              { icon:"📝", title:"Rich Templates", desc:"Jump-start your writing with a growing library of beautiful, customizable templates built for every occasion.", dark:true },
              { icon:"✏️", title:"Easy Formatting", desc:"Write with confidence using our powerful editor. Bold, italic, headings, and more — all at your fingertips.", dark:false },
            ].map(f => (
              <div key={f.title} className={`feat-card${f.dark ? " dark" : ""}`}>
                <div className="feat-icon">{f.icon}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer>
        <div className="footer-logo">Blog<span>Hub</span></div>
        <div className="footer-copy">© 2026 BlogHub. All rights reserved.</div>
      </footer>
    </>
  );
}
