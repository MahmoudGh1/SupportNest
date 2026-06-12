"use client";

import { Dispatch, SetStateAction } from "react";
import { Trans, useLingui } from "@lingui/react/macro";

interface Props {
	annual: boolean;
	setAnnual: Dispatch<SetStateAction<boolean>>;
}

export default function PricingHero({ annual, setAnnual }: Props) {
	const { t } = useLingui();

	return (
		<div className="text-center pt-36 pb-14 px-4 sn-page">
			<p className="text-[13px] font-semibold tracking-[0.12em] uppercase sn-muted mb-4">
				<Trans>Pricing</Trans>
			</p>
			<h1
				className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4"
				style={{ color: "var(--page-text)" }}
			>
				<Trans>Simple, honest pricing.</Trans>
			</h1>
			<p className="sn-muted text-[17px] max-w-100 mx-auto mb-10 leading-relaxed">
				<Trans>Start for free. Upgrade when you need more.</Trans>
			</p>

			<div
				className="inline-flex items-center gap-3 rounded-full px-2 py-1.5 border"
				style={{
					background: "var(--surface)",
					borderColor: "var(--card-border)",
				}}
			>
				<button
					type="button"
					onClick={() => setAnnual(false)}
					className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-colors ${
						!annual ? "text-white" : "sn-muted"
					}`}
					style={!annual ? { background: "var(--btn-primary-bg)" } : undefined}
				>
					{t`Monthly`}
				</button>
				<button
					type="button"
					onClick={() => setAnnual(true)}
					className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-colors flex items-center gap-2 ${
						annual ? "text-white" : "sn-muted"
					}`}
					style={annual ? { background: "var(--btn-primary-bg)" } : undefined}
				>
					{t`Annual`}
					<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
						–20%
					</span>
				</button>
			</div>
		</div>
	);
}
