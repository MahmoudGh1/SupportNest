import { S } from "@/components/ui";
import React from "react";

const Loading = () => {
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				height: "100%",
				color: S.textMuted,
			}}
		>
			<i
				className="ti ti-loader-2"
				style={{ fontSize: 24, animation: "spin 1s linear infinite" }}
			/>
			<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
		</div>
	);
};

export default Loading;
