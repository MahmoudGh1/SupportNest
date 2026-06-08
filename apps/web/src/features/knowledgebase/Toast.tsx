import { S } from "@/components/ui";
import React from "react";

const Toast = ({ message }: { message: string }) => {
	return (
		message && (
			<div
				style={{
					position: "fixed",
					bottom: 24,
					right: 24,
					background: S.dark,
					color: "#fff",
					fontSize: 13,
					padding: "10px 16px",
					borderRadius: 10,
					boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
					zIndex: 200,
					animation: "fadeIn .2s ease",
					display: "flex",
					alignItems: "center",
					gap: 8,
				}}
			>
				<i
					className="ti ti-check"
					style={{ fontSize: 15, color: S.green }}
				/>
				{message}
			</div>
		)
	);
};

export default Toast;
