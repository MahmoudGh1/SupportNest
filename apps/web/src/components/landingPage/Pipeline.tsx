"use client"

import { useInView } from "@/hooks/useInView"

const TIERS = [
  {
    tag:      "ROUTER",
    name:     "Intent Detection",
    icon:     "ti-route",
    color:    "#AFA9EC",
    desc:     "Classifies intent and routes to the right agent instantly.",
    featured: false,
  },
  {
    tag:      "TIER 1",
    name:     "AI Instant Answer",
    icon:     "ti-cpu",
    color:    "#534AB7",
    desc:     "RAG-powered answers from your knowledge base in under 2s.",
    featured: true,
  },
  {
    tag:      "TIER 2",
    name:     "AI Troubleshooter",
    icon:     "ti-tool",
    color:    "#4F46E5",
    desc:     "Complex multi-step reasoning for edge cases and errors.",
    featured: false,
  },
  {
    tag:      "HUMAN",
    name:     "Agent Handoff",
    icon:     "ti-headset",
    color:    "#1D9E75",
    desc:     "Full context passed to your agent. Never start from scratch.",
    featured: false,
  },
]

export default function Pipeline() {
  const { ref, visible } = useInView()

  return (
    <section id="pipeline" className="py-[90px] px-[5%] bg-white">
      <div className="max-w-[1100px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">
            How it works
          </div>
          <h2
            className="font-extrabold text-[#1a1830] tracking-[-0.025em] mb-3.5 mt-0"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}
          >
            The AI agent pipeline
          </h2>
          <p className="text-base text-[#64607a] max-w-[520px] mx-auto m-0">
            Four layers of intelligence — each one smarter than the last. 80% of tickets never reach a human.
          </p>
        </div>

        {/* Tier cards */}
        <div ref={ref} className="grid grid-cols-4 gap-4">
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className="relative rounded-2xl px-5 py-7 text-center"
              style={{
                background:   tier.featured ? "#534AB7" : "#fff",
                border:       `1.5px solid ${tier.featured ? "#534AB7" : "#e8e6f0"}`,
                boxShadow:    tier.featured ? "0 12px 40px rgba(83,74,183,0.25)" : "0 2px 8px rgba(0,0,0,0.04)",
                opacity:      visible ? 1 : 0,
                transform:    visible ? "translateY(0)" : "translateY(28px)",
                transition:   `all .55s ease ${(i * 0.1).toFixed(1)}s`,
              }}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1D9E75] text-white text-[10px] font-bold px-3 py-[3px] rounded-full tracking-[.06em] whitespace-nowrap">
                  PRIMARY AI
                </div>
              )}

              <div
                className="text-[11px] font-bold tracking-[.1em] uppercase mb-4"
                style={{ color: tier.featured ? "rgba(255,255,255,0.5)" : "#AFA9EC" }}
              >
                Step {i + 1} · {tier.tag}
              </div>

              <div
                className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mx-auto mb-4"
                style={{ background: tier.featured ? "rgba(255,255,255,0.15)" : `${tier.color}15` }}
              >
                <i
                  className={`ti ${tier.icon} text-2xl`}
                  style={{ color: tier.featured ? "#fff" : tier.color }}
                />
              </div>

              <div
                className="text-[15px] font-bold mb-2.5"
                style={{ color: tier.featured ? "#fff" : "#1a1830" }}
              >
                {tier.name}
              </div>

              <div
                className="text-[13px] leading-relaxed"
                style={{ color: tier.featured ? "rgba(255,255,255,0.7)" : "#64607a" }}
              >
                {tier.desc}
              </div>

              {/* Arrow connector */}
              {i < TIERS.length - 1 && (
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