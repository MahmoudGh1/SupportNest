import { Trans } from "@lingui/react/macro";
import React from "react";

const ProcessingNotice = ({ processing }: { processing: number }) => {
	return (
		<div
			style={{
				background: "#EEF2FF",
				border: "0.5px solid #C7D2FE",
				borderRadius: 10,
				padding: "10px 14px",
				marginBottom: "1rem",
				display: "flex",
				alignItems: "center",
				gap: 10,
				fontSize: 13,
				color: "#3730A3",
			}}
		>
			<i
				className="ti ti-loader-2"
				style={{
					fontSize: 16,
					animation: "spin 1s linear infinite",
					flexShrink: 0,
				}}
			/>
			<span>
				<Trans>
					<strong>{processing}</strong> document{processing > 1 ? "s" : ""}{" "}
					being processed by the AI pipeline. This page updates automatically.
				</Trans>
			</span>
		</div>
	);
};

export default ProcessingNotice;
