"use client";

import { useState } from "react";
import { useInView } from "@/hooks/useInView";
import { Trans, useLingui } from "@lingui/react/macro";
import { useContext } from "react";
import { LocaleContext } from "@/context/local-context";

export default function Contact() {
  const { t } = useLingui();
  const { ref, visible } = useInView();
  const locale = useContext(LocaleContext)?.locale ?? "en";
  const fmt = (val: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(val);

  const CHANNELS = [
    {
      icon: "ti-mail",
      label: t`Email us`,
      val: "hello@supportnest.ai",
      color: "#534AB7",
    },
    {
      icon: "ti-brand-twitter",
      label: t`Twitter`,
      val: "@supportnest",
      color: "#1DA1F2",
    },
    {
      icon: "ti-brand-linkedin",
      label: t`LinkedIn`,
      val: "SupportNest",
      color: "#0A66C2",
    },
  ];

  type FormState = {
    name: string;
    email: string;
    company: string;
    message: string;
  };

  const INITIAL_FORM: FormState = {
    name: "",
    email: "",
    company: "",
    message: "",
  };

  const INPUT_CLS =
    "w-full box-border px-3.5 py-2.5 text-sm border-[1.5px] border-border rounded-lg outline-none font-[inherit] sn-page-text bg-surface transition-colors duration-150 focus:border-brand";

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("https://api-production-e60c.up.railway.app/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        company: form.company,
        message: form.message,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setSent(true);
      setForm(INITIAL_FORM);
    }
  }

  return (
    <section
      id="contact"
      className="py-16 md:py-[90px] px-4 sm:px-[5%]"
      style={{ background: "var(--surface-elevated)" }}
    >
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-10 md:mb-13">
          <div className="inline-block bg-brand-faint text-brand text-xs font-bold px-3.5 py-1 rounded-full tracking-[.08em] uppercase mb-4">
            <Trans>Get in touch</Trans>
          </div>
          <h2
            className="font-extrabold sn-page-text tracking-[-0.025em] mb-3 mt-0"
            style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)" }}
          >
            <Trans>We&apos;d love to hear from you</Trans>
          </h2>
          <p className="text-sm sm:text-base sn-muted">
            <Trans>
              Questions, demos, or custom enterprise plans — we reply within{" "}
              {fmt(24)} hours.
            </Trans>
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6 sm:gap-8"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "all .6s ease",
          }}
        >
          {/* Left: info panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-white dark:bg-surface border-[1.5px] border-[#e8e6f0] dark:border-border rounded-2xl p-5 sm:p-7">
              <h3 className="text-base font-bold text-[#1a1830] dark:text-page-text mt-0 mb-1.5">
                <Trans>Talk to sales</Trans>
              </h3>
              <p className="text-[13px] text-[#64607a] dark:text-muted leading-[1.7] mt-0 mb-5">
                <Trans>
                  Interested in SupportNest for your team? We&apos;ll walk you
                  through a live demo and tailor a plan for your use case.
                </Trans>
              </p>
              <div className="flex flex-col gap-3.5">
                {CHANNELS.map((ch) => (
                  <div key={ch.label} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                      style={{ background: `${ch.color}12` }}
                    >
                      <i
                        className={`ti ${ch.icon} text-[18px]`}
                        style={{ color: ch.color }}
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-[#64607a] dark:text-muted font-medium">
                        {ch.label}
                      </div>
                      <div className="text-[13px] font-semibold text-[#1a1830] dark:text-page-text">
                        {ch.val}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#E1F5EE] border-[1.5px] border-[#1D9E75]/20 rounded-xl px-[18px] py-3.5 flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#1D9E75] shrink-0" />
              <span className="text-[13px] text-[#0F6E56] font-semibold">
                <Trans>Average reply time: under {fmt(4)} hours</Trans>
              </span>
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white dark:bg-surface border-[1.5px] border-[#e8e6f0] dark:border-border rounded-2xl px-5 sm:px-7 py-6 sm:py-8">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
                  <i className="ti ti-check text-[26px] text-[#1D9E75]" />
                </div>
                <h3 className="text-lg font-bold text-[#1a1830] dark:text-page-text mb-2">
                  <Trans>Message sent!</Trans>
                </h3>
                <p className="text-sm text-[#64607a] dark:text-muted">
                  <Trans>We&apos;ll get back to you within {fmt(24)} hours.</Trans>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#1a1830] dark:text-page-text mb-1.5">
                      <Trans>Your name *</Trans>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => set("name")(e.target.value)}
                      placeholder={t`Mohamed Rashad`}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#1a1830] dark:text-page-text mb-1.5">
                      <Trans>Work email *</Trans>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email")(e.target.value)}
                      placeholder={t`you@company.com`}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1a1830] dark:text-page-text mb-1.5">
                    <Trans>Company</Trans>
                  </label>
                  <input
                    value={form.company}
                    onChange={(e) => set("company")(e.target.value)}
                    placeholder={t`Acme Corp`}
                    className={INPUT_CLS}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#1a1830] dark:text-page-text mb-1.5">
                    <Trans>Message *</Trans>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => set("message")(e.target.value)}
                    placeholder={t`Tell us about your team size, current support setup, and what you're hoping to solve...`}
                    rows={4}
                    className={`${INPUT_CLS} resize-y min-h-[100px]`}
                  />
                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#534AB7] hover:bg-[#7F77DD] disabled:opacity-70 text-white text-sm font-semibold py-3 px-5 rounded-[10px] border-none cursor-pointer font-[inherit] transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Trans>Sending…</Trans>
                  ) : (
                    <>
                      <i className="ti ti-send text-base" />{" "}
                      <Trans>Send message</Trans>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
