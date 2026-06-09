"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const navLinks: [string, string][] = [
    ["Features",         "#features"      ],
    ["How It Works",     "#pipeline"      ],
    ["Pricing",          "#pricing"       ],
    ["Customer Stories", "#testimonials"  ],
    ["About",            "#about"         ],
    ["Contact",          "#contact"       ],
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] h-16 px-[5%] flex items-center justify-between transition-all duration-300 backdrop-blur-md ${
      scrolled ? "bg-white/95 border-b border-[#e8e6f0]" : "bg-white/80 border-b border-transparent"
    }`}>
      {/* Logo */}
      <a href="#" className="flex items-center gap-2.5 no-underline">
        <div className="w-9 h-9 bg-[#534AB7] rounded-[10px] flex items-center justify-center shrink-0">
          <i className="ti ti-shield-check text-white text-lg" />
        </div>
        <span className="text-[#1a1830] text-[17px] font-bold tracking-tight">SupportNest</span>
      </a>

      {/* Nav links */}
      <div className="flex items-center gap-7">
        {navLinks.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="text-[#64607a] text-sm font-medium no-underline hover:text-[#534AB7] transition-colors duration-150"
          >
            {label}
          </a>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/login"
          className="text-[#3d3a55] text-sm font-medium no-underline px-4 py-2 rounded-lg hover:bg-[#EEEDFE] hover:text-[#534AB7] transition-all duration-150"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="bg-[#534AB7] hover:bg-[#7F77DD] text-white text-sm font-medium no-underline px-5 py-2 rounded-lg shadow-[0_2px_8px_rgba(83,74,183,0.3)] hover:-translate-y-px transition-all duration-150"
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [on, setOn] = useState(false)
  useEffect(() => { setTimeout(() => setOn(true), 80) }, [])

  const anim = (delay = 0): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(20px)",
    transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
  })

  return (
    <section className="relative overflow-hidden bg-white text-center pt-[140px] pb-[100px] px-[5%]">
      <div className="absolute pointer-events-none rounded-full" style={{ top: -120, left: "50%", transform: "translateX(-50%)", width: 800, height: 500, background: "radial-gradient(ellipse, rgba(83,74,183,0.07) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none rounded-full" style={{ top: 60, left: "5%", width: 260, height: 260, background: "radial-gradient(circle, rgba(83,74,183,0.05) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none rounded-full" style={{ top: 40, right: "5%", width: 220, height: 220, background: "radial-gradient(circle, rgba(175,169,236,0.07) 0%, transparent 70%)" }} />

      <div style={anim(0)} className="inline-flex items-center gap-1.5 bg-[#EEEDFE] border border-[#AFA9EC]/25 rounded-full px-3.5 py-1.5 mb-7">
        <div className="w-[7px] h-[7px] rounded-full bg-[#1D9E75] shadow-[0_0_0_3px_#E1F5EE]" />
        <span className="text-[#534AB7] text-[13px] font-semibold">AI-Powered Customer Support Platform</span>
      </div>

      <h1 style={{ ...anim(.1), fontSize: "clamp(2.4rem, 5.5vw, 4rem)" }} className="font-extrabold text-[#1a1830] leading-[1.1] tracking-[-0.03em] max-w-[780px] mx-auto mb-5 mt-0">
        Resolve <span className="text-[#534AB7]">80% of tickets</span> instantly with AI agents
      </h1>

      <p style={{ ...anim(.2), fontSize: "clamp(1rem, 1.8vw, 1.15rem)" }} className="text-[#64607a] leading-[1.75] max-w-[560px] mx-auto mb-11 mt-0">
        SupportNest deploys a hierarchy of specialized AI agents that handle customer inquiries, automate workflows, and escalate complex issues — 24/7, with full context.
      </p>

      <div style={anim(.3)} className="flex gap-3 justify-center flex-wrap mb-16">
        <Link href="/register" className="bg-[#534AB7] hover:bg-[#7F77DD] text-white text-[15px] font-semibold no-underline px-[30px] py-[13px] rounded-[10px] shadow-[0_4px_20px_rgba(83,74,183,0.35)] hover:shadow-[0_8px_28px_rgba(83,74,183,0.4)] inline-flex items-center gap-2 hover:-translate-y-0.5 transition-all duration-200">
          Start Free Trial <i className="ti ti-arrow-right text-base" />
        </Link>
        <a href="#pipeline" className="bg-white text-[#1a1830] hover:text-[#534AB7] text-[15px] font-semibold no-underline px-7 py-[13px] rounded-[10px] border-[1.5px] border-[#e8e6f0] hover:border-[#534AB7] inline-flex items-center gap-2 transition-all duration-200">
          <i className="ti ti-player-play-filled text-[15px]" /> See How It Works
        </a>
      </div>

      <div style={anim(.45)} className="flex justify-center flex-wrap">
        {[
          { val: "80%",  label: "Tickets auto-resolved" },
          { val: "70%",  label: "Support cost reduction" },
          { val: "1.4s", label: "Avg AI response time"   },
          { val: "4.8★", label: "Average CSAT score"     },
        ].map((s, i) => (
          <div key={s.label} className={`px-10 py-5 text-center ${i < 3 ? "border-r border-[#e8e6f0]" : ""}`}>
            <div className="font-extrabold text-[#1a1830] tracking-[-0.03em]" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>{s.val}</div>
            <div className="text-[13px] text-[#64607a] mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── PIPELINE ─────────────────────────────────────────────────────────────────
function Pipeline() {
  const { ref, visible } = useInView()
  const tiers = [
    { tag: "ROUTER", name: "Intent Detection",  icon: "ti-route",   color: "#AFA9EC", desc: "Classifies intent and routes to the right agent instantly.",        featured: false },
    { tag: "TIER 1", name: "AI Instant Answer", icon: "ti-cpu",     color: "#534AB7", desc: "RAG-powered answers from your knowledge base in under 2s.",         featured: true  },
    { tag: "TIER 2", name: "AI Troubleshooter", icon: "ti-tool",    color: "#4F46E5", desc: "Complex multi-step reasoning for edge cases and errors.",            featured: false },
    { tag: "HUMAN",  name: "Agent Handoff",     icon: "ti-headset", color: "#1D9E75", desc: "Full context passed to your agent. Never start from scratch.",       featured: false },
  ]

  return (
    <section id="pipeline" className="py-[90px] px-[5%] bg-white">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-14">
          <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">How it works</div>
          <h2 className="font-extrabold text-[#1a1830] tracking-[-0.025em] mb-3.5 mt-0" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}>The AI agent pipeline</h2>
          <p className="text-base text-[#64607a] max-w-[520px] mx-auto m-0">Four layers of intelligence — each one smarter than the last. 80% of tickets never reach a human.</p>
        </div>
        <div ref={ref} className="grid grid-cols-4 gap-4">
          {tiers.map((tier, i) => (
            <div key={tier.name} className="relative rounded-2xl px-5 py-7 text-center"
              style={{ background: tier.featured ? "#534AB7" : "#fff", border: `1.5px solid ${tier.featured ? "#534AB7" : "#e8e6f0"}`, boxShadow: tier.featured ? "0 12px 40px rgba(83,74,183,0.25)" : "0 2px 8px rgba(0,0,0,0.04)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)", transition: `all .55s ease ${(i * .1).toFixed(1)}s` }}>
              {tier.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1D9E75] text-white text-[10px] font-bold px-3 py-[3px] rounded-full tracking-[.06em] whitespace-nowrap">PRIMARY AI</div>}
              <div className="text-[11px] font-bold tracking-[.1em] uppercase mb-4" style={{ color: tier.featured ? "rgba(255,255,255,0.5)" : "#AFA9EC" }}>Step {i + 1} · {tier.tag}</div>
              <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mx-auto mb-4" style={{ background: tier.featured ? "rgba(255,255,255,0.15)" : `${tier.color}15` }}>
                <i className={`ti ${tier.icon} text-2xl`} style={{ color: tier.featured ? "#fff" : tier.color }} />
              </div>
              <div className="text-[15px] font-bold mb-2.5" style={{ color: tier.featured ? "#fff" : "#1a1830" }}>{tier.name}</div>
              <div className="text-[13px] leading-relaxed" style={{ color: tier.featured ? "rgba(255,255,255,0.7)" : "#64607a" }}>{tier.desc}</div>
              {i < tiers.length - 1 && (
                <div className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border-[1.5px] border-[#e8e6f0] rounded-full flex items-center justify-center">
                  <i className="ti ti-chevron-right text-[13px] text-[#AFA9EC]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FEATURES ─────────────────────────────────────────────────────────────────
function Features() {
  const { ref, visible } = useInView()
  const features = [
    { icon: "ti-bolt",            title: "Instant AI Resolution", desc: "Tier 1 AI resolves common questions in under 2 seconds using your knowledge base.",   color: "#534AB7" },
    { icon: "ti-book",            title: "Knowledge Base RAG",    desc: "Upload PDFs, FAQs, docs. AI learns your product and answers accurately.",               color: "#4F46E5" },
    { icon: "ti-message-chatbot", title: "Embeddable Widget",     desc: "One script tag. Fully branded, mobile-ready live chat on any website.",                 color: "#1D9E75" },
    { icon: "ti-chart-bar",       title: "Real-time Analytics",   desc: "CSAT, resolution rates, escalation trends — all live on your dashboard.",               color: "#F59E0B" },
    { icon: "ti-headset",         title: "Human Agent Inbox",     desc: "Escalated tickets arrive with full conversation context. Agents never start cold.",      color: "#E24B4A" },
    { icon: "ti-building",        title: "Multi-tenant Ready",    desc: "Each business is fully isolated — own data, knowledge base, and widget config.",         color: "#0891B2" },
  ]

  return (
    <section id="features" className="py-[90px] px-[5%] bg-[#f6f5fc]">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-14">
          <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">Everything included</div>
          <h2 className="font-extrabold text-[#1a1830] tracking-[-0.025em] mb-3.5 mt-0" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}>Built for modern support teams</h2>
          <p className="text-base text-[#64607a] max-w-[480px] mx-auto m-0">From AI pipeline to human inbox — the full support workflow in one place.</p>
        </div>
        <div ref={ref} className="grid grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 cursor-default"
              style={{ border: "1.5px solid #e8e6f0", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(22px)", transition: `all .5s ease ${(i * .08).toFixed(2)}s` }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${f.color}50`; el.style.boxShadow = `0 4px 20px ${f.color}15`; el.style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#e8e6f0"; el.style.boxShadow = "none"; el.style.transform = "translateY(0)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}12` }}>
                <i className={`ti ${f.icon} text-[22px]`} style={{ color: f.color }} />
              </div>
              <div className="text-[15px] font-bold text-[#1a1830] mb-2">{f.title}</div>
              <div className="text-[13px] text-[#64607a] leading-[1.65]">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CUSTOMER STORIES ─────────────────────────────────────────────────────────
function CustomerStories() {
  const { ref, visible } = useInView()
  const testimonials = [
    { quote: "SupportNest resolved 82% of our tickets automatically in the first week. Our agents now focus on what actually needs a human.", name: "Sara Ahmed",   role: "Head of Support, TechFlow", initials: "SA", color: "#534AB7" },
    { quote: "Setup took 20 minutes. We uploaded our FAQ docs, embedded the widget, and the AI was answering customer questions that same day.", name: "James Carter", role: "Founder, CloudBase",       initials: "JC", color: "#1D9E75" },
    { quote: "The escalation flow is seamless. Agents get the full conversation and context — no more 'can you repeat your issue' moments.", name: "Lena Müller",  role: "CX Manager, Nexus AI",      initials: "LM", color: "#4F46E5" },
  ]

  return (
    <section id="testimonials" className="py-[90px] px-[5%] bg-white">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-13">
          <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">Customer stories</div>
          <h2 className="font-extrabold text-[#1a1830] tracking-[-0.025em] m-0" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}>Teams love SupportNest</h2>
        </div>
        <div ref={ref} className="grid grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div key={t.name} className="bg-[#f6f5fc] border-[1.5px] border-[#e8e6f0] rounded-2xl px-6 py-7"
              style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(22px)", transition: `all .5s ease ${(i * .12).toFixed(2)}s` }}>
              <div className="flex gap-[3px] mb-4">
                {[...Array(5)].map((_, j) => <i key={j} className="ti ti-star-filled text-sm text-[#F59E0B]" />)}
              </div>
              <p className="text-sm text-[#3d3a55] leading-[1.7] mt-0 mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0" style={{ background: t.color }}>{t.initials}</div>
                <div>
                  <div className="text-[13px] font-bold text-[#1a1830]">{t.name}</div>
                  <div className="text-xs text-[#64607a]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── PRICING ──────────────────────────────────────────────────────────────────
function Pricing() {
  const { ref, visible } = useInView()
  const [annual, setAnnual] = useState(false)
  const plans = [
    { name: "Starter",    price: annual ? 29 : 39,  desc: "Perfect for small teams getting started.",          convos: "500",       agents: "2",         docs: "10",        features: ["Tier 1 AI (RAG)", "Embeddable widget", "Basic analytics", "Email support"],                                                             featured: false },
    { name: "Growth",     price: annual ? 79 : 99,  desc: "For growing businesses needing full AI coverage.",  convos: "5,000",     agents: "10",        docs: "50",        features: ["Tier 1 + Tier 2 AI", "Human agent inbox", "Advanced analytics", "Custom widget branding", "API access", "Priority support"],            featured: true  },
    { name: "Enterprise", price: null,               desc: "Unlimited scale with dedicated support.",           convos: "Unlimited", agents: "Unlimited", docs: "Unlimited", features: ["Full AI pipeline", "Dedicated infrastructure", "SLA guarantee", "Custom integrations", "SSO / SAML", "Onboarding specialist"],          featured: false },
  ]

  return (
    <section id="pricing" className="py-[90px] px-[5%] bg-[#f6f5fc]">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">Pricing</div>
          <h2 className="font-extrabold text-[#1a1830] tracking-[-0.025em] mb-3 mt-0" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}>Simple, transparent pricing</h2>
          <p className="text-base text-[#64607a] mb-7">Start free. No credit card required.</p>
          <div className="inline-flex items-center gap-3 bg-white border-[1.5px] border-[#e8e6f0] rounded-full pl-4 pr-1.5 py-1.5">
            <span className={`text-[13px] font-medium ${annual ? "text-[#64607a]" : "text-[#1a1830]"}`}>Monthly</span>
            <button onClick={() => setAnnual(a => !a)} className="relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors duration-200" style={{ background: annual ? "#534AB7" : "#ddd" }}>
              <div className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200" style={{ left: annual ? 23 : 3 }} />
            </button>
            <span className={`text-[13px] font-medium ${annual ? "text-[#1a1830]" : "text-[#64607a]"}`}>Annual</span>
            {annual && <span className="bg-[#1D9E75] text-white text-[10px] font-bold px-2.5 py-[3px] rounded-full">Save 25%</span>}
          </div>
        </div>
        <div ref={ref} className="grid grid-cols-3 gap-4 items-start">
          {plans.map((plan, i) => (
            <div key={plan.name} className="relative rounded-[18px] p-8 overflow-hidden"
              style={{ background: plan.featured ? "#534AB7" : "#fff", border: `1.5px solid ${plan.featured ? "#534AB7" : "#e8e6f0"}`, boxShadow: plan.featured ? "0 20px 60px rgba(83,74,183,0.3)" : "0 2px 12px rgba(0,0,0,0.04)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `all .55s ease ${(i * .12).toFixed(2)}s` }}>
              {plan.featured && <div className="absolute top-[18px] right-[18px] bg-white text-[#534AB7] text-[10px] font-bold px-2.5 py-[3px] rounded-full tracking-[.06em]">MOST POPULAR</div>}
              <div className="text-[17px] font-extrabold mb-1.5" style={{ color: plan.featured ? "#fff" : "#1a1830" }}>{plan.name}</div>
              <div className="text-[13px] mb-6 leading-relaxed" style={{ color: plan.featured ? "rgba(255,255,255,0.7)" : "#64607a" }}>{plan.desc}</div>
              <div className="mb-6">
                {plan.price ? (
                  <div className="flex items-end gap-1">
                    <span className="text-[44px] font-extrabold leading-none tracking-[-0.04em]" style={{ color: plan.featured ? "#fff" : "#1a1830" }}>${plan.price}</span>
                    <span className="text-sm mb-1.5" style={{ color: plan.featured ? "rgba(255,255,255,0.6)" : "#64607a" }}>/month</span>
                  </div>
                ) : <div className="text-4xl font-extrabold" style={{ color: plan.featured ? "#fff" : "#1a1830" }}>Custom</div>}
              </div>
              <div className="rounded-[10px] px-3.5 py-3 mb-5" style={{ background: plan.featured ? "rgba(255,255,255,0.1)" : "#f6f5fc" }}>
                {[{ icon: "ti-message-2", v: plan.convos + " conversations/mo" }, { icon: "ti-users", v: plan.agents + " agents" }, { icon: "ti-book", v: plan.docs + " knowledge docs" }].map(r => (
                  <div key={r.v} className="flex items-center gap-2 py-1 text-xs" style={{ color: plan.featured ? "rgba(255,255,255,0.75)" : "#64607a" }}>
                    <i className={`ti ${r.icon} text-sm`} style={{ color: plan.featured ? "rgba(255,255,255,0.5)" : "#AFA9EC" }} />{r.v}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-[9px] mb-7">
                {plan.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-[13px]" style={{ color: plan.featured ? "rgba(255,255,255,0.9)" : "#3d3a55" }}>
                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: plan.featured ? "rgba(255,255,255,0.2)" : "#EEEDFE" }}>
                      <i className="ti ti-check text-[11px]" style={{ color: plan.featured ? "#fff" : "#534AB7" }} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
              <Link href={plan.price ? "/register" : "#contact"} className="block text-center no-underline py-3 px-5 rounded-[10px] text-sm font-bold hover:opacity-[0.88] transition-opacity"
                style={{ background: plan.featured ? "#fff" : "#534AB7", color: plan.featured ? "#534AB7" : "#fff", boxShadow: plan.featured ? "none" : "0 4px 14px rgba(83,74,183,0.3)" }}>
                {plan.price ? "Start free trial" : "Contact sales"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
function About() {
  const { ref, visible } = useInView()
  const values = [
    { icon: "ti-bolt",  title: "Speed first",        desc: "We believe support shouldn't make customers wait. Every second of delay costs trust."              },
    { icon: "ti-brain", title: "AI with guardrails",  desc: "AI handles volume, humans handle nuance. Our pipeline knows exactly when to switch."              },
    { icon: "ti-lock",  title: "Data isolation",      desc: "Every tenant is completely isolated. Your customer data never touches another business."           },
    { icon: "ti-heart", title: "Agent wellbeing",     desc: "We eliminate Tier 1 grunt work so your agents focus on high-value, satisfying work."              },
  ]

  return (
    <section id="about" className="py-[90px] px-[5%] bg-white">
      <div className="max-w-[1100px] mx-auto">

        {/* Split: story + stats */}
        <div className="grid gap-16 items-center mb-[72px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-24px)", transition: "all .6s ease" }}>
            <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-5">About SupportNest</div>
            <h2 className="font-extrabold text-[#1a1830] tracking-[-0.025em] leading-[1.2] mt-0 mb-[18px]" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)" }}>
              Built by engineers who hated bad support
            </h2>
            <p className="text-[15px] text-[#64607a] leading-[1.8] mt-0 mb-4">
              SupportNest was born out of a frustration every SaaS founder knows: customer support is the #1 cost center, yet the tools haven't changed in a decade. Tickets pile up, agents burn out, and customers churn after one bad experience.
            </p>
            <p className="text-[15px] text-[#64607a] leading-[1.8] m-0">
              We built SupportNest to change that — a platform where AI handles the predictable, humans handle the unpredictable, and customers always get a fast, accurate answer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { val: "2024", label: "Founded",             bg: "#EEEDFE", color: "#534AB7" },
              { val: "4",    label: "Core team members",   bg: "#E1F5EE", color: "#1D9E75" },
              { val: "80%",  label: "Avg auto-resolution", bg: "#FEF3C7", color: "#92400E" },
              { val: "24/7", label: "AI availability",     bg: "#EDE9FE", color: "#5B21B6" },
            ].map((s, i) => (
              <div key={s.label} className="rounded-2xl px-5 py-6 text-center"
                style={{ background: s.bg, opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.95)", transition: `all .5s ease ${(i * .1).toFixed(1)}s` }}>
                <div className="text-4xl font-extrabold tracking-[-0.03em] mb-1.5" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs font-semibold opacity-80" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <h3 className="text-xl font-bold text-[#1a1830] text-center mb-8 tracking-tight">What we stand for</h3>
        <div className="grid grid-cols-4 gap-4">
          {values.map((v, i) => (
            <div key={v.title} className="bg-[#f6f5fc] border-[1.5px] border-[#e8e6f0] rounded-2xl px-5 py-6"
              style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: `all .5s ease ${(i * .1).toFixed(1)}s` }}>
              <div className="w-11 h-11 rounded-xl bg-[#EEEDFE] flex items-center justify-center mb-3.5">
                <i className={`ti ${v.icon} text-[22px] text-[#534AB7]`} />
              </div>
              <div className="text-sm font-bold text-[#1a1830] mb-2">{v.title}</div>
              <div className="text-[13px] text-[#64607a] leading-[1.65]">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CONTACT ──────────────────────────────────────────────────────────────────
function Contact() {
  const { ref, visible } = useInView()
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setLoading(true)
    // 🔁 Replace with real API call: POST /api/contact
    setTimeout(() => { setLoading(false); setSent(true) }, 1200)
  }

  const inputCls = "w-full box-border px-3.5 py-2.5 text-sm border-[1.5px] border-[#e8e6f0] rounded-lg outline-none font-[inherit] text-[#1a1830] bg-white transition-colors duration-150 focus:border-[#534AB7]"

  return (
    <section id="contact" className="py-[90px] px-[5%] bg-[#f6f5fc]">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-13">
          <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">Get in touch</div>
          <h2 className="font-extrabold text-[#1a1830] tracking-[-0.025em] mb-3 mt-0" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}>We'd love to hear from you</h2>
          <p className="text-base text-[#64607a]">Questions, demos, or custom enterprise plans — we reply within 24 hours.</p>
        </div>

        <div ref={ref} className="grid gap-8" style={{ gridTemplateColumns: "1fr 1.6fr", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "all .6s ease" }}>

          {/* Left: info */}
          <div className="flex flex-col gap-4">
            <div className="bg-white border-[1.5px] border-[#e8e6f0] rounded-2xl p-7">
              <h3 className="text-base font-bold text-[#1a1830] mt-0 mb-1.5">Talk to sales</h3>
              <p className="text-[13px] text-[#64607a] leading-[1.7] mt-0 mb-5">Interested in SupportNest for your team? We'll walk you through a live demo and tailor a plan for your use case.</p>
              <div className="flex flex-col gap-3.5">
                {[
                  { icon: "ti-mail",           label: "Email us",  val: "hello@supportnest.ai", color: "#534AB7"  },
                  { icon: "ti-brand-twitter",  label: "Twitter",   val: "@supportnest",         color: "#1DA1F2"  },
                  { icon: "ti-brand-linkedin", label: "LinkedIn",  val: "SupportNest",          color: "#0A66C2"  },
                ].map(ch => (
                  <div key={ch.label} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${ch.color}12` }}>
                      <i className={`ti ${ch.icon} text-[18px]`} style={{ color: ch.color }} />
                    </div>
                    <div>
                      <div className="text-[11px] text-[#64607a] font-medium">{ch.label}</div>
                      <div className="text-[13px] font-semibold text-[#1a1830]">{ch.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#E1F5EE] border-[1.5px] border-[#1D9E75]/20 rounded-xl px-[18px] py-3.5 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#1D9E75] shrink-0" />
              <span className="text-[13px] text-[#0F6E56] font-semibold">Average reply time: under 4 hours</span>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white border-[1.5px] border-[#e8e6f0] rounded-2xl px-7 py-8">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
                  <i className="ti ti-check text-[26px] text-[#1D9E75]" />
                </div>
                <h3 className="text-lg font-bold text-[#1a1830] mb-2">Message sent!</h3>
                <p className="text-sm text-[#64607a]">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Your name *</label>
                    <input value={form.name} onChange={e => set("name")(e.target.value)} placeholder="Mohamed Rashad" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Work email *</label>
                    <input type="email" value={form.email} onChange={e => set("email")(e.target.value)} placeholder="you@company.com" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Company</label>
                  <input value={form.company} onChange={e => set("company")(e.target.value)} placeholder="Acme Corp" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#1a1830] mb-1.5">Message *</label>
                  <textarea value={form.message} onChange={e => set("message")(e.target.value)}
                    placeholder="Tell us about your team size, current support setup, and what you're hoping to solve..."
                    rows={4} className={`${inputCls} resize-y min-h-[100px]`} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#534AB7] hover:bg-[#7F77DD] disabled:opacity-70 text-white text-sm font-semibold py-3 px-5 rounded-[10px] border-none cursor-pointer font-[inherit] transition-colors flex items-center justify-center gap-2">
                  {loading ? "Sending…" : <><i className="ti ti-send text-base" /> Send message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA BANNER ───────────────────────────────────────────────────────────────
function CtaBanner() {
  const { ref, visible } = useInView()
  return (
    <section className="py-20 px-[5%] bg-white">
      <div ref={ref} className="max-w-[900px] mx-auto rounded-3xl px-10 py-[60px] text-center relative overflow-hidden shadow-[0_24px_80px_rgba(83,74,183,0.35)]"
        style={{ background: "linear-gradient(135deg, #534AB7 0%, #4F46E5 100%)", opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.97)", transition: "all .6s ease" }}>
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-[60px] -left-[60px] w-[240px] h-[240px] rounded-full bg-white/5 pointer-events-none" />
        <div className="text-xs text-white/60 font-bold tracking-[.1em] uppercase mb-[18px]">Get started today</div>
        <h2 className="font-extrabold text-white tracking-[-0.025em] mt-0 mb-3.5" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>Ready to resolve 80% of tickets instantly?</h2>
        <p className="text-base text-white/75 mb-9">No credit card required. Up and running in minutes.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register" className="bg-white text-[#534AB7] text-[15px] font-bold no-underline px-[30px] py-[13px] rounded-[10px] hover:bg-[#EEEDFE] hover:-translate-y-0.5 transition-all duration-200">Start Free Trial</Link>
          <Link href="/login" className="bg-transparent text-white text-[15px] font-semibold no-underline px-7 py-[13px] rounded-[10px] border-[1.5px] border-white/35 hover:border-white/70 transition-all duration-200">Sign In</Link>
        </div>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const anchorMap: Record<string, string> = {
    Features: "#features", "How It Works": "#pipeline", Pricing: "#pricing",
    "Customer Stories": "#testimonials", About: "#about", Contact: "#contact",
  }
  const links = {
    Product: ["Features", "How It Works", "Pricing", "Changelog"],
    Company: ["Customer Stories", "About", "Careers", "Contact"],
    Legal:   ["Privacy Policy", "Terms of Service", "Security", "Status"],
  }

  return (
    <footer className="bg-[#1a1830] py-[60px] px-[5%] pb-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid gap-10 mb-12" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#534AB7] rounded-lg flex items-center justify-center">
                <i className="ti ti-shield-check text-white text-base" />
              </div>
              <span className="text-white text-base font-bold">SupportNest</span>
            </div>
            <p className="text-sm text-white/45 leading-[1.7] max-w-[260px] mt-0 mb-5">AI-powered customer support that resolves 80% of tickets instantly, 24/7.</p>
            <div className="flex gap-2.5">
              {["ti-brand-twitter", "ti-brand-linkedin", "ti-brand-github"].map(icon => (
                <div key={icon} className="w-[34px] h-[34px] rounded-lg bg-white/[0.07] hover:bg-white/[0.15] flex items-center justify-center cursor-pointer transition-colors duration-150">
                  <i className={`ti ${icon} text-base text-white/50`} />
                </div>
              ))}
            </div>
          </div>
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <div className="text-xs font-bold text-white/35 tracking-[.08em] uppercase mb-4">{group}</div>
              <div className="flex flex-col gap-2.5">
                {items.map(item => (
                  <a key={item} href={anchorMap[item] || "#"} className="text-sm text-white/50 hover:text-white no-underline transition-colors duration-150">{item}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.08] pt-7 flex justify-between items-center flex-wrap gap-3">
          <span className="text-[13px] text-white/30">© 2025 SupportNest. All rights reserved.</span>
          <span className="text-[13px] text-white/30">Built with ❤️ for support teams worldwide</span>
        </div>
      </div>
    </footer>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="font-sans bg-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Pipeline />
      <Features />
      <CustomerStories />
      <Pricing />
      <About />
      <Contact />
      <CtaBanner />
      <Footer />
    </div>
  )
}