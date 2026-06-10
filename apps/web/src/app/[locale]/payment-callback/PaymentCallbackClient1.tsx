"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentCallbackClient() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const success = params.get("success");
    const pendingId = sessionStorage.getItem("pendingPaymentId");

    if (success === "true" && pendingId) {
      // Tell backend to confirm this payment
      fetch(`http://localhost:3201/api/v1/payments/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentId: pendingId }),
      }).finally(() => {
        sessionStorage.removeItem("selectedPlan");
        sessionStorage.removeItem("pendingPaymentId");
        router.replace("/dashboard");
      });
    } else {
      sessionStorage.removeItem("pendingPaymentId");
      router.replace("/setup?payment=failed");
    }
  }, []);

  return (
    <div style={{ textAlign: "center", padding: 80, color: "#6b7280" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
      <p style={{ fontWeight: 500 }}>Payment confirmed! Redirecting...</p>
    </div>
  );
}
