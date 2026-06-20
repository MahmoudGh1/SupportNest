"use client";

import { useInView } from "@/hooks/useInView";
import { Trans, useLingui } from "@lingui/react/macro";
import { useContext } from "react";
import { LocaleContext } from "@/context/local-context";
export default function CustomerStories() {
  const { t } = useLingui();
  const { ref, visible } = useInView();
 const locale = useContext(LocaleContext)?.locale ?? "en";
  const fmt = (val: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(val);
  const STATS = [
  { value: fmt(82), label: t`Tickets resolved automatically`, suffix: "%" },
  { value: fmt(20), label: t`Minutes to set up` },
  { value: fmt(3), label: t`Integrations per day` },
];
  const TESTIMONIALS = [
    {
      quote: t`SupportNest resolved 82% of our tickets automatically in the first week. Our agents now focus on what actually needs a human.`,
      name: "Sara Ahmed",
      role: t`Head of Support, TechFlow`,
      initials: "SA",
      color: "#534AB7",
    },
    {
      quote: t`Setup took 20 minutes. We uploaded our FAQ docs, embedded the widget, and the AI was answering customer questions that same day.`,
      name: "James Carter",
      role: t`Founder, CloudBase`,
      initials: "JC",
      color: "#1D9E75",
    },
    {
      quote: t`The escalation flow is seamless. Agents get the full conversation and context — no more 'can you repeat your issue' moments.`,
      name: "Lena Müller",
      role: t`CX Manager, Nexus AI`,
      initials: "LM",
      color: "#4F46E5",
    },
  ];

  return (
    <section
      id="testimonials"
      className="py-16 md:py-[90px] px-4 sm:px-[5%]"
      style={{ background: "var(--page-bg)" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10 md:mb-13">
          <div className="inline-block bg-brand-faint text-brand text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">
            <Trans>Customer stories</Trans>
          </div>
          <h2
            className="font-extrabold sn-page-text tracking-[-0.025em] m-0"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)" }}
          >
            <Trans>Teams love SupportNest</Trans>
          </h2>
        </div>

       <div className="grid grid-cols-3 gap-4 text-center mb-10">
  {STATS.map((stat) => (
    <div key={stat.label}>
      <div className="text-3xl font-extrabold sn-page-text">
        {stat.value}{stat.suffix}
      </div>
      <div className="text-sm sn-muted mt-1">{stat.label}</div>
    </div>
  ))}
</div>

<div
  ref={ref}
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
>
          {TESTIMONIALS.map((testimonial, i) => (
            <div
              key={testimonial.name}
              className="sn-surface border border-brand-mid/20 rounded-2xl px-5 sm:px-6 py-6 sm:py-7"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(22px)",
                transition: `all .5s ease ${(i * 0.12).toFixed(2)}s`,
              }}
            >
              <div className="flex gap-[3px] mb-4">
                {[...Array(5)].map((_, j) => (
                  <i key={j} className="ti ti-star-filled text-sm text-warning" />
                ))}
              </div>

              <p className="text-sm sn-muted leading-[1.7] mt-0 mb-5 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
                  style={{ background: testimonial.color }}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-[13px] font-bold sn-page-text">
                    {testimonial.name}
                  </div>
                  <div className="text-xs sn-muted">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}