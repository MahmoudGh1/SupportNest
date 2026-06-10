"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes — cancel with one click from your account settings. You keep Pro access until the end of your billing period, then drop to the free plan automatically. No questions asked.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, Amex) and PayPal. All payments are processed securely via Stripe.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Yes! Every new account starts with a 7-day free Pro trial. No credit card required to start — only enter payment details if you decide to keep Pro after the trial.",
  },
  {
    q: "What's the difference between monthly and annual billing?",
    a: "Annual billing saves you 20% — equivalent to getting ~2.5 months free per year. You pay once upfront and the subscription is locked for 12 months.",
  },
  {
    q: "Do you offer team or education discounts?",
    a: "We have a team plan in the works. For education or non-profit pricing, reach out to us at hello@supportnest.ai and we'll sort something out.",
  },
  {
    q: "What counts as a 'download'?",
    a: "A download is saving a screen or flow asset to your device. Browsing, bookmarking, and viewing screens in-app never count against your limit.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/[0.07] last:border-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-black/70 group-hover:text-black text-[15px] font-medium transition-colors">
          {q}
        </span>
        <span
          className={`shrink-0 w-6 h-6 rounded-full border border-black/15 flex items-center justify-center transition-all duration-200 ${
            open ? "rotate-45 bg-black/6" : ""
          }`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1v8M1 5h8"
              stroke="#111"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-60 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-black/40 text-[14px] leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function PricingFAQ() {
  return (
    <div className="max-w-170 mx-auto px-4 pb-32">
      <h2 className="text-[#0d0d0d] text-2xl font-bold text-center mb-10 tracking-tight">
        Frequently asked questions
      </h2>
      <div className="bg-white border border-black/8 rounded-2xl px-7 shadow-sm">
        {FAQS.map((item) => (
          <FAQItem key={item.q} {...item} />
        ))}
      </div>
    </div>
  );
}