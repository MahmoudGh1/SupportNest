"use client";

import Link from "next/link";
import { Trans, useLingui } from "@lingui/react/macro";

const STATS = [
	{ val: "80%", label: "Tickets auto-resolved" },
	{ val: "70%", label: "Support cost reduction" },
	{ val: "1.4s", label: "Avg AI response time" },
	{ val: "4.8★", label: "Average CSAT score" },
];

export default function Hero() {
	const { t } = useLingui();

	return (
		<section
			className="relative overflow-hidden text-center pt-36 pb-[100px] px-[5%]"
			style={{ background: "var(--page-bg)" }}
		>
			<div
				className="absolute pointer-events-none rounded-full opacity-60"
				style={{
					top: -120,
					left: "50%",
					transform: "translateX(-50%)",
					width: 800,
					height: 500,
					background:
						"radial-gradient(ellipse, rgba(83,74,183,0.12) 0%, transparent 70%)",
				}}
			/>

			<div className="inline-flex items-center gap-1.5 bg-brand-faint border border-brand-mid/25 rounded-full px-3.5 py-1.5 mb-7">
				<div className="w-[7px] h-[7px] rounded-full bg-success shadow-[0_0_0_3px_var(--color-success-bg)]" />
				<span className="text-brand text-[13px] font-semibold">
					<Trans>AI-Powered Customer Support Platform</Trans>
				</span>
			</div>

			<h1
				className="font-extrabold leading-[1.1] tracking-[-0.03em] max-w-[780px] mx-auto mb-5 mt-0"
				style={{ fontSize: "clamp(2.4rem, 5.5vw, 4rem)", color: "var(--page-text)" }}
			>
				{t`Resolve`}{" "}
				<span className="text-brand">80% {t`of tickets`}</span>{" "}
				{t`instantly with AI agents`}
			</h1>

			<p
				className="sn-muted leading-[1.75] max-w-[560px] mx-auto mb-11 mt-0"
				style={{ fontSize: "clamp(1rem, 1.8vw, 1.15rem)" }}
			>
				<Trans>
					SupportNest deploys a hierarchy of specialized AI agents that handle
					customer inquiries, automate workflows, and escalate complex issues — 24/7,
					with full context.
				</Trans>
			</p>

			<div className="flex gap-3 justify-center flex-wrap mb-16">
				<Link
					href="/pricing"
					className="bg-brand hover:bg-brand-light text-white text-[15px] font-semibold no-underline px-[30px] py-[13px] rounded-[10px] inline-flex items-center gap-2 transition-colors"
				>
					{t`Start Free Trial`} <i className="ti ti-arrow-right text-base" />
				</Link>
				<a
					href="#pipeline"
					className="sn-surface text-[15px] font-semibold no-underline px-7 py-[13px] rounded-[10px] border inline-flex items-center gap-2 transition-colors hover:border-brand"
					style={{ color: "var(--page-text)" }}
				>
					<i className="ti ti-player-play-filled text-[15px]" />{" "}
					{t`See How It Works`}
				</a>
			</div>

			<div className="flex justify-center flex-wrap">
				{STATS.map((s, i) => (
					<div
						key={s.label}
						className={`px-10 py-5 text-center ${i < 3 ? "border-r" : ""}`}
						style={{ borderColor: "var(--card-border)" }}
					>
						<div
							className="font-extrabold tracking-[-0.03em]"
							style={{
								fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
								color: "var(--page-text)",
							}}
						>
							{s.val}
						</div>
						<div className="text-[13px] sn-muted mt-1 font-medium">{s.label}</div>
					</div>
				))}
			</div>
		</section>
	);
}
