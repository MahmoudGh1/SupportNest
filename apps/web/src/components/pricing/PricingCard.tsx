"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Props {
  annual: boolean;
}

const CheckLight = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    className="shrink-0 mt-0.5"
  >
    <circle cx="7.5" cy="7.5" r="7.5" fill="#111" fillOpacity="0.08" />
    <path
      d="M4.5 7.5l2 2 4-4"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckDark = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    className="shrink-0 mt-0.5"
  >
    <circle cx="7.5" cy="7.5" r="7.5" fill="#111" fillOpacity="0.08" />
    <path
      d="M4.5 7.5l2 2 4-4"
      stroke="#111"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface Plan {
  id: string;
  name: string;
  badge?: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  subline: (annual: boolean) => string;
  cta: string;
  features: string[];
  variant: "glass" | "white" | "dark-glass";
}

function parseFeatures(features: string): string[] {
  try {
    const parsed = JSON.parse(features) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String);
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed as Record<string, unknown>).map(String);
    }
  } catch {
    // fall through
  }
  return features ? [features] : [];
}

function mapDbPlanToCard(plan: {
  id: string;
  name: string;
  priceMonthly: number;
  maxConversations: number;
  maxAgents: number;
  maxKnowledgeDocuments: number;
  features: string;
}, index: number, total: number): Plan {
  const isEnterprise =
    plan.name.toLowerCase() === "enterprise" || plan.priceMonthly <= 0;
  const annualPrice = isEnterprise
    ? null
    : Math.round(plan.priceMonthly * 0.8);
  const featured = index === Math.min(1, total - 1);

  const defaultFeatures = [
    `${plan.maxAgents || "Unlimited"} team members`,
    `${plan.maxConversations || "Unlimited"} AI conversations / mo`,
    `${plan.maxKnowledgeDocuments || "Unlimited"} knowledge base docs`,
  ];
  const parsedFeatures = parseFeatures(plan.features);
  const features =
    parsedFeatures.length > 0 ? parsedFeatures : defaultFeatures;

  return {
    id: plan.id,
    name: plan.name,
    badge: featured ? "MOST POPULAR" : undefined,
    monthlyPrice: isEnterprise ? null : plan.priceMonthly,
    annualPrice,
    subline: (annual) => {
      if (isEnterprise) return "Custom contract & invoicing";
      const price = annual ? annualPrice! : plan.priceMonthly;
      return annual ? `Billed EGP${price * 12}/yr` : "Billed monthly";
    },
    cta: isEnterprise ? "Contact sales" : "Get started →",
    variant: featured ? "white" : isEnterprise ? "dark-glass" : "glass",
    features,
  };
}

function PlanCard({
  plan,
  annual,
  featured,
}: {
  plan: Plan;
  annual: boolean;
  featured: boolean;
}) {
  const router = useRouter();
  const price = annual ? plan.annualPrice : plan.monthlyPrice;

  const isWhite = plan.variant === "white";

  const labelColor = isWhite ? "text-white/50" : "text-black/40";
  const priceColor = isWhite ? "text-white" : "text-[#0d0d0d]";
  const unitColor = isWhite ? "text-white/40" : "text-black/30";
  const sublineColor = isWhite ? "text-white/40" : "text-black/30";
  const featureColor = isWhite ? "text-white/70" : "text-black/55";

  const ctaCls = isWhite
    ? "bg-white text-[#111] hover:bg-white/90"
    : "bg-[#111] text-white hover:bg-black";

  const wrapperCls = featured
    ? "rounded-[22px] shadow-[0_4px_32px_rgba(0,0,0,0.13)] ring-1 ring-black/10"
    : "rounded-2xl shadow-sm";

  const cardBg = isWhite ? "bg-[#111]" : "bg-white border border-black/[0.08]";

  // ── Handle CTA click ───────────────────────────────────────────────────────
  function handleClick() {
    if (plan.name === "Enterprise") {
      router.push("/contact");
      return;
    }

    // Store selected plan in sessionStorage
    sessionStorage.setItem(
      "selectedPlan",
      JSON.stringify({
        id: plan.id,
        name: plan.name,
        price: price,
        annual: annual,
        amountCents: (price as number) * 100,
      }),
    );

    // Navigate to register
    router.push("/register");
  }

  return (
    <div
      className={`relative overflow-hidden flex flex-col ${cardBg} ${wrapperCls} p-7 min-h-150`}
    >
      <div className="relative z-10 flex flex-col h-full">
        {/* Name + badge */}
        <div className="flex items-center justify-between mb-4">
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.14em] ${labelColor}`}
          >
            {plan.name}
          </p>
          {plan.badge && (
            <span
              className={`text-[10px] font-bold px-2.5 py-0.75 rounded-full tracking-wider ${
                isWhite
                  ? "bg-white/10 text-white/60 border border-white/15"
                  : "bg-black/6 text-black/40"
              }`}
            >
              {plan.badge}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-1">
          {price !== null ? (
            <div className="flex items-end gap-1.5">
              <span
                className={`font-bold leading-none tracking-[-0.04em] ${priceColor} ${featured ? "text-[56px]" : "text-[42px]"}`}
              >
                EGP{price}
              </span>
              <span className={`text-sm mb-2 ${unitColor}`}>/ mo</span>
            </div>
          ) : (
            <span
              className={`font-bold leading-none tracking-[-0.03em] ${priceColor} ${featured ? "text-[46px]" : "text-[36px]"}`}
            >
              Custom
            </span>
          )}
        </div>

        {/* Annual saving */}
        {annual && plan.annualPrice !== null && plan.monthlyPrice !== null && (
          <p className="text-[11px] text-emerald-500/80 font-medium mb-1">
            Save EGP{(plan.monthlyPrice - plan.annualPrice) * 12}/yr
          </p>
        )}

        <p className={`text-[12px] mb-7 ${sublineColor}`}>
          {plan.subline(annual)}
        </p>

        {/* CTA button — replaced Link with button */}
        <button
          onClick={handleClick}
          className={`w-full text-center rounded-full font-semibold border-none cursor-pointer transition-all duration-150 mb-8 ${
            featured ? "py-3 text-[14px]" : "py-2.5 text-[13px]"
          } ${ctaCls}`}
        >
          {plan.cta}
        </button>

        {/* Divider */}
        <div
          className={`w-full h-px mb-6 ${isWhite ? "bg-white/10" : "bg-black/[0.07]"}`}
        />

        {/* Features */}
        <div className="flex flex-col gap-3 mt-2">
          {plan.features.map((f) => (
            <div
              key={f}
              className={`flex items-start gap-2.5 ${featured ? "text-[13.5px]" : "text-[13px]"} ${featureColor}`}
            >
              {isWhite ? <CheckLight /> : <CheckDark />}
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingCards({ annual }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getPlans()
      .then((dbPlans) => {
        setPlans(
          dbPlans.map((plan, index) =>
            mapDbPlanToCard(plan, index, dbPlans.length),
          ),
        );
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load pricing plans",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-260 mx-auto px-4 py-16 text-center text-black/40 text-sm">
        Loading plans…
      </div>
    );
  }

  if (error || plans.length === 0) {
    return (
      <div className="max-w-260 mx-auto px-4 py-16 text-center text-black/40 text-sm">
        {error || "No plans available right now."}
      </div>
    );
  }

  return (
    <div className="max-w-260 mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            annual={annual}
            featured={index === Math.min(1, plans.length - 1)}
          />
        ))}
      </div>

      {annual && (
        <p className="text-center text-black/25 text-[12px] mt-6">
          Annual billing saves up to{" "}
          <span className="text-emerald-500/70 font-semibold">20%</span>{" "}
          compared to monthly.
        </p>
      )}
    </div>
  );
}
