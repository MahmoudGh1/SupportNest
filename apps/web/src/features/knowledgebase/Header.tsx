"use client";
import { S } from "@/components/ui";
import StatsItem from "@/features/knowledgebase/StatsItem";
import { StatsItemProps } from "@/features/knowledgebase/types";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useMemo } from "react";

const Header = ({
	stats,
}: {
	stats: { total: number; ready: number; processing: number; failed: number };
}) => {
	const statsItems = useMemo<StatsItemProps[]>(
		() => [
			{ label: t`Total`, value: stats.total, color: "var(--page-text)" },
			{ label: t`Ready`, value: stats.ready, color: "var(--color-success)" },
			{ label: t`Processing`, value: stats.processing, color: "var(--color-info)" },
			{ label: t`Failed`, value: stats.failed, color: "var(--color-danger)" },
		],
		[stats],
	);

	return (
		<div className="flex flex-col md:flex-row items-center justify-between gap-6">
			<div className="flex flex-col text-center md:text-start">
				<h1
					style={{
						fontSize: 18,
						fontWeight: 600,
						color: "var(--page-text)",
						margin: "0 0 4px",
					}}
				>
					<Trans>Knowledge Base</Trans>
				</h1>
				<p style={{ fontSize: 13, color: "var(--page-muted)", margin: 0 }}>
					<Trans>
						Documents your AI pipeline uses to answer customer questions.
					</Trans>
				</p>
			</div>
			{/* Live stats */}
			<div className="flex gap-3 flex-wrap">
				{statsItems.map(({ label, value, color }) => (
					<div
						key={label}
						className=""
					>
						<StatsItem
							label={label}
							value={value}
							color={color}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default Header;
