"use client";

import { useInView } from "@/hooks/useInView";
import { Trans } from "@lingui/react/macro";

const FEATURES = [
  {
    icon: "ti-bolt",
    title: "Instant AI Resolution",
    desc: "Tier 1 AI resolves common questions in under 2 seconds using your knowledge base.",
    color: "#534AB7",
  },
  {
    icon: "ti-book",
    title: "Knowledge Base RAG",
    desc: "Upload PDFs, FAQs, docs. AI learns your product and answers accurately.",
    color: "#4F46E5",
  },
  {
    icon: "ti-message-chatbot",
    title: "Embeddable Widget",
    desc: "One script tag. Fully branded, mobile-ready live chat on any website.",
    color: "#1D9E75",
  },
  {
    icon: "ti-chart-bar",
    title: "Real-time Analytics",
    desc: "CSAT, resolution rates, escalation trends — all live on your dashboard.",
    color: "#F59E0B",
  },
  {
    icon: "ti-headset",
    title: "Human Agent Inbox",
    desc: "Escalated tickets arrive with full conversation context. Agents never start cold.",
    color: "#E24B4A",
  },
  {
    icon: "ti-building",
    title: "Multi-tenant Ready",
    desc: "Each business is fully isolated — own data, knowledge base, and widget config.",
    color: "#0891B2",
  },
];

export default function Features() {
  const { ref } = useInView();

  return (
    <section
      id="features"
      className="py-16 md:py-[90px] px-4 sm:px-[5%]"
      style={{ background: "var(--surface-elevated)" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-block bg-brand-faint text-brand text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">
            <Trans>Everything included</Trans>
          </div>
          <h2
            className="font-extrabold tracking-[-0.025em] mb-3.5 mt-0"
            style={{
              fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)",
              color: "var(--page-text)",
            }}
          >
            <Trans>Built for modern support teams</Trans>
          </h2>
          <p className="text-sm sm:text-base sn-muted max-w-[480px] mx-auto m-0">
            <Trans>
              From AI pipeline to human inbox — the full support workflow in one
              place.
            </Trans>
          </p>
        </div>

        {/* 1 col mobile → 2 col sm → 3 col md */}
        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="sn-surface rounded-2xl p-5 sm:p-6 border transition-transform hover:-translate-y-0.5"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.color}12` }}
              >
                <i
                  className={`ti ${f.icon} text-[22px]`}
                  style={{ color: f.color }}
                />
              </div>
              <div
                className="text-[15px] font-bold mb-2"
                style={{ color: "var(--page-text)" }}
              >
                {f.title}
              </div>
              <div className="text-[13px] sn-muted leading-[1.65]">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
