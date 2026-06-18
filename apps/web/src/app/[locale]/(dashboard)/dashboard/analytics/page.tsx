"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import { AnalyticsSummary } from "@/types/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

function StatCard({
	label,
	value,
	icon,
}: {
	label: string;
	value: string | number;
	icon: string;
}) {
	return (
		<div
			style={{
				background: "var(--surface)",
				borderRadius: 10,
				padding: "1rem 1.1rem",
				border: `0.5px solid var(--card-border)`,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					marginBottom: 10,
				}}
			>
				<span style={{ fontSize: 12, color: "var(--page-muted)" }}>{label}</span>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: 8,
						background: "var(--color-brand-faint)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<i
						className={`ti ti-${icon}`}
						style={{ fontSize: 16, color: "var(--color-brand)" }}
					/>
				</div>
			</div>
			<div
				style={{
					fontSize: 24,
					fontWeight: 600,
					color: "var(--page-text)",
				}}
			>
				{value}
			</div>
		</div>
	);
}

function TierBreakdown({
	data,
}: {
	data: AnalyticsSummary["resolutionByTier"];
}) {
	const { i18n } = useLingui();
	const total = Object.values(data).reduce((a, b) => a + b, 0);
	const items = [
		{ label: i18n._(t`Tier 0 (Auto)`), value: data.TIER0, color: "#10b981" },
		{ label: i18n._(t`Tier 1 (AI)`), value: data.TIER1, color: "var(--color-brand)" },
		{ label: i18n._(t`Tier 2 (Deep AI)`), value: data.TIER2, color: "#6366f1" },
		{ label: i18n._(t`Human`), value: data.HUMAN, color: "#f59e0b" },
		{ label: i18n._(t`Unresolved`), value: data.UNRESOLVED, color: "#ef4444" },
	];

	return (
		<div
			style={{
				background: "var(--surface)",
				borderRadius: 12,
				border: `0.5px solid ${S.border}`,
				padding: "1.25rem",
			}}
		>
			<p
				style={{
					fontSize: 13,
					fontWeight: 500,
					color: "var(--page-muted)",
					marginBottom: 16,
					marginTop: 0,
				}}
			>
				<Trans>Resolution by Tier</Trans>
			</p>
			{items.map((item) => {
				const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
				return (
					<div key={item.label} style={{ marginBottom: 14 }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: 5,
							}}
						>
							<span style={{ fontSize: 12, color: "var(--page-muted)" }}>
								{item.label}
							</span>
							<span
								style={{
									fontSize: 12,
									fontWeight: 500,
									color: "var(--page-text)",
								}}
							>
								{item.value} ({pct}%)
							</span>
						</div>
						<div
							style={{
								height: 6,
								background: "var(--card-border)",
								borderRadius: 3,
								overflow: "hidden",
							}}
						>
							<div
								style={{
									height: "100%",
									width: `${pct}%`,
									background: item.color,
									borderRadius: 3,
									transition: "width .6s ease",
								}}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}

export default function AnalyticsPage() {
	const { i18n } = useLingui();
	const [range, setRange] = useState<"today" | "7d" | "30d">("7d");
	const [data, setData] = useState<AnalyticsSummary | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		api
			.getAnalyticsSummary(range)
			.then(setData)
			.catch(err => console.error(err))
			.finally(() => setLoading(false));
	}, [range]);

	if (loading && !data) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "100%",
					color: "var(--page-muted)",
				}}
			>
				<i
					className="ti ti-loader-2"
					style={{ fontSize: 24, animation: "spin 1s linear infinite" }}
				/>
				<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
			</div>
		);
	}

	if (!data) return (
		<div style={{ padding: "2rem", textAlign: "center", color: "var(--page-muted)" }}>
			<Trans>Failed to load analytics data.</Trans>
		</div>
	);

	const formatMs = (ms: number) => {
		if (ms < 1000) return `${Math.round(ms)}ms`;
		const sec = ms / 1000;
		if (sec < 60) return `${sec.toFixed(1)}s`;
		return `${Math.round(sec / 60)}m`;
	};

	return (
		<div style={{ padding: "1.5rem", height: "100%", overflowY: "auto" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 20,
				}}
			>
				<h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: "var(--page-text)" }}>
					<Trans>Analytics</Trans>
				</h1>
				<div
					style={{
						display: "flex",
						background: "var(--surface)",
						padding: 4,
						borderRadius: 8,
						border: `0.5px solid var(--card-border)`,
					}}
				>
					{(["today", "7d", "30d"] as const).map((r) => (
						<button
							key={r}
							onClick={() => setRange(r)}
							style={{
								padding: "4px 12px",
								fontSize: 12,
								fontWeight: 500,
								borderRadius: 6,
								border: "none",
								cursor: "pointer",
								background: range === r ? S.purple : "transparent",
								color: range === r ? "#fff" : "var(--page-muted)",
								transition: "all .15s",
							}}
						>
							{r === "today" ? i18n._(t`Today`) : r === "7d" ? i18n._(t`7 Days`) : i18n._(t`30 Days`)}
						</button>
					))}
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
					gap: 12,
					marginBottom: 20,
				}}
			>
				<StatCard
					label={i18n._(t`Total Conversations`)}
					value={data.totalConversations.toLocaleString()}
					icon="messages"
				/>
				<StatCard
					label={i18n._(t`Escalation Rate`)}
					value={`${data.escalationRate}%`}
					icon="trending-up"
				/>
				<StatCard
					label={i18n._(t`Avg. Resolution Time`)}
					value={formatMs(data.avgResolutionTimeMs)}
					icon="clock"
				/>
				<StatCard
					label={i18n._(t`CSAT Score`)}
					value={`${data.csat.average.toFixed(1)} / 5`}
					icon="star"
				/>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
					gap: 12,
					marginBottom: 40
				}}
			>
				<TierBreakdown data={data.resolutionByTier} />
				<div
					style={{
						background: "var(--surface)",
						borderRadius: 12,
						border: `0.5px solid ${S.border}`,
						padding: "1.25rem",
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						minHeight: 200,
					}}
				>
					<p
						style={{
							fontSize: 13,
							fontWeight: 500,
							color: "var(--page-muted)",
							marginBottom: 16,
							marginTop: 0,
							alignSelf: "flex-start",
						}}
					>
						<Trans>Customer Satisfaction</Trans>
					</p>
					<div style={{ fontSize: 48, fontWeight: 700, color: S.purple }}>
						{data.csat.average.toFixed(1)}
					</div>
					<div style={{ display: "flex", gap: 4, marginTop: 8 }}>
						{[1, 2, 3, 4, 5].map((star) => (
							<i
								key={star}
								className="ti ti-star-filled"
								style={{
									fontSize: 20,
									color: star <= data.csat.average ? "#f59e0b" : "var(--card-border)",
								}}
							/>
						))}
					</div>
					<p style={{ fontSize: 12, color: "var(--page-muted)", marginTop: 12 }}>
						<Trans>Based on all rated conversations in this period</Trans>
					</p>
				</div>
			</div>
		</div>
	);
}
