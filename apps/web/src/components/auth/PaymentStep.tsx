"use client";

import { useState } from "react";
import { usePlan } from "@/context/plan-context";
import { T, PAYMENT_METHODS } from "@/types/payment.types";
import type {
  PaymentMethod,
  PaymentStep as StepType,
  RegistrationData,
} from "@/types/payment.types";
import {
  createPaymentIntention,
  buildPaymobCheckoutUrl,
} from "@/lib/payment.service";
import { CardForm } from "@/components/payment/CardForm";
import {
  VodafoneForm,
  InstapayForm,
  FawryForm,
} from "@/components/payment/WalletForm";
import {
  ProcessingScreen,
  SuccessScreen,
} from "@/components/payment/PaymentScreen";
import {
  MethodPicker,
  PaymobIframe,
  OrderHeader,
  TrustBadges,
} from "@/components/payment/PaymentUi";

export type { RegistrationData };

interface Props {
  registrationData: RegistrationData;
  onBack: () => void;
}

export function PaymentStep({ registrationData, onBack }: Props) {
  const { selectedPlan } = usePlan();

  // selectedPlan.id must be the Prisma Pricing row id
  // selectedPlan.priceCents is the amount in EGP cents (e.g. 9900 = 99 EGP)
  const planName = selectedPlan?.name ?? "Growth";
  const pricingId = selectedPlan?.id ?? "";
  const amountCents =
    (selectedPlan as { priceCents?: number } | undefined)?.priceCents ?? 9900;

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<StepType>("method");
  const [loading, setLoading] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // ── Trigger payment ────────────────────────────────────────────────────────
  // `overridePhone` is supplied by wallet forms (Vodafone / InstaPay / Fawry)
  // that collect their own phone number. Card forms use registrationData.phone.
  const handlePay = async (overridePhone?: string) => {
    if (!pricingId) {
      setApiError("No plan selected. Please go back and choose a plan.");
      return;
    }

    setLoading(true);
    setApiError(null);
    setStep("processing");

    const result = await createPaymentIntention({
      pricingId,
      amountCents,
      currency: "EGP",
      billingData: {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email,
        phone: overridePhone ?? registrationData.phone ?? "",
      },
    });

    setLoading(false);

    if (!result.success) {
      setApiError(result.error ?? "Payment failed. Please try again.");
      setStep("details"); // return user to the form so they can retry
      return;
    }

    if (result.paymentId) setPaymentId(result.paymentId);

    // Open Paymob's hosted checkout inside the iframe overlay.
    // The webhook on your backend will update the DB when payment settles.
    if (result.clientSecret) {
      setIframeUrl(buildPaymobCheckoutUrl(result.clientSecret));
      return;
    }

    // Fawry: no iframe — reference code shown, plan activates via webhook
    setStep("success");
  };

  // ── Iframe closed ──────────────────────────────────────────────────────────
  // We don't poll here — the backend webhook updates the DB independently.
  // Show the success screen so the user knows to wait for email confirmation.
  const handleIframeClose = () => {
    setIframeUrl(null);
    setStep("success");
  };

  const selectedMethodMeta = PAYMENT_METHODS.find((m) => m.id === method);
  const showHeader = step !== "success" && step !== "processing";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Main card ── */}
      <div
        style={{
          background: T.darkSurface,
          border: `1px solid ${T.darkBorder2}`,
          borderRadius: T.radiusXl,
          overflow: "hidden",
        }}
      >
        {showHeader && (
          <OrderHeader
            planName={planName}
            planPrice={Math.round(amountCents / 100)}
          />
        )}

        <div style={{ padding: 24 }}>
          {step === "processing" && <ProcessingScreen />}

          {step === "success" && method && (
            <SuccessScreen planName={planName} methodId={method} />
          )}

          {(step === "method" || step === "details") && (
            <>
              {/* Back to method list */}
              {step === "details" && (
                <button
                  onClick={() => {
                    setStep("method");
                    setApiError(null);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: T.gray500,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: T.font,
                    marginBottom: 18,
                    transition: "color .15s",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = T.white)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = T.gray500)
                  }
                >
                  ← Change payment method
                </button>
              )}

              {/* API error */}
              {apiError && (
                <div
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    borderRadius: T.radius,
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: 13,
                    color: T.errorText,
                  }}
                >
                  ⚠ {apiError}
                </div>
              )}

              {step === "method" && (
                <MethodPicker
                  onSelect={(id) => {
                    setMethod(id);
                    setStep("details");
                  }}
                />
              )}

              {step === "details" && method && (
                <>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: T.white,
                      margin: "0 0 4px",
                    }}
                  >
                    {selectedMethodMeta?.label}
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: T.gray500,
                      margin: "0 0 20px",
                    }}
                  >
                    {selectedMethodMeta?.sub}
                  </p>

                  {(method === "mastercard" || method === "visa") && (
                    <CardForm
                      method={method}
                      loading={loading}
                      registrationData={registrationData}
                      onPay={() => handlePay()}
                    />
                  )}
                  {method === "vodafone" && (
                    <VodafoneForm
                      loading={loading}
                      onPay={(phone) => handlePay(phone)}
                    />
                  )}
                  {method === "instapay" && (
                    <InstapayForm
                      loading={loading}
                      amount={Math.round(amountCents / 100)}
                      onPay={(phone) => handlePay(phone)}
                    />
                  )}
                  {method === "fawry" && (
                    <FawryForm
                      loading={loading}
                      amount={Math.round(amountCents / 100)}
                      onPay={() => handlePay()}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Trust badges + Back button — hidden on success/processing */}
      {step !== "success" && step !== "processing" && (
        <>
          <TrustBadges />

          <button
            onClick={onBack}
            style={{
              width: "100%",
              padding: "12px",
              background: "transparent",
              color: "rgba(255,255,255,0.45)",
              border: `1.5px solid ${T.darkBorder2}`,
              borderRadius: T.radius,
              fontSize: 14,
              fontWeight: 500,
              fontFamily: T.font,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "border-color .15s, color .15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "rgba(255,255,255,0.25)";
              (e.currentTarget as HTMLElement).style.color = T.white;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                T.darkBorder2;
              (e.currentTarget as HTMLElement).style.color =
                "rgba(255,255,255,0.45)";
            }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 16 }} />
            Back to Account Details
          </button>
        </>
      )}

      {/* Paymob hosted checkout overlay */}
      {iframeUrl && (
        <PaymobIframe url={iframeUrl} onClose={handleIframeClose} />
      )}
    </div>
  );
}
