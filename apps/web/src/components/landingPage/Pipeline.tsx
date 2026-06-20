"use client";

import { useInView } from "@/hooks/useInView";
import { Trans, useLingui } from "@lingui/react/macro";
import { useContext } from "react";
import { LocaleContext } from "@/context/local-context";

export default function Pipeline() {
  const { t } = useLingui();
  const { ref } = useInView();
  const locale = useContext(LocaleContext)?.locale ?? "en";
  const fmt = (val: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(val);

  const TIERS = [
    {
      tag: t`ROUTER`,
      name: t`Intent Detection`,
      icon: "ti-route",
      color: "#AFA9EC",
      desc: t`Classifies intent and routes to the right agent instantly.`,
      featured: false,
    },
    {
      tag: t`TIER 1`,
      name: t`AI Instant Answer`,
      icon: "ti-cpu",
      color: "#534AB7",
      desc: t`RAG-powered answers from your knowledge base in under 2s.`,
      featured: true,
    },
    {
      tag: t`TIER 2`,
      name: t`AI Troubleshooter`,
      icon: "ti-tool",
      color: "#4F46E5",
      desc: t`Complex multi-step reasoning for edge cases and errors.`,
      featured: false,
    },
    {
      tag: t`HUMAN`,
      name: t`Agent Handoff`,
      icon: "ti-headset",
      color: "#1D9E75",
      desc: t`Full context passed to your agent. Never start from scratch.`,
      featured: false,
    },
  ];

  return (
    <section
      id="pipeline"
      className="py-16 md:py-[90px] px-4 sm:px-[5%]"
      style={{ background: "var(--page-bg)" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-block bg-brand-faint text-brand text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">
            <Trans>How it works</Trans>
          </div>
          <h2
            className="font-extrabold text-brand tracking-[-0.025em] mb-3.5 mt-0"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)" }}
          >
            <Trans>The AI agent pipeline</Trans>
          </h2>
          <p className="text-sm sm:text-base sn-muted max-w-[520px] mx-auto m-0">
            <Trans>
              Four layers of intelligence — each one smarter than the last.{" "}
              {fmt(80)}% of tickets never reach a human.
            </Trans>
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className="relative rounded-2xl px-5 py-7 text-center"
              style={{
                background: tier.featured ? "var(--color-brand)" : "var(--surface)",
                color: tier.featured ? "white" : "var(--page-text)",
                border: `1.5px solid ${tier.featured ? "var(--color-brand)" : "var(--card-border)"}`,
                boxShadow: tier.featured ? "0 12px 40px rgba(83,74,183,0.25)" : "none",
              }}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success text-white text-[10px] font-bold px-3 py-[3px] rounded-full tracking-[.06em] whitespace-nowrap">
                  <Trans>PRIMARY AI</Trans>
                </div>
              )}

              <div
                className="text-[11px] font-bold tracking-[.1em] uppercase mb-4"
                style={{
                  color: tier.featured ? "rgba(255,255,255,0.5)" : "var(--color-brand-mid)",
                }}
              >
                <Trans>Step {fmt(i + 1)} · {tier.tag}</Trans>
              </div>

              <div
                className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mx-auto mb-4"
                style={{
                  background: tier.featured ? "rgba(255,255,255,0.15)" : `${tier.color}15`,
                }}
              >
                <i
                  className={`ti ${tier.icon} text-2xl`}
                  style={{ color: tier.featured ? "#fff" : tier.color }}
                />
              </div>

              <div
                className="text-[15px] font-bold mb-2.5"
                style={{ color: tier.featured ? "#fff" : "var(--page-text)" }}
              >
                {tier.name}
              </div>

              <div
                className="text-[13px] leading-relaxed"
                style={{
                  color: tier.featured ? "rgba(255,255,255,0.7)" : "var(--page-muted)",
                }}
              >
                {tier.desc}
              </div>

              {i < TIERS.length - 1 && (
                <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-surface border border-brand-mid/20 rounded-full items-center justify-center">
                  <i className="ti ti-chevron-right text-[13px] text-brand-mid" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}