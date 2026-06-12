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

export function PlanProvider({ children }: { children: React.ReactNode }) {
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

	return (
		<PlanCtx.Provider
			value={{
				selectedPlan,
				selectPlan: setSelectedPlan,
				clearPlan: () => setSelectedPlan(null),
			}}
		>
			{children}
		</PlanCtx.Provider>
	);
}

export function usePlan() {
	const ctx = useContext(PlanCtx);
	if (!ctx) throw new Error("usePlan must be used inside <PlanProvider>");
	return ctx;
}
