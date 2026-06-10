"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const STATS = [
  { val: "80%",  label: "Tickets auto-resolved" },
  { val: "70%",  label: "Support cost reduction" },
  { val: "1.4s", label: "Avg AI response time"   },
  { val: "4.8★", label: "Average CSAT score"     },
]

export default function Hero() {
  const [on, setOn] = useState(false)
  useEffect(() => { setTimeout(() => setOn(true), 80) }, [])

  const anim = (delay = 0): React.CSSProperties => ({
    opacity: on ? 1 : 0,
    transform: on ? "translateY(0)" : "translateY(20px)",
    transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
  })

  return (
    <section className="relative overflow-hidden bg-white text-center pt-[140px] pb-[100px] px-[5%]">
      {/* Background blobs */}
      <div className="absolute pointer-events-none rounded-full" style={{ top: -120, left: "50%", transform: "translateX(-50%)", width: 800, height: 500, background: "radial-gradient(ellipse, rgba(83,74,183,0.07) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none rounded-full" style={{ top: 60, left: "5%", width: 260, height: 260, background: "radial-gradient(circle, rgba(83,74,183,0.05) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none rounded-full" style={{ top: 40, right: "5%", width: 220, height: 220, background: "radial-gradient(circle, rgba(175,169,236,0.07) 0%, transparent 70%)" }} />

      {/* Badge */}
      <div style={anim(0)} className="inline-flex items-center gap-1.5 bg-[#EEEDFE] border border-[#AFA9EC]/25 rounded-full px-3.5 py-1.5 mb-7">
        <div className="w-[7px] h-[7px] rounded-full bg-[#1D9E75] shadow-[0_0_0_3px_#E1F5EE]" />
        <span className="text-[#534AB7] text-[13px] font-semibold">AI-Powered Customer Support Platform</span>
      </div>

      {/* Headline */}
      <h1
        style={{ ...anim(.1), fontSize: "clamp(2.4rem, 5.5vw, 4rem)" }}
        className="font-extrabold text-[#1a1830] leading-[1.1] tracking-[-0.03em] max-w-[780px] mx-auto mb-5 mt-0"
      >
        Resolve <span className="text-[#534AB7]">80% of tickets</span> instantly with AI agents
      </h1>

      {/* Sub-headline */}
      <p
        style={{ ...anim(.2), fontSize: "clamp(1rem, 1.8vw, 1.15rem)" }}
        className="text-[#64607a] leading-[1.75] max-w-[560px] mx-auto mb-11 mt-0"
      >
        SupportNest deploys a hierarchy of specialized AI agents that handle customer inquiries,
        automate workflows, and escalate complex issues — 24/7, with full context.
      </p>

      {/* CTAs */}
      <div style={anim(.3)} className="flex gap-3 justify-center flex-wrap mb-16">
        <Link
          href="/register"
          className="bg-[#534AB7] hover:bg-[#7F77DD] text-white text-[15px] font-semibold no-underline px-[30px] py-[13px] rounded-[10px] shadow-[0_4px_20px_rgba(83,74,183,0.35)] hover:shadow-[0_8px_28px_rgba(83,74,183,0.4)] inline-flex items-center gap-2 hover:-translate-y-0.5 transition-all duration-200"
        >
          Start Free Trial <i className="ti ti-arrow-right text-base" />
        </Link>
        <a
          href="#pipeline"
          className="bg-white text-[#1a1830] hover:text-[#534AB7] text-[15px] font-semibold no-underline px-7 py-[13px] rounded-[10px] border-[1.5px] border-[#e8e6f0] hover:border-[#534AB7] inline-flex items-center gap-2 transition-all duration-200"
        >
          <i className="ti ti-player-play-filled text-[15px]" /> See How It Works
        </a>
      </div>

      {/* Stats bar */}
      <div style={anim(.45)} className="flex justify-center flex-wrap">
        {STATS.map((s, i) => (
          <div key={s.label} className={`px-10 py-5 text-center ${i < 3 ? "border-r border-[#e8e6f0]" : ""}`}>
            <div
              className="font-extrabold text-[#1a1830] tracking-[-0.03em]"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}
            >
              {s.val}
            </div>
            <div className="text-[13px] text-[#64607a] mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}