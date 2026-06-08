import { S } from "@/components/ui";
import StatsItem from "@/features/knowledgebase/StatsItem";
import { StatsItemProps } from "@/features/knowledgebase/types";
import React, { useMemo, useState } from "react";
const Header = ({
	stats,
}: {
	stats: { total: number; ready: number; processing: number; failed: number };
}) => {
	const statsItems = useMemo<StatsItemProps[]>(
		() => [
			{ label: "Total", value: stats.total, color: S.dark },
			{ label: "Ready", value: stats.ready, color: S.green },
			{ label: "Processing", value: stats.processing, color: "#4F46E5" },
			{ label: "Failed", value: stats.failed, color: S.danger },
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
						color: S.dark,
						margin: "0 0 4px",
					}}
				>
					Knowledge Base
				</h1>
				<p style={{ fontSize: 13, color: S.textMuted, margin: 0 }}>
					Documents your AI pipeline uses to answer customer questions.
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
