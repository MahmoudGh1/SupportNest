"use client"

import { useInView } from "@/hooks/useInView";

const FEATURES = [
  {
    icon:  "ti-bolt",
    title: "Instant AI Resolution",
    desc:  "Tier 1 AI resolves common questions in under 2 seconds using your knowledge base.",
    color: "#534AB7",
  },
  {
    icon:  "ti-book",
    title: "Knowledge Base RAG",
    desc:  "Upload PDFs, FAQs, docs. AI learns your product and answers accurately.",
    color: "#4F46E5",
  },
  {
    icon:  "ti-message-chatbot",
    title: "Embeddable Widget",
    desc:  "One script tag. Fully branded, mobile-ready live chat on any website.",
    color: "#1D9E75",
  },
  {
    icon:  "ti-chart-bar",
    title: "Real-time Analytics",
    desc:  "CSAT, resolution rates, escalation trends — all live on your dashboard.",
    color: "#F59E0B",
  },
  {
    icon:  "ti-headset",
    title: "Human Agent Inbox",
    desc:  "Escalated tickets arrive with full conversation context. Agents never start cold.",
    color: "#E24B4A",
  },
  {
    icon:  "ti-building",
    title: "Multi-tenant Ready",
    desc:  "Each business is fully isolated — own data, knowledge base, and widget config.",
    color: "#0891B2",
  },
]

export default function Features() {
  const { ref, visible } = useInView()

  return (
    <section id="features" className="py-[90px] px-[5%] bg-[#f6f5fc]">
      <div className="max-w-[1100px] mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <div className="inline-block bg-[#EEEDFE] text-[#534AB7] text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">
            Everything included
          </div>
          <h2
            className="font-extrabold text-[#1a1830] tracking-[-0.025em] mb-3.5 mt-0"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}
          >
            Built for modern support teams
          </h2>
          <p className="text-base text-[#64607a] max-w-[480px] mx-auto m-0">
            From AI pipeline to human inbox — the full support workflow in one place.
          </p>
        </div>

        {/* Feature cards */}
        <div ref={ref} className="grid grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 cursor-default"
              style={{
                border:     "1.5px solid #e8e6f0",
                opacity:    visible ? 1 : 0,
                transform:  visible ? "translateY(0)" : "translateY(22px)",
                transition: `all .5s ease ${(i * 0.08).toFixed(2)}s`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${f.color}50`
                el.style.boxShadow   = `0 4px 20px ${f.color}15`
                el.style.transform   = "translateY(-2px)"
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "#e8e6f0"
                el.style.boxShadow   = "none"
                el.style.transform   = "translateY(0)"
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}12` }}
              >
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