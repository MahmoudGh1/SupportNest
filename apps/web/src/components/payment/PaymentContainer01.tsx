"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BASE_URL } from "@/lib/api/client";
const PAYMOB_PUBLIC_KEY = "egy_pk_test_24gr1hEc6j0YheiEeIh2oailmkBszFKX";

interface StoredPlan {
  id: string;
  name: string;
  price: number;
  annual: boolean;
  amountCents: number;
}

interface PaymentContainerProps {
  registerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onSuccess: (token: string) => void;
  onError: (message: string) => void;
}

export default function PaymentContainer({
  registerData,
  onSuccess,
  onError,
}: PaymentContainerProps) {
  const [storedPlan, setStoredPlan] = useState<StoredPlan | null>(null);
  const [annual, setAnnual] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("selectedPlan");
    if (raw) {
      try {
        const parsed: StoredPlan = JSON.parse(raw);
        setStoredPlan(parsed);
        setAnnual(parsed.annual);
      } catch {
        setError(
          "Could not load your selected plan. Please go back and select again.",
        );
      }
    } else {
      setError("No plan selected. Please go back and choose a plan.");
    }

    setLoading(false);
  }, []);

  function getMonthlyPrice(): number {
    if (!storedPlan) return 0;
    if (annual && !storedPlan.annual) return Math.round(storedPlan.price * 0.8);
    if (!annual && storedPlan.annual) return Math.round(storedPlan.price / 0.8);
    return storedPlan.price;
  }

  function getTotalToday(): number {
    return annual ? getMonthlyPrice() * 12 : getMonthlyPrice();
  }

  async function handlePay() {
    if (!storedPlan) {
      setError("Session expired. Please go back to step 1.");
      return;
    }

    setPaying(true);
    setError("");

    try {
      const res = await fetch(`${BASE_URL}/payments/create-intention`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pricingId: storedPlan.id,
          amountCents: getTotalToday() * 100,
          currency: "EGP",
          billingData: {
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            email: registerData.email,
            phone: registerData.phone,
          },
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || result.message || "Payment setup failed");
        setPaying(false);
        return;
      }

      

      // ✅ Same tab redirect — Paymob redirects back to /payment-callback
      window.location.href = `https://accept.paymob.com/unifiedcheckout/?publicKey=${PAYMOB_PUBLIC_KEY}&clientSecret=${result.clientSecret}`;
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        `Something went wrong: ${err instanceof Error ? err.message : String(err)}`,
      );
      setPaying(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
        <p>Loading...</p>
      </div>
    );
  }

  // ── No plan ───────────────────────────────────────────────────────────

  if (!storedPlan) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: "#dc2626", marginBottom: 16, fontWeight: 500 }}>
          No plan selected.
        </p>
        <Link
          href="/pricing"
          style={{
            background: "#6366f1",
            color: "white",
            borderRadius: 8,
            padding: "10px 24px",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Choose a plan
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Selected plan card */}
      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#3b82f6",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Selected Plan
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1e40af" }}>
              {storedPlan.name}
            </div>
            <div style={{ fontSize: 13, color: "#3b82f6", marginTop: 2 }}>
              {storedPlan.annual ? "Annual billing" : "Monthly billing"}
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 22, color: "#1e40af" }}>
            EGP {getMonthlyPrice()}
            <span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span>
          </div>
        </div>
        <Link
          href="/pricing"
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginTop: 10,
            display: "inline-block",
          }}
        >
          ← Change plan
        </Link>
      </div>

      {/* Billing toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: !annual ? "#111827" : "#9ca3af",
            fontWeight: !annual ? 600 : 400,
          }}
        >
          Monthly
        </span>
        <button
          onClick={() => setAnnual((a) => !a)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 99,
            background: annual ? "#6366f1" : "#e5e7eb",
            border: "none",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "white",
              position: "absolute",
              top: 3,
              left: annual ? 23 : 3,
              transition: "left 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          />
        </button>
        <span
          style={{
            fontSize: 14,
            color: annual ? "#111827" : "#9ca3af",
            fontWeight: annual ? 600 : 400,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Annual
          <span
            style={{
              background: "#dcfce7",
              color: "#16a34a",
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

      {/* Order summary */}
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "16px 20px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#9ca3af",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Order Summary
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#6b7280" }}>{storedPlan.name} Plan</span>
            <span style={{ fontWeight: 500 }}>EGP {getMonthlyPrice()}/mo</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#6b7280" }}>Billing cycle</span>
            <span style={{ fontWeight: 500 }}>
              {annual ? "Annual" : "Monthly"}
            </span>
          </div>
          {annual && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
              }}
            >
              <span style={{ color: "#6b7280" }}>Annual total</span>
              <span style={{ fontWeight: 500 }}>
                EGP {getMonthlyPrice() * 12}/yr
              </span>
            </div>
          )}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              marginTop: 8,
              paddingTop: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>
              Account
            </div>
            <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
              {registerData.firstName} {registerData.lastName}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              {registerData.email}
            </div>
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: 12,
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 700 }}>Total today</span>
          <span style={{ fontWeight: 700, fontSize: 20, color: "#6366f1" }}>
            EGP {getTotalToday()}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Redirecting indicator */}
      {paying && (
        <div
          style={{
            background: "#eff6ff",
            color: "#3b82f6",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⏳</span>
          <span>Redirecting to payment...</span>
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={paying || !storedPlan}
        style={{
          width: "100%",
          background: "#6366f1",
          color: "white",
          border: "none",
          borderRadius: 10,
          padding: "14px",
          fontSize: 15,
          fontWeight: 600,
          cursor: paying || !storedPlan ? "not-allowed" : "pointer",
          opacity: paying || !storedPlan ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {paying ? "Redirecting..." : `Pay EGP ${getTotalToday()} with Paymob`}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: "#9ca3af",
          fontSize: 12,
        }}
      >
        <span>🔒</span>
        <span>Secured by Paymob</span>
      </div>
    </div>
  );
}
