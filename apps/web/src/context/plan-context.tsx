"use client";

import { createContext, useContext, useState } from "react";

export interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    features: string[];
    recommended?: boolean;
}

interface PlanState {
    selectedPlan: Plan | null;
    selectPlan: (plan: Plan) => void;
    clearPlan: () => void;
}

const PlanCtx = createContext<PlanState | null>(null);

// ─── MOCK PLANS — swap with API fetch later ───────────────────────────────────
export const MOCK_PLANS: Plan[] = [
    {
        id: "plan_starter",
        name: "Starter Plan",
        description: "Perfect for small support teams getting started with AI.",
        price: 49,
        currency: "USD",
        features: ["5 AI Agents", "Basic Knowledge Base", "Email Support"],
        recommended: false,
    },
    {
        id: "plan_pro",
        name: "Pro Plan",
        description: "Full AI power for growing businesses.",
        price: 99,
        currency: "USD",
        features: [
            "Ultimate AI Agents",
            "Advanced Knowledge Base Integration",
            "Priority 24/7 Support",
        ],
        recommended: true,
    },
    {
        id: "plan_enterprise",
        name: "Enterprise Plan",
        description: "Custom solution for large scale operations.",
        price: 299,
        currency: "USD",
        features: [
            "Unlimited AI Agents",
            "Custom Integrations",
            "Dedicated Account Manager",
            "SLA Guarantee",
        ],
        recommended: false,
    },
];

export function PlanProvider({ children }: { children: React.ReactNode }) {
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
        MOCK_PLANS[1] // default to Pro for now — remove when pricing page is live
    );

    const selectPlan = (plan: Plan) => setSelectedPlan(plan);
    const clearPlan = () => setSelectedPlan(null);

    return (
        <PlanCtx.Provider value={{ selectedPlan, selectPlan, clearPlan }}>
            {children}
        </PlanCtx.Provider>
    );
}

export function usePlan() {
    const ctx = useContext(PlanCtx);
    if (!ctx) throw new Error("usePlan must be used inside <PlanProvider>");
    return ctx;
}