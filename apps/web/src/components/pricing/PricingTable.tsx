"use client";

/* ── icons ── */
const Tick = ({ variant }: { variant: "light" | "dark" | "black" }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle
      cx="9"
      cy="9"
      r="9"
      fill={variant === "black" ? "white" : "#111"}
      fillOpacity={variant === "black" ? 0.15 : 0.07}
    />
    <path
      d="M5.5 9l2.5 2.5 4.5-4.5"
      stroke={variant === "black" ? "white" : "#111"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Cross = ({ dark }: { dark?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M5 5l6 6M11 5l-6 6"
      stroke={dark ? "#111" : "#111"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.18"
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
      className={`text-[13px] font-medium ${
        variant === "black" ? "text-white/75" : "text-black/55"
      }`}
    >
      {val}
    </span>
  );
}

export default function PricingTable() {
  return (
    <div className="max-w-260 mx-auto px-4 mt-20 mb-24">
      <h2 className="text-[#534AB7] text-2xl font-bold text-center mb-10 tracking-tight">
        Compare plans
      </h2>

      <div className="rounded-2xl overflow-hidden border border-black/8 shadow-sm">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_160px_160px_160px]">
          <div className="px-6 py-5 bg-white border-b border-black/[0.07]" />

          {/* Starter */}
          <div className="px-4 py-5 text-center bg-white border-b border-l border-black/[0.07]">
            <p className="text-black/35 text-[11px] font-bold uppercase tracking-[0.13em]">
              Starter
            </p>
            <p className="text-[#0d0d0d] text-[22px] font-bold tracking-tight mt-1">
              $29
            </p>
            <p className="text-black/30 text-[11px] mt-0.5">/ mo</p>
          </div>

          {/* Pro — black */}
          <div className="px-4 py-5 text-center bg-[#111] border-b border-l border-black/[0.07]">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-[0.13em]">
                Pro
              </p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10 uppercase tracking-wide">
                Popular
              </span>
            </div>
            <p className="text-white text-[22px] font-bold tracking-tight">
              $79
            </p>
            <p className="text-white/30 text-[11px] mt-0.5">/ mo</p>
          </div>

          {/* Enterprise */}
          <div className="px-4 py-5 text-center bg-white border-b border-l border-black/[0.07]">
            <p className="text-black/35 text-[11px] font-bold uppercase tracking-[0.13em]">
              Enterprise
            </p>
            <p className="text-[#0d0d0d] text-[22px] font-bold tracking-tight mt-1">
              Custom
            </p>
            <p className="text-black/30 text-[11px] mt-0.5">&nbsp;</p>
          </div>
        </div>

        {GROUPS.map((group, gi) => (
          <div key={group.title}>
            {/* Group header */}
            <div className="grid grid-cols-[1fr_160px_160px_160px] border-b border-black/[0.07]">
              <div className="px-6 py-3 bg-black/2">
                <p className="text-black/35 text-[11px] font-bold uppercase tracking-[0.12em]">
                  {group.title}
                </p>
              </div>
              <div className="bg-black/2 border-l border-black/[0.07]" />
              <div className="bg-[#111]/95 border-l border-white/6" />
              <div className="bg-black/2 border-l border-black/[0.07]" />
            </div>

            {/* Rows */}
            {group.rows.map((row, ri) => {
              const isLast =
                gi === GROUPS.length - 1 && ri === group.rows.length - 1;
              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1fr_160px_160px_160px] ${!isLast ? "border-b border-black/6" : ""} hover:bg-black/1.5 transition-colors group`}
                >
                  <div className="px-6 py-4 bg-white group-hover:bg-black/1.5">
                    <p className="text-black/65 text-[13.5px]">{row.label}</p>
                    {row.note && (
                      <p className="text-black/25 text-[11px] mt-0.5">
                        {row.note}
                      </p>
                    )}
                  </div>

                  {/* Starter */}
                  <div className="px-4 py-4 flex items-center justify-center bg-white border-l border-black/6 group-hover:bg-black/1.5">
                    <CellValue val={row.starter} variant="light" />
                  </div>

                  {/* Pro */}
                  <div className="px-4 py-4 flex items-center justify-center bg-[#111] border-l border-white/6">
                    <CellValue val={row.pro} variant="black" />
                  </div>

                  {/* Enterprise */}
                  <div className="px-4 py-4 flex items-center justify-center bg-white border-l border-black/6 group-hover:bg-black/1.5">
                    <CellValue val={row.enterprise} variant="light" />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Footer CTA row */}
        <div className="grid grid-cols-[1fr_160px_160px_160px] border-t border-black/8">
          <div className="px-6 py-5 bg-white" />
          <div className="px-4 py-5 bg-white border-l border-black/[0.07] flex items-center justify-center">
            <a
              href="/register?plan=starter"
              className="text-[12px] font-semibold text-white bg-[#111] hover:bg-black px-4 py-2 rounded-full no-underline transition-colors"
            >
              Get started
            </a>
          </div>
          <div className="px-4 py-5 bg-[#111] border-l border-white/6 flex items-center justify-center">
            <a
              href="/register?plan=pro"
              className="text-[12px] font-semibold text-[#111] bg-white hover:bg-white/90 px-4 py-2 rounded-full no-underline transition-colors"
            >
              Start free trial
            </a>
          </div>
          <div className="px-4 py-5 bg-white border-l border-black/[0.07] flex items-center justify-center">
            <a
              href="/contact"
              className="text-[12px] font-semibold text-white bg-[#111] hover:bg-black px-4 py-2 rounded-full no-underline transition-colors"
            >
              Contact sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
