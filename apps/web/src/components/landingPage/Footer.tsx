"use client"

import { Trans, useLingui } from "@lingui/react/macro";

export default function Footer() {
  const { t } = useLingui();

  const SOCIAL_ICONS = ["ti-brand-twitter", "ti-brand-linkedin", "ti-brand-github"];

  const ANCHOR_MAP_TRANSLATED: Record<string, string> = {
    [t`Features`]: "#features",
    [t`How It Works`]: "#pipeline",
    [t`Pricing`]: "#pricing",
    [t`Customer Stories`]: "#testimonials",
    [t`About`]: "#about",
    [t`Contact`]: "#contact",
  };

  const LINKS: Record<string, string[]> = {
    [t`Product`]: [t`Features`, t`How It Works`, t`Pricing`, t`Changelog`],
    [t`Company`]: [t`Customer Stories`, t`About`, t`Careers`, t`Contact`],
    [t`Legal`]: [t`Privacy Policy`, t`Terms of Service`, t`Security`, t`Status`],
  };

  return (
    <footer className="bg-[#1a1830] py-[60px] px-[5%] pb-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid gap-10 mb-12" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>

          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#534AB7] rounded-lg flex items-center justify-center">
                <i className="ti ti-shield-check text-white text-base" />
              </div>
              <span className="text-white text-base font-bold">SupportNest</span>
            </div>
            <p className="text-sm text-white/45 leading-[1.7] max-w-[260px] mt-0 mb-5">
              <Trans>AI-powered customer support that resolves 80% of tickets instantly, 24/7.</Trans>
            </p>
            <div className="flex gap-2.5">
              {SOCIAL_ICONS.map(icon => (
                <div
                  key={icon}
                  className="w-[34px] h-[34px] rounded-lg bg-white/[0.07] hover:bg-white/[0.15] flex items-center justify-center cursor-pointer transition-colors duration-150"
                >
                  <i className={`ti ${icon} text-base text-white/50`} />
                </div>
              ))}
            </div>
          </div>

          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <div className="text-xs font-bold text-white/35 tracking-[.08em] uppercase mb-4">
                {group}
              </div>
              <div className="flex flex-col gap-2.5">
                {items.map(item => (
                  <a
                    key={item}
                    href={ANCHOR_MAP_TRANSLATED[item] || "#"}
                    className="text-sm text-white/50 hover:text-white no-underline transition-colors duration-150"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.08] pt-7 flex justify-between items-center flex-wrap gap-3">
          <span className="text-[13px] text-white/30">
            <Trans>© 2025 SupportNest. All rights reserved.</Trans>
          </span>
          <span className="text-[13px] text-white/30">
            <Trans>Built with ❤️ for support teams worldwide</Trans>
          </span>
        </div>
      </div>
    </footer>
  );
}