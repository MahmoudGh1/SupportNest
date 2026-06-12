"use client"

import { useInView } from "@/hooks/useInView"

const TESTIMONIALS = [
  {
    quote:    "SupportNest resolved 82% of our tickets automatically in the first week. Our agents now focus on what actually needs a human.",
    name:     "Sara Ahmed",
    role:     "Head of Support, TechFlow",
    initials: "SA",
    color:    "#534AB7",
  },
  {
    quote:    "Setup took 20 minutes. We uploaded our FAQ docs, embedded the widget, and the AI was answering customer questions that same day.",
    name:     "James Carter",
    role:     "Founder, CloudBase",
    initials: "JC",
    color:    "#1D9E75",
  },
  {
    quote:    "The escalation flow is seamless. Agents get the full conversation and context — no more 'can you repeat your issue' moments.",
    name:     "Lena Müller",
    role:     "CX Manager, Nexus AI",
    initials: "LM",
    color:    "#4F46E5",
  },
]

export default function CustomerStories() {
  const { ref, visible } = useInView()

  return (
    <section id="testimonials" className="py-[90px] px-[5%]" style={{ background: "var(--page-bg)" }}>
      <div className="max-w-[1100px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-13">
          <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">
            Customer stories
          </div>
          <h2
            className="font-extrabold text-[#1a1830] tracking-[-0.025em] m-0"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}
          >
            Teams love SupportNest
          </h2>
        </div>

        {/* Cards */}
        <div ref={ref} className="grid grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="bg-[#f6f5fc] border-[1.5px] border-[#e8e6f0] rounded-2xl px-6 py-7"
              style={{
                opacity:    visible ? 1 : 0,
                transform:  visible ? "translateY(0)" : "translateY(22px)",
                transition: `all .5s ease ${(i * 0.12).toFixed(2)}s`,
              }}
            >
              {/* Stars */}
              <div className="flex gap-[3px] mb-4">
                {[...Array(5)].map((_, j) => (
                  <i key={j} className="ti ti-star-filled text-sm text-[#F59E0B]" />
                ))}
              </div>

              <p className="text-sm text-[#3d3a55] leading-[1.7] mt-0 mb-5 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
                  style={{ background: t.color }}
                >
                  {t.initials}
                </div>
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