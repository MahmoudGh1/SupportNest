"use client";

import Link from "next/link";

/* ── icons ── */
const Tick = ({ variant }: { variant: "light" | "dark" | "black" }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    className="flex-shrink-0"
  >
    <circle
      cx="9"
      cy="9"
      r="9"
      fill={variant === "black" ? "white" : "currentColor"}
      fillOpacity={variant === "black" ? 0.15 : 0.08}
    />
    <path
      d="M5.5 9l2.5 2.5 4.5-4.5"
      stroke={variant === "black" ? "white" : "currentColor"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Cross = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className="flex-shrink-0 opacity-25"
  >
    <path
      d="M5 5l6 6M11 5l-6 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── types ── */
type Cell = true | false | string;
interface Row {
  label: string;
  starter: Cell;
  pro: Cell;
  enterprise: Cell;
  note?: string;
}
interface Group {
  title: string;
  rows: Row[];
}

/* ── data ── */
const GROUPS: Group[] = [
  {
    title: "Team & access",
    rows: [
      {
        label: "Team members",
        starter: "Up to 3",
        pro: "Up to 15",
        enterprise: "Unlimited",
      },
      {
        label: "Knowledge base docs",
        starter: "10 docs",
        pro: "50 docs",
        enterprise: "Unlimited",
      },
      {
        label: "SSO / SAML login",
        starter: false,
        pro: false,
        enterprise: true,
      },
      {
        label: "Custom integrations",
        starter: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
  {
    title: "AI conversations",
    rows: [
      {
        label: "Monthly conversations",
        starter: "5,000 / mo",
        pro: "Unlimited",
        enterprise: "Unlimited",
      },
      {
        label: "AI agent tiers",
        starter: "Tier 1",
        pro: "Tier 1 + 2",
        enterprise: "Full pipeline",
      },
      {
        label: "Human agent inbox",
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        label: "Embeddable chat widget",
        starter: true,
        pro: true,
        enterprise: true,
      },
    ],
  },
  {
    title: "Branding & customisation",
    rows: [
      {
        label: "Custom widget branding",
        starter: false,
        pro: true,
        enterprise: true,
      },
      { label: "Custom themes", starter: false, pro: false, enterprise: true },
      {
        label: "Dedicated infrastructure",
        starter: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
  {
    title: "Analytics & reporting",
    rows: [
      {
        label: "Analytics dashboard",
        starter: "Basic",
        pro: "Advanced",
        enterprise: "Advanced",
      },
      { label: "CSAT scores", starter: false, pro: true, enterprise: true },
      { label: "API access", starter: false, pro: true, enterprise: true },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Email support", starter: true, pro: true, enterprise: true },
      {
        label: "Priority support",
        starter: false,
        pro: true,
        enterprise: true,
      },
      {
        label: "SLA & uptime guarantee",
        starter: false,
        pro: false,
        enterprise: true,
      },
      {
        label: "Dedicated account manager",
        starter: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
];

type ColVariant = "light" | "dark" | "black";

function CellValue({ val, variant }: { val: Cell; variant: ColVariant }) {
  if (val === true) return <Tick variant={variant} />;
  if (val === false) return <Cross />;
  return (
    <span
      className={`text-[13px] font-semibold ${
        variant === "black" ? "text-white/80" : "text-var-text-body"
      }`}
    >
      {val}
    </span>
  );
}

export default function PricingTable() {
  return (
    <div className="max-w-5xl mx-auto px-4 mt-16 mb-24 font-sans text-var-text-main">
      <style>{`
        :root {
          --bg-table-card: #ffffff;
          --bg-table-strip: #fafafa;
          --bg-table-group: #f6f5fc;
          --border-table: rgba(0,0,0,0.08);
          --border-table-light: rgba(0,0,0,0.05);
          --text-table-main: #1a1830;
          --text-table-body: #53506b;
          --text-table-muted: #9e9aad;
          --bg-btn-primary: #534ab7;
          --text-btn-primary: #ffffff;
        }

        html.dark {
          --bg-table-card: #0d0d1e;
          --bg-table-strip: #121226;
          --bg-table-group: #161530;
          --border-table: rgba(255,255,255,0.08);
          --border-table-light: rgba(255,255,255,0.04);
          --text-table-main: #ffffff;
          --text-table-body: #aaa7c2;
          --text-table-muted: #6b678a;
          --bg-btn-primary: #ffffff;
          --text-btn-primary:#534ab7;
        }

        .text-var-text-main { color: var(--text-table-main); }
        .text-var-text-body { color: var(--text-table-body); }
        .text-var-text-muted { color: var(--text-table-muted); }
        .bg-var-card { background-color: var(--bg-table-card); }
        .bg-var-strip { background-color: var(--bg-table-strip); }
        .bg-var-group { background-color: var(--bg-table-group); }
        .border-var { border-color: var(--border-table); }
        .border-var-light { border-color: var(--border-table-light); }
      `}</style>

      <h2 className="text-[#534AB7] dark:text-[#7F77DD] text-2xl md:text-3xl font-extrabold text-center mb-10 tracking-tight animate-[fadeIn_0.5s_ease_both]">
        Compare plans
      </h2>

      {/* ── DESKTOP GRID LAYOUT ────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-2xl overflow-hidden border border-var shadow-sm bg-var-card">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_160px_160px_160px]">
          <div className="px-6 py-5 bg-var-card border-b border-var-light" />

          {/* Starter */}
          <div className="px-4 py-5 text-center bg-var-card border-b border-l border-var-light">
            <p className="text-var-text-muted text-[11px] font-bold uppercase tracking-[0.13em]">
              Starter
            </p>
            <p className="text-var-text-main text-[22px] font-extrabold tracking-tight mt-1">
              $29
            </p>
            <p className="text-var-text-muted text-[11px] mt-0.5">/ mo</p>
          </div>

          {/* Pro — Permanent Midnight Slate Highlight Column */}
          <div className="px-4 py-5 text-center bg-[#534ab7] border-b border-l border-black/20 dark:border-white/10 shadow-lg relative z-10">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-[0.13em]">
                Pro
              </p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10 uppercase tracking-wide">
                Popular
              </span>
            </div>
            <p className="text-white text-[22px] font-extrabold tracking-tight">
              $79
            </p>
            <p className="text-white/30 text-[11px] mt-0.5">/ mo</p>
          </div>

          {/* Enterprise */}
          <div className="px-4 py-5 text-center bg-var-card border-b border-l border-var-light">
            <p className="text-var-text-muted text-[11px] font-bold uppercase tracking-[0.13em]">
              Enterprise
            </p>
            <p className="text-var-text-main text-[22px] font-extrabold tracking-tight mt-1">
              Custom
            </p>
            <p className="text-var-text-muted text-[11px] mt-0.5">&nbsp;</p>
          </div>
        </div>

        {GROUPS.map((group, gi) => (
          <div key={group.title}>
            {/* Group header */}
            <div className="grid grid-cols-[1fr_160px_160px_160px] border-b border-var-light">
              <div className="px-6 py-3 bg-var-group">
                <p className="text-var-text-muted text-[11px] font-bold uppercase tracking-[0.12em]">
                  {group.title}
                </p>
              </div>
              <div className="bg-var-group border-l border-var-light" />
              <div className="bg-[#534ab7] border-l border-black/20 dark:border-white/5" />
              <div className="bg-var-group border-l border-var-light" />
            </div>

            {/* Rows */}
            {group.rows.map((row, ri) => {
              const isLast = gi === GROUPS.length - 1 && ri === group.rows.length - 1;
              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1fr_160px_160px_160px] ${!isLast ? "border-b border-var-light" : ""} hover:bg-var-strip transition-colors group`}
                >
                  <div className="px-6 py-4 bg-var-card group-hover:bg-var-strip flex flex-col justify-center">
                    <p className="text-var-text-main font-medium text-[13.5px]">
                      {row.label}
                    </p>
                    {row.note && (
                      <p className="text-var-text-muted text-[11px] mt-0.5">
                        {row.note}
                      </p>
                    )}
                  </div>

                  {/* Starter */}
                  <div className="px-4 py-4 flex items-center justify-center bg-var-card border-l border-var-light group-hover:bg-var-strip text-var-text-main">
                    <CellValue val={row.starter} variant="light" />
                  </div>

                  {/* Pro */}
                  <div className="px-4 py-4 flex items-center justify-center bg-[#534ab7] border-l border-black/20 dark:border-white/5 text-white">
                    <CellValue val={row.pro} variant="black" />
                  </div>

                  {/* Enterprise */}
                  <div className="px-4 py-4 flex items-center justify-center bg-var-card border-l border-var-light group-hover:bg-var-strip text-var-text-main">
                    <CellValue val={row.enterprise} variant="light" />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Footer CTA row */}
        <div className="grid grid-cols-[1fr_160px_160px_160px] border-t border-var">
          <div className="px-6 py-5 bg-var-card" />
          <div className="px-4 py-5 bg-var-card border-l border-var-light flex items-center justify-center">
            <Link
              href="/register?plan=starter"
              className="text-[12px] font-bold bg-var-text-main text-var-card hover:opacity-90 px-4 py-2.5 rounded-full text-center w-full no-underline transition-opacity shadow-sm"
            >
              Get started
            </Link>
          </div>
          <div className="px-4 py-5 bg-[#534ab7] border-l border-black/20 dark:border-white/5 flex items-center justify-center">
            <Link
              href="/register?plan=pro"
              className="text-[12px] font-bold text-[#111] bg-white hover:bg-white/90 px-4 py-2.5 rounded-full text-center w-full no-underline transition-colors shadow-sm"
            >
              Start free trial
            </Link>
          </div>
          <div className="px-4 py-5 bg-var-card border-l border-var-light flex items-center justify-center">
            <Link
              href="/contact"
              className="text-[12px] font-bold bg-var-text-main text-var-card hover:opacity-90 px-4 py-2.5 rounded-full text-center w-full no-underline transition-opacity shadow-sm"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </div>

      {/* ── MOBILE ACCORDION CARD LIST ─────────────────────────────────────── */}
      <div className="block md:hidden space-y-12">
        {[
          {
            name: "Starter",
            price: "$29",
            period: "/ mo",
            tag: null,
            key: "starter" as const,
            bg: "bg-var-card",
            textTheme: "text-var-text-main",
          },
          {
            name: "Pro",
            price: "$79",
            period: "/ mo",
            tag: "Popular",
            key: "pro" as const,
            bg: "bg-[#534ab7]",
            textTheme: "text-white",
          },
          {
            name: "Enterprise",
            price: "Custom",
            period: "",
            tag: null,
            key: "enterprise" as const,
            bg: "bg-var-card",
            textTheme: "text-var-text-main",
          },
        ].map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border ${tier.key === "pro" ? "border-[#534AB7] ring-4 ring-[#534AB7]/10" : "border-var"} ${tier.bg} overflow-hidden shadow-md`}
          >
            {/* Header block */}
            <div className="p-5 text-center border-b border-var-light relative">
              {tier.tag && (
                <span className="absolute top-3 right-4 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10 uppercase tracking-wide">
                  {tier.tag}
                </span>
              )}
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.13em] opacity-50 ${tier.textTheme}`}
              >
                {tier.name}
              </p>
              <p
                className={`text-3xl font-extrabold tracking-tight mt-1.5 ${tier.textTheme}`}
              >
                {tier.price}
              </p>
              {tier.period && (
                <p className={`text-xs opacity-40 mt-0.5 ${tier.textTheme}`}>
                  {tier.period}
                </p>
              )}
            </div>

            {/* List Metrics content inside sections */}
            <div className="divide-y divide-var-light">
              {GROUPS.map((group) => (
                <div key={group.title} className="p-1">
                  <div className="px-4 py-2 bg-var-group rounded-lg my-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-var-text-muted">
                      {group.title}
                    </p>
                  </div>
                  <div className="divide-y divide-var-light/50">
                    {group.rows.map((row) => (
                      <div
                        key={row.label}
                        className="px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <div>
                          <p
                            className={`text-xs font-medium ${tier.key === "pro" ? "text-white/90" : "text-var-text-main"}`}
                          >
                            {row.label}
                          </p>
                          {row.note && (
                            <p className="text-[10px] text-var-text-muted mt-0.5">
                              {row.note}
                            </p>
                          )}
                        </div>
                        <div
                          className={
                            tier.key === "pro"
                              ? "text-white"
                              : "text-var-text-main"
                          }
                        >
                          <CellValue
                            val={row[tier.key]}
                            variant={tier.key === "pro" ? "black" : "light"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Execution footer tier context */}
            <div className="p-4 border-t border-var-light bg-black/5 dark:bg-white/5">
              <a
                href={
                  tier.key === "enterprise"
                    ? "/contact"
                    : `/register?plan=${tier.key}`
                }
                className={`block text-center py-3 px-4 rounded-xl font-bold text-xs shadow-sm transition-opacity no-underline hover:opacity-95 ${
                  tier.key === "pro"
                    ? "bg-white text-[#111]"
                    : "bg-var-text-main text-var-card"
                }`}
              >
                {tier.key === "starter" && "Get started"}
                {tier.key === "pro" && "Start free trial"}
                {tier.key === "enterprise" && "Contact sales"}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}