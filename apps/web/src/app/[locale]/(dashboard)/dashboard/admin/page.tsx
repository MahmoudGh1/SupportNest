"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";
import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import type { AdminOverview } from "@/types/types";

function StatCard({
	label,
	value,
	icon,
	color = "var(--color-brand)",
}: {
	label: string;
	value: string | number;
	icon: string;
	color?: string;
}) {
	return (
		<div
			style={{
				background: S.surface,
				borderRadius: 12,
				padding: "1.25rem",
				border: `0.5px solid ${S.border}`,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					marginBottom: 12,
				}}
			>
				<div
					style={{
						width: 36,
						height: 36,
						borderRadius: 10,
						background: `${color}10`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<i
						className={`ti ti-${icon}`}
						style={{ fontSize: 18, color }}
					/>
				</div>
				<span style={{ fontSize: 12, color: S.textMuted, fontWeight: 500 }}>
					{label}
				</span>
			</div>
			<div
				style={{
					fontSize: 24,
					fontWeight: 700,
					color: S.dark,
				}}
			>
				{value}
			</div>
		</div>
	);
}

// ─── SKELETON COMPONENTS ──────────────────────────────────────────────────────
function Shimmer({ width = "100%", height = 16, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
	return (
		<div
			style={{
				width,
				height,
				borderRadius: radius,
				background: `linear-gradient(90deg, ${S.border} 25%, #f0eff8 50%, ${S.border} 75%)`,
				backgroundSize: "200% 100%",
				animation: "shimmer 1.4s infinite",
				flexShrink: 0,
			}}
		/>
	);
}

function OverviewSkeleton() {
	return (
		<div style={{ padding: "1.5rem", minWidth: 0 }}>
			<style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>

			{/* Header */}
			<div style={{ marginBottom: 24 }}>
				<Shimmer width={120} height={12} radius={4} />
				<div style={{ marginTop: 8 }}>
					<Shimmer width={300} height={28} radius={6} />
				</div>
			</div>

			{/* Top Row Cards */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} style={{ background: S.surface, borderRadius: 12, padding: "1.25rem", border: `0.5px solid ${S.border}` }}>
						<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
							<Shimmer width={36} height={36} radius={10} />
							<Shimmer width={100} height={14} radius={4} />
						</div>
						<Shimmer width="60%" height={24} radius={6} />
					</div>
				))}
			</div>

			{/* Second Row Cards */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} style={{ background: S.surface, borderRadius: 12, padding: "1.25rem", border: `0.5px solid ${S.border}` }}>
						<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
							<Shimmer width={36} height={36} radius={10} />
							<Shimmer width={100} height={14} radius={4} />
						</div>
						<Shimmer width="60%" height={24} radius={6} />
					</div>
				))}
			</div>

			{/* Tier Breakdown Section */}
			<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "1.5rem", marginBottom: 24 }}>
				<div style={{ marginBottom: 20 }}>
					<Shimmer width={200} height={18} radius={6} />
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i}>
							<Shimmer width={100} height={12} radius={4} />
							<div style={{ marginTop: 6, marginBottom: 4 }}>
								<Shimmer width="70%" height={20} radius={6} />
							</div>
							<Shimmer width="40%" height={10} radius={4} />
							<div style={{ marginTop: 10 }}>
								<Shimmer width="100%" height={4} radius={2} />
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Bottom Row */}
			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
				<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "1.5rem" }}>
					<div style={{ marginBottom: 16 }}>
						<Shimmer width={150} height={16} radius={6} />
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<Shimmer width="100%" height={14} radius={4} />
						<Shimmer width="100%" height={14} radius={4} />
						<Shimmer width="100%" height={14} radius={4} />
					</div>
				</div>
				<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "1.5rem" }}>
					<div style={{ marginBottom: 16 }}>
						<Shimmer width={150} height={16} radius={6} />
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
						<Shimmer width="100%" height={14} radius={4} />
						<Shimmer width="100%" height={14} radius={4} />
						<Shimmer width="100%" height={14} radius={4} />
					</div>
				</div>
			</div>
		</div>
	);
}

export default function AdminOverviewPage() {
	const [stats, setStats] = useState<AdminOverview | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		api.getAdminOverview()
			.then(setStats)
			.catch((err) => setError(err.message || "Failed to load overview stats"))
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return <OverviewSkeleton />;
	}

	if (error) {
		return (
			<div style={{ padding: "1.5rem" }}>
				<div
					style={{
						background: S.dangerBg,
						color: S.danger,
						padding: "1rem",
						borderRadius: 8,
						fontSize: 14,
					}}
				>
					{error}
				</div>
			</div>
		);
	}

	if (!stats) return null;

	return (
		<div style={{ padding: "1.5rem", minWidth: 0 }}>
			{/* Page header */}
			<div style={{ marginBottom: 24 }}>
				<p
					style={{
						fontSize: 11,
						fontWeight: 600,
						color: S.textMuted,
						letterSpacing: ".06em",
						textTransform: "uppercase",
						margin: "0 0 4px",
					}}
				>
					Platform Overview
				</p>
				<h1 style={{ fontSize: 24, fontWeight: 750, color: S.dark, margin: 0 }}>
					System-wide Performance
				</h1>
			</div>

			{/* Top Row: Organizations & Users */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<StatCard
					label="Total Organizations"
					value={stats.total_organizations}
					icon="building"
					color={S.purple}
				/>
				<StatCard
					label="Active Organizations"
					value={stats.active_organizations}
					icon="building-check"
					color={S.green}
				/>
				<StatCard
					label="Total Users"
					value={stats.total_users}
					icon="users"
					color={S.brand}
				/>
				<StatCard
					label="AI Resolution Rate"
					value={`${stats.overall_ai_resolution_rate}%`}
					icon="cpu"
					color="#ff9f43"
				/>
			</div>

			{/* Second Row: Conversations & Tickets */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(4, 1fr)",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<StatCard
					label="Total Conversations"
					value={stats.total_conversations.toLocaleString()}
					icon="message-2"
					color={S.brand}
				/>
				<StatCard
					label="Active Conversations"
					value={stats.active_conversations}
					icon="message-dots"
					color={S.green}
				/>
				<StatCard
					label="Total Tickets"
					value={stats.total_tickets.toLocaleString()}
					icon="ticket"
					color={S.purple}
				/>
				<StatCard
					label="Escalated Tickets"
					value={stats.escalated_tickets}
					icon="alert-circle"
					color={S.danger}
				/>
			</div>

			{/* Tier Breakdown Section */}
			<div
				style={{
					background: S.surface,
					borderRadius: 12,
					border: `0.5px solid ${S.border}`,
					padding: "1.5rem",
					marginBottom: 24,
				}}
			>
				<h3
					style={{
						fontSize: 16,
						fontWeight: 700,
						color: S.dark,
						margin: "0 0 20px",
					}}
				>
					AI Tier Resolution Breakdown
				</h3>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(4, 1fr)",
						gap: 24,
					}}
				>
					{[
						{
							label: "Tier 0 (Instant)",
							value: `${stats.tier_breakdown.tier0_resolve_rate}%`,
							sub: `${stats.tier_breakdown.tier0_resolved} resolved`,
							color: S.green,
						},
						{
							label: "Tier 1 (Complex)",
							value: `${stats.tier_breakdown.tier1_resolve_rate}%`,
							sub: `${stats.tier_breakdown.tier1_resolved} resolved`,
							color: S.brand,
						},
						{
							label: "Tier 2 (Advanced)",
							value: `${stats.tier_breakdown.tier2_resolve_rate}%`,
							sub: `${stats.tier_breakdown.tier2_resolved} resolved`,
							color: S.purple,
						},
						{
							label: "Human Escalation",
							value: `${stats.tier_breakdown.human_escalation_rate}%`,
							sub: `${stats.tier_breakdown.human_escalated} escalated`,
							color: S.danger,
						},
					].map((item) => (
						<div key={item.label}>
							<div
								style={{
									fontSize: 12,
									color: S.textMuted,
									fontWeight: 500,
									marginBottom: 4,
								}}
							>
								{item.label}
							</div>
							<div
								style={{
									fontSize: 20,
									fontWeight: 700,
									color: S.dark,
									marginBottom: 2,
								}}
							>
								{item.value}
							</div>
							<div style={{ fontSize: 11, color: S.textMuted }}>{item.sub}</div>
							<div
								style={{
									height: 4,
									background: `${item.color}20`,
									borderRadius: 2,
									marginTop: 8,
									overflow: "hidden",
								}}
							>
								<div
									style={{
										height: "100%",
										width: item.value,
										background: item.color,
										borderRadius: 2,
									}}
								/>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Performance Metrics */}
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
				<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, padding: '1.5rem' }}>
					<h3 style={{ fontSize: 14, fontWeight: 700, color: S.dark, margin: '0 0 16px' }}>Platform Efficiency</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontSize: 12, color: S.textSecondary }}>Avg Tier 1 Latency</span>
							<span style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>{stats.tier_breakdown.avg_tier1_latency_ms}ms</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontSize: 12, color: S.textSecondary }}>Avg Tier 2 Latency</span>
							<span style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>{stats.tier_breakdown.avg_tier2_latency_ms}ms</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontSize: 12, color: S.textSecondary }}>Total Tokens Consumed</span>
							<span style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>{stats.tier_breakdown.total_tokens_used.toLocaleString()}</span>
						</div>
					</div>
				</div>
				<div style={{ background: S.surface, borderRadius: 12, border: `0.5px solid ${S.border}`, padding: '1.5rem' }}>
					<h3 style={{ fontSize: 14, fontWeight: 700, color: S.dark, margin: '0 0 16px' }}>Satisfaction & Quality</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontSize: 12, color: S.textSecondary }}>Average CSAT Score</span>
							<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
								<i className="ti ti-star-filled" style={{ color: '#f1c40f', fontSize: 14 }} />
								<span style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>{stats.avg_csat_score} / 5.0</span>
							</div>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontSize: 12, color: S.textSecondary }}>Open Tickets</span>
							<span style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>{stats.open_tickets}</span>
						</div>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontSize: 12, color: S.textSecondary }}>Active Conversations</span>
							<span style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>{stats.active_conversations}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}