"use client";

import { Dispatch, SetStateAction } from "react";

interface Props {
  annual: boolean;
  setAnnual: Dispatch<SetStateAction<boolean>>;
}

export default function PricingHero({ annual, setAnnual }: Props) {
  return (
    <div className="text-center pt-36 pb-14 px-4">
      <p className="text-[13px] font-semibold tracking-[0.12em] uppercase text-black/30 mb-4">
        Pricing
      </p>
      <h1 className="text-4xl sm:text-5xl font-bold text-[#0d0d0d] tracking-tight leading-[1.1] mb-4">
        Simple, honest pricing.
      </h1>
      <p className="text-black/40 text-[17px] max-w-100 mx-auto mb-10 leading-relaxed">
        Start for free. Upgrade when you need more.
      </p>

      {/* Billing toggle */}
      <div className="inline-flex items-center gap-3 bg-black/4 border border-black/8 rounded-full px-2 py-1.5">
        <button
          onClick={() => setAnnual(false)}
          className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-all duration-200 ${
            !annual
              ? "bg-[#111] text-white shadow-sm"
              : "text-black/40 hover:text-black/70"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-all duration-200 flex items-center gap-2 ${
            annual
              ? "bg-[#111] text-white shadow-sm"
              : "text-black/40 hover:text-black/70"
          }`}
        >
          Annual
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-all ${
              annual
                ? "bg-emerald-500 text-white"
                : "bg-black/6 text-black/30"
            }`}
          >
            –20%
          </span>
        </button>
      </div>
    </div>
  );
}
