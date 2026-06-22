"use client";

import { useInView } from "@/hooks/useInView";
import { Trans, useLingui } from "@lingui/react/macro";
import { useContext } from "react";
import { LocaleContext } from "@/context/local-context";
export default function About() {
  const { t } = useLingui();
  const { ref, visible } = useInView();
  const locale = useContext(LocaleContext)?.locale ?? "en";
  const fmt = (val: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(val);
  const STATS = [
    {
      val: fmt(2026),
      label: t`Founded`,
      bg: "var(--color-brand-faint)",
      color: "var(--color-brand)",
    },
    {
      val: fmt(4),
      label: t`Core team members`,
      bg: "var(--color-success-bg)",
      color: "var(--color-success)",
    },
    {
      val: fmt(80) + "%",
      label: t`Avg auto-resolution`,
      bg: "var(--color-warning-bg)",
      color: "var(--color-warning)",
    },
    {
      val: fmt(24) + "/7",
      label: t`AI availability`,
      bg: "var(--color-brand-faint)",
      color: "var(--color-brand-dark)",
    },
  ];

  const VALUES = [
    {
      icon: "ti-bolt",
      title: t`Speed first`,
      desc: t`We believe support shouldn't make customers wait. Every second of delay costs trust.`,
    },
    {
      icon: "ti-brain",
      title: t`AI with guardrails`,
      desc: t`AI handles volume, humans handle nuance. Our pipeline knows exactly when to switch.`,
    },
    {
      icon: "ti-lock",
      title: t`Data isolation`,
      desc: t`Every tenant is completely isolated. Your customer data never touches another business.`,
    },
    {
      icon: "ti-heart",
      title: t`Agent wellbeing`,
      desc: t`We eliminate Tier 1 grunt work so your agents focus on high-value, satisfying work.`,
    },
  ];

  return (
    <section
      id="about"
      className="py-16 md:py-[90px] px-4 sm:px-[5%]"
      style={{ background: "var(--page-bg)" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-14 md:mb-[72px]">
          <div
            ref={ref}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-24px)",
              transition: "all .6s ease",
            }}
          >
            <div className="inline-block bg-brand-faint text-brand text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-5">
              <Trans>About SupportNest</Trans>
            </div>
            <h2
              className="font-extrabold sn-page-text tracking-[-0.025em] leading-[1.2] mt-0 mb-[18px]"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
            >
              <Trans>Built by engineers who hated bad support</Trans>
            </h2>
            <p className="text-[14px] sm:text-[15px] sn-muted leading-[1.8] mt-0 mb-4">
              <Trans>
                SupportNest was born out of a frustration every SaaS founder
                knows: customer support is the #1 cost center, yet the tools
                haven&apos;t changed in a decade. Tickets pile up, agents burn
                out, and customers churn after one bad experience.
              </Trans>
            </p>
            <p className="text-[14px] sm:text-[15px] sn-muted leading-[1.8] m-0">
              <Trans>
                We built SupportNest to change that — a platform where AI handles
                the predictable, humans handle the unpredictable, and customers
                always get a fast, accurate answer.
              </Trans>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="rounded-2xl px-4 sm:px-5 py-5 sm:py-6 text-center"
                style={{
                  background: s.bg,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "scale(1)" : "scale(0.95)",
                  transition: `all .5s ease ${(i * 0.1).toFixed(1)}s`,
                }}
              >
                <div
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[-0.03em] mb-1.5"
                  style={{ color: s.color }}
                >
                  {s.val}
                </div>
                <div
                  className="text-[10px] sm:text-xs font-semibold opacity-80"
                  style={{ color: s.color }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-bold sn-page-text text-center mb-6 sm:mb-8 tracking-tight">
          <Trans>What we stand for</Trans>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map((v, i) => (
            <div
              key={v.title}
              className="sn-surface border border-brand-mid/20 rounded-2xl px-5 py-6"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `all .5s ease ${(i * 0.1).toFixed(1)}s`,
              }}
            >
              <div className="w-11 h-11 rounded-xl bg-brand-faint flex items-center justify-center mb-3.5">
                <i className={`ti ${v.icon} text-[22px] text-brand`} />
              </div>
              <div className="text-sm font-bold sn-page-text mb-2">
                {v.title}
              </div>
              <div className="text-[13px] sn-muted leading-[1.65]">
                {v.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
