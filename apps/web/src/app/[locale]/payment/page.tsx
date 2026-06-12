"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { PricingPlan } from "@/types/types";

const PAYMOB_PUBLIC_KEY =
	process.env.NEXT_PUBLIC_PAYMOB_KEY ?? "egy_pk_test_24gr1hEc6j0YheiEeIh2oailmkBszFKX";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredPlan {
	id: string;
	name: string;
	price: number;
	annual: boolean;
	amountCents: number;
}

interface PendingAuth {
	email: string;
	password: string;
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
	violet: "#534AB7",
	violetHover: "#3C3489",
	green: "#1D9E75",
	errorText: "#EF4444",
	font: "'Sora', system-ui, sans-serif",
} as const;

// ── Main page content ─────────────────────────────────────────────────────────

function PaymentPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [dbPlan, setDbPlan] = useState<PricingPlan | null>(null);
	const [storedPlan, setStoredPlan] = useState<StoredPlan | null>(null);
	const [isAnnual, setIsAnnual] = useState(false);
	const [phone, setPhone] = useState("");
	const [loading, setLoading] = useState(false);
	const [pageLoading, setPageLoading] = useState(true);
	const [error, setError] = useState("");

	// ── Bootstrap: load plan + optionally log in ─────────────────────────────

	useEffect(() => {
		async function init() {
			try {
				// 1. Load plans from backend
				const plans = await api.getPlans();

				// 2. Read the plan the user chose on the pricing page
				const raw = sessionStorage.getItem("selectedPlan");
				const planIdParam = searchParams.get("planId");
				const annualParam = searchParams.get("annual") === "true";

				let selectedId = planIdParam ?? "";
				let annual = annualParam;
				let parsedPlan: StoredPlan | null = null;

				if (raw) {
					try {
						parsedPlan = JSON.parse(raw) as StoredPlan;
						selectedId = parsedPlan.id ?? selectedId;
						annual = parsedPlan.annual ?? annual;
					} catch {
						// ignore
					}
				}

				const matched =
					plans.find((p) => p.id === selectedId) ?? plans[0] ?? null;

				if (!matched) {
					setError("No active plans found. Please contact support.");
					return;
				}

				setDbPlan(matched);
				setStoredPlan(parsedPlan);
				setIsAnnual(annual);

				// 3. If we came from registration, log the user in silently
				//    so that create-intention (which requires auth) will work.
				sessionStorage.removeItem("pendingAuth");
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load pricing plans",
				);
			} finally {
				setPageLoading(false);
			}
		}

		void init();
	}, [searchParams, router]);

	// ── Computed values ───────────────────────────────────────────────────────

	function getMonthlyPrice(): number {
		if (storedPlan) {
			if (isAnnual && !storedPlan.annual)
				return Math.round(storedPlan.price * 0.8);
			if (!isAnnual && storedPlan.annual)
				return Math.round(storedPlan.price / 0.8);
			return storedPlan.price;
		}
		return dbPlan?.priceMonthly ?? 0;
	}

	function getTotalToday(): number {
		return isAnnual ? getMonthlyPrice() * 12 : getMonthlyPrice();
	}

	function getAnnualSavings(): number {
		if (!isAnnual || !dbPlan) return 0;
		return Math.round(dbPlan.priceMonthly * 0.2 * 12);
	}

	// ── Checkout handler ──────────────────────────────────────────────────────

	async function handleCheckout() {
		if (!dbPlan) return;

		const phoneClean = phone.trim();
		if (phoneClean.length < 11) {
			setError("Enter a valid phone number (11 digits).");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const regRaw = sessionStorage.getItem("registrationData");
			const regData = regRaw
				? JSON.parse(regRaw) as { firstName: string; lastName: string; email: string }
				: { firstName: "", lastName: "", email: "" };

			const result = await api.createPaymentIntention({
				pricingId: dbPlan.id,
				amountCents: getTotalToday() * 100,
				currency: "EGP",
				billingData: {
					firstName: regData.firstName,
					lastName: regData.lastName,
					email: regData.email,
					phone: phoneClean,
				},
			});

			sessionStorage.setItem("pendingPaymentId", result.paymentId);
			window.location.href = `https://accept.paymob.com/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${result.clientSecret}`;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to initialize payment");
			setLoading(false);
		}
	}

	// ── Loading states ────────────────────────────────────────────────────────

	if (pageLoading) {
		return (
			<div
				className="min-h-screen sn-page flex flex-col items-center justify-center gap-3"
				style={{ fontFamily: T.font }}
			>
				<div
					style={{
						width: 36,
						height: 36,
						border: "3px solid rgba(83,74,183,0.2)",
						borderTopColor: T.violet,
						borderRadius: "50%",
						animation: "spin 0.8s linear infinite",
					}}
				/>
				<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
				<p className="sn-muted text-sm">
					{"Loading your plan…"}
				</p>
			</div>
		);
	}

	if (error && !dbPlan) {
		return (
			<div className="min-h-screen sn-page flex flex-col items-center justify-center gap-4 px-4">
				<p className="sn-muted text-sm text-center">{error}</p>
				<Link
					href="/pricing"
					className="text-sm font-medium no-underline"
					style={{ color: T.violet }}
				>
					Back to pricing
				</Link>
			</div>
		);
	}

	if (!dbPlan) return null;

	const totalToday = getTotalToday();
	const annualSavings = getAnnualSavings();

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="min-h-screen sn-page flex flex-col" style={{ fontFamily: T.font }}>
			{/* Header */}
			<header className="sn-surface border-b border-[var(--card-border)] h-14 px-6 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2 no-underline">
					<div
						style={{
							width: 28,
							height: 28,
							background: T.violet,
							borderRadius: 8,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "#fff",
							fontSize: 11,
							fontWeight: 700,
						}}
					>
						SN
					</div>
					<span
						className="text-[var(--page-text)]"
						style={{ fontSize: 14, fontWeight: 700 }}
					>
						SupportNest
					</span>
				</Link>

				{/* Step indicator */}
				<div className="flex items-center gap-2">
					{["Your details", "Payment"].map((label, i) => (
						<div key={label} className="flex items-center gap-2">
							<div className="flex items-center gap-1.5">
								<div
									style={{
										width: 22,
										height: 22,
										borderRadius: "50%",
										background: i === 1 ? T.violet : "transparent",
										border: `2px solid ${i === 1 ? T.violet : "var(--card-border)"}`,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: 11,
										fontWeight: 700,
										color: i === 1 ? "#fff" : "var(--page-muted)",
									}}
								>
									{i === 0 ? "✓" : "2"}
								</div>
								<span
									style={{
										fontSize: 12,
										fontWeight: i === 1 ? 600 : 400,
										color: i === 1 ? "var(--page-text)" : "var(--page-muted)",
									}}
								>
									{label}
								</span>
							</div>
							{i < 1 && (
								<div
									style={{
										width: 20,
										height: 1,
										background: "var(--card-border)",
									}}
								/>
							)}
						</div>
					))}
				</div>

				<div className="sn-muted" style={{ fontSize: 12 }}>
					Secure Paymob checkout
				</div>
			</header>

			{/* Body */}
			<div className="flex-1 flex items-start justify-center py-10 px-4">
				<div className="w-full max-w-[920px] grid gap-6 md:grid-cols-[1fr_340px]">

					{/* Left — checkout form */}
					<div className="sn-surface rounded-2xl border border-[var(--card-border)] p-7">
						<h1
							className="text-[var(--page-text)]"
							style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}
						>
							Complete your payment
						</h1>
						<p className="sn-muted" style={{ fontSize: 14, marginBottom: 24 }}>
							You'll be redirected to Paymob's secure checkout. Your subscription
							activates only after payment is confirmed.
						</p>

						{/* Plan summary */}
						<div
							className="rounded-2xl border border-[var(--card-border)] p-5 mb-6"
							style={{ background: "var(--surface-elevated)" }}
						>
							<div className="flex items-center justify-between gap-4 mb-3">
								<div>
									<div
										className="sn-muted"
										style={{
											fontSize: 11,
											textTransform: "uppercase",
											letterSpacing: "0.08em",
											marginBottom: 4,
										}}
									>
										Selected plan
									</div>
									<div
										className="text-[var(--page-text)]"
										style={{ fontSize: 18, fontWeight: 600 }}
									>
										SupportNest {dbPlan.name}
									</div>
								</div>
								<div style={{ textAlign: "right" }}>
									<div className="sn-muted" style={{ fontSize: 12 }}>
										{isAnnual ? "Annual billing" : "Monthly billing"}
									</div>
									<div style={{ fontSize: 24, fontWeight: 700, color: T.violet }}>
										EGP {totalToday}
									</div>
								</div>
							</div>

							{annualSavings > 0 && (
								<div
									style={{
										borderRadius: 8,
										background: "var(--color-success-bg)",
										color: T.green,
										fontSize: 12,
										fontWeight: 500,
										padding: "8px 12px",
									}}
								>
									You save EGP {annualSavings} per year with annual billing.
								</div>
							)}
						</div>

						{/* Billing toggle */}
						<div
							className="flex items-center justify-center gap-3 mb-6"
							style={{ padding: "12px 0" }}
						>
							<span
								style={{
									fontSize: 14,
									fontWeight: !isAnnual ? 600 : 400,
									color: !isAnnual ? "var(--page-text)" : "var(--page-muted)",
									transition: "color .2s",
								}}
							>
								Monthly
							</span>
							<button
								onClick={() => setIsAnnual((a) => !a)}
								aria-label="Toggle billing cycle"
								style={{
									width: 44,
									height: 24,
									borderRadius: 99,
									background: isAnnual ? T.violet : "var(--card-border)",
									border: "none",
									cursor: "pointer",
									position: "relative",
									transition: "background 0.2s",
									flexShrink: 0,
								}}
							>
								<div
									style={{
										width: 18,
										height: 18,
										borderRadius: "50%",
										background: "#fff",
										position: "absolute",
										top: 3,
										left: isAnnual ? 23 : 3,
										transition: "left 0.2s",
										boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
									}}
								/>
							</button>
							<span
								style={{
									fontSize: 14,
									fontWeight: isAnnual ? 600 : 400,
									color: isAnnual ? "var(--page-text)" : "var(--page-muted)",
									display: "flex",
									alignItems: "center",
									gap: 6,
									transition: "color .2s",
								}}
							>
								Annual
								<span
									style={{
										background: "rgba(29,158,117,0.15)",
										color: T.green,
										fontSize: 11,
										fontWeight: 700,
										padding: "2px 7px",
										borderRadius: 99,
									}}
								>
									Save 20%
								</span>
							</span>
						</div>

						{/* Phone input */}
						<div style={{ marginBottom: 20 }}>
							<label
								className="text-[var(--page-text)]"
								style={{
									display: "block",
									fontSize: 13,
									fontWeight: 500,
									marginBottom: 8,
								}}
							>
								Billing phone number
							</label>
							<input
								value={phone}
								onChange={(e) =>
									setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
								}
								placeholder="01XXXXXXXXX"
								className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface)] text-[var(--page-text)] outline-none"
								style={{ padding: "12px 16px", fontSize: 14 }}
							/>
							<p className="sn-muted" style={{ fontSize: 12, marginTop: 6 }}>
								Used for the Paymob billing record.
							</p>
						</div>

						{error && (
							<div
								className="rounded-xl mb-5"
								style={{
									background: "var(--color-danger-bg)",
									color: T.errorText,
									fontSize: 13,
									padding: "12px 16px",
								}}
							>
								{error}
							</div>
						)}

						<button
							onClick={handleCheckout}
							disabled={loading}
							style={{
								width: "100%",
								background: loading ? "rgba(83,74,183,0.5)" : T.violet,
								color: "#fff",
								border: "none",
								borderRadius: 12,
								padding: "14px",
								fontSize: 15,
								fontWeight: 600,
								fontFamily: T.font,
								cursor: loading ? "not-allowed" : "pointer",
								transition: "background .15s",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 8,
							}}
							onMouseEnter={(e) => {
								if (!loading)
									(e.currentTarget as HTMLElement).style.background = T.violetHover;
							}}
							onMouseLeave={(e) => {
								if (!loading)
									(e.currentTarget as HTMLElement).style.background = T.violet;
							}}
						>
							{loading ? (
								<>
									<div
										style={{
											width: 16,
											height: 16,
											border: "2px solid rgba(255,255,255,0.3)",
											borderTopColor: "#fff",
											borderRadius: "50%",
											animation: "spin 0.8s linear infinite",
										}}
									/>
									Redirecting to Paymob…
								</>
							) : (
								<>
									<i className="ti ti-lock" style={{ fontSize: 16 }} />
									Pay EGP {totalToday} with Paymob
								</>
							)}
						</button>

						<p
							className="sn-muted"
							style={{
								textAlign: "center",
								fontSize: 12,
								marginTop: 12,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 4,
							}}
						>
							<i className="ti ti-lock" style={{ fontSize: 13 }} />
							Secured by Paymob
						</p>
					</div>

					{/* Right — order summary */}
					<div className="flex flex-col gap-4">
						<div className="sn-surface rounded-2xl border border-[var(--card-border)] p-5">
							<div
								className="sn-muted"
								style={{
									fontSize: 11,
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.08em",
									marginBottom: 12,
								}}
							>
								Order summary
							</div>
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								{[
									[`${dbPlan.name} plan`, `EGP ${getMonthlyPrice()}/mo`],
									["Billing cycle", isAnnual ? "Annual" : "Monthly"],
									...(isAnnual
										? [["Annual total", `EGP ${getMonthlyPrice() * 12}/yr`]]
										: []),
								].map(([label, value]) => (
									<div
										key={label}
										style={{
											display: "flex",
											justifyContent: "space-between",
											fontSize: 13,
										}}
									>
										<span className="sn-muted">{label}</span>
										<span
											className="text-[var(--page-text)]"
											style={{ fontWeight: 500 }}
										>
											{value}
										</span>
									</div>
								))}
								<div
									style={{
										borderTop: "1px solid var(--card-border)",
										paddingTop: 8,
										marginTop: 4,
										display: "flex",
										justifyContent: "space-between",
										fontSize: 14,
									}}
								>
									<span className="text-[var(--page-text)]" style={{ fontWeight: 700 }}>
										Due today
									</span>
									<span style={{ fontWeight: 700, color: T.violet, fontSize: 16 }}>
										EGP {totalToday}
									</span>
								</div>
							</div>
						</div>

						<div
							className="rounded-2xl border border-[var(--card-border)] p-5"
							style={{ background: "var(--surface-elevated)" }}
						>
							<div
								className="sn-muted"
								style={{
									fontSize: 11,
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.08em",
									marginBottom: 12,
								}}
							>
								How it works
							</div>
							{[
								"Payment intention is created on our backend.",
								"You complete payment on Paymob's hosted page.",
								"Paymob notifies our backend on success.",
								"Your subscription activates automatically.",
							].map((item) => (
								<div
									key={item}
									style={{
										display: "flex",
										alignItems: "flex-start",
										gap: 8,
										marginBottom: 10,
									}}
								>
									<span style={{ color: T.green, marginTop: 1 }}>✓</span>
									<span className="sn-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
										{item}
									</span>
								</div>
							))}
						</div>

						<Link
							href="/pricing"
							className="sn-muted no-underline"
							style={{ fontSize: 13, textAlign: "center" }}
						>
							← Change plan
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function PaymentPage() {
	return <PaymentPageContent />;
}