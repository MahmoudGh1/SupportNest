"use client";

import Link from "next/link";
import { Trans, useLingui } from "@lingui/react/macro";
import { useContext } from "react";
import { LocaleContext } from "@/context/local-context";

export default function Hero() {
  const { t } = useLingui();
  const locale = useContext(LocaleContext)?.locale ?? "en";
  const fmt = (val: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(val);

  const STATS = [
    { val: `${fmt(80)}%`, label: t`Tickets auto-resolved` },
    { val: `${fmt(70)}%`, label: t`Support cost reduction` },
    { val: `${fmt(1.4)}${locale === "ar" ? "ث" : "s"}`, label: t`Avg AI response time` },
    { val: `${fmt(4.8)}★`, label: t`Average CSAT score` },
  ];

  return (
    <section
      className="relative overflow-hidden text-center pt-24 md:pt-36 pb-16 md:pb-[100px] px-4 sm:px-[5%]"
      style={{ background: "var(--page-bg)" }}
    >
      {/* Radial glow */}
      <div
        className="absolute pointer-events-none rounded-full opacity-60"
        style={{
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 500,
          background:
            "radial-gradient(ellipse, rgba(83,74,183,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 bg-brand-faint border border-brand-mid/25 rounded-full px-3.5 py-1.5 mb-6 md:mb-7">
        <div className="w-[7px] h-[7px] rounded-full bg-success shadow-[0_0_0_3px_var(--color-success-bg)]" />
        <span className="text-brand text-[12px] sm:text-[13px] font-semibold">
          <Trans>AI-Powered Customer Support Platform</Trans>
        </span>
      </div>

      {/* Heading */}
      <h1
        className="font-extrabold leading-[1.1] tracking-[-0.03em] max-w-[780px] mx-auto mb-4 md:mb-5 mt-0"
        style={{
          fontSize: "clamp(2rem, 5.5vw, 4rem)",
          color: "var(--page-text)",
        }}
      >
        {t`Resolve`}{" "}
        <span className="text-brand">
          {fmt(80)}% {t`of tickets`}
        </span>{" "}
        {t`instantly with AI agents`}
      </h1>

      {/* Subheading */}
      <p
        className="sn-muted leading-[1.75] max-w-[560px] mx-auto mb-8 md:mb-11 mt-0"
        style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)" }}
      >
        <Trans>
          SupportNest deploys a hierarchy of specialized AI agents that handle
          customer inquiries, automate workflows, and escalate complex issues —
          24/7, with full context.
        </Trans>
      </p>

      {/* CTA buttons */}
      <div className="flex gap-3 justify-center flex-wrap mb-12 md:mb-16">
        <Link
          href="/pricing"
          className="bg-brand hover:bg-brand-light text-white text-sm sm:text-[15px] font-semibold no-underline px-6 sm:px-[30px] py-3 sm:py-[13px] rounded-[10px] inline-flex items-center gap-2 transition-colors"
        >
          {t`Start Free Trial`} <i className="ti ti-arrow-right text-base" />
        </Link>
        <a
          href="#pipeline"
          className="sn-surface text-sm sm:text-[15px] font-semibold no-underline px-5 sm:px-7 py-3 sm:py-[13px] rounded-[10px] border inline-flex items-center gap-2 transition-colors hover:border-brand"
          style={{ color: "var(--page-text)" }}
        >
          <i className="ti ti-player-play-filled text-[15px]" /> {t`See How It Works`}
        </a>
      </div>

      {/* Stats strip */}
<div className="grid grid-cols-2 md:grid-cols-4">        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`px-5 sm:px-10 py-4 sm:py-5 text-center ${
              i < 3 ? "sm:border-r" : ""
            } ${i < 2 ? "border-b sm:border-b-0" : ""} ${
              i % 2 === 0 ? "border-r sm:border-r-0" : ""
            }`}
            style={{ borderColor: "var(--card-border)" }}
          >
            <div
              className="font-extrabold tracking-[-0.03em]"
              style={{
                fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                color: "var(--page-text)",
              }}
            >
              {s.val}
            </div>
            <div className="text-[12px] sm:text-[13px] sn-muted mt-1 font-medium">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}