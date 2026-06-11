"use client"

import { useInView } from "@/hooks/useInView"

const STATS = [
  { val: "2024", label: "Founded",             bg: "#EEEDFE", color: "#534AB7" },
  { val: "4",    label: "Core team members",   bg: "#E1F5EE", color: "#1D9E75" },
  { val: "80%",  label: "Avg auto-resolution", bg: "#FEF3C7", color: "#92400E" },
  { val: "24/7", label: "AI availability",     bg: "#EDE9FE", color: "#5B21B6" },
]

const VALUES = [
  {
    icon:  "ti-bolt",
    title: "Speed first",
    desc:  "We believe support shouldn't make customers wait. Every second of delay costs trust.",
  },
  {
    icon:  "ti-brain",
    title: "AI with guardrails",
    desc:  "AI handles volume, humans handle nuance. Our pipeline knows exactly when to switch.",
  },
  {
    icon:  "ti-lock",
    title: "Data isolation",
    desc:  "Every tenant is completely isolated. Your customer data never touches another business.",
  },
  {
    icon:  "ti-heart",
    title: "Agent wellbeing",
    desc:  "We eliminate Tier 1 grunt work so your agents focus on high-value, satisfying work.",
  },
]

export default function About() {
  const { ref, visible } = useInView()

  return (
    <section id="about" className="py-[90px] px-[5%]" style={{ background: "var(--page-bg)" }}>
      <div className="max-w-[1100px] mx-auto">

        {/* Story + stats split */}
        <div className="grid gap-16 items-center mb-[72px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {/* Story */}
          <div
            ref={ref}
            style={{
              opacity:    visible ? 1 : 0,
              transform:  visible ? "translateX(0)" : "translateX(-24px)",
              transition: "all .6s ease",
            }}
          >
            <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-5">
              About SupportNest
            </div>
            <h2
              className="font-extrabold text-[#1a1830] tracking-[-0.025em] leading-[1.2] mt-0 mb-[18px]"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)" }}
            >
              Built by engineers who hated bad support
            </h2>
            <p className="text-[15px] text-[#64607a] leading-[1.8] mt-0 mb-4">
              SupportNest was born out of a frustration every SaaS founder knows: customer support is the #1 cost
              center, yet the tools haven't changed in a decade. Tickets pile up, agents burn out, and customers
              churn after one bad experience.
            </p>
            <p className="text-[15px] text-[#64607a] leading-[1.8] m-0">
              We built SupportNest to change that — a platform where AI handles the predictable, humans handle
              the unpredictable, and customers always get a fast, accurate answer.
            </p>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="rounded-2xl px-5 py-6 text-center"
                style={{
                  background:  s.bg,
                  opacity:     visible ? 1 : 0,
                  transform:   visible ? "scale(1)" : "scale(0.95)",
                  transition:  `all .5s ease ${(i * 0.1).toFixed(1)}s`,
                }}
              >
                <div
                  className="text-4xl font-extrabold tracking-[-0.03em] mb-1.5"
                  style={{ color: s.color }}
                >
                  {s.val}
                </div>
                <div className="text-xs font-semibold opacity-80" style={{ color: s.color }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <h3 className="text-xl font-bold text-[#1a1830] text-center mb-8 tracking-tight">
          What we stand for
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {VALUES.map((v, i) => (
            <div
              key={v.title}
              className="bg-[#f6f5fc] border-[1.5px] border-[#e8e6f0] rounded-2xl px-5 py-6"
              style={{
                opacity:    visible ? 1 : 0,
                transform:  visible ? "translateY(0)" : "translateY(20px)",
                transition: `all .5s ease ${(i * 0.1).toFixed(1)}s`,
              }}
            >
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