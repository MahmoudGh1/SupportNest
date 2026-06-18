// "use client";

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useSearchParams } from "next/navigation";
// import { api } from "@/lib/api";

// const POLL_INTERVAL_MS = 2500;
// const MAX_ATTEMPTS = 20; // 50 seconds total

// type Phase = "checking" | "success" | "failed" | "timeout";

// export default function PaymentCallbackClient() {
//   const params = useSearchParams();
//   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const attemptRef = useRef(0);

//   const [phase, setPhase] = useState<Phase>("checking");
//   const [message, setMessage] = useState("Verifying your payment…");

//   const clearTimer = useCallback(() => {
//     if (timerRef.current) {
//       clearTimeout(timerRef.current);
//       timerRef.current = null;
//     }
//   }, []);


//   const redirectToHome = useCallback(async (succeeded: boolean) => {
//       clearTimer();
//       if (!succeeded) {
//         try { await api.logout(); } catch { }
//       }
//       sessionStorage.removeItem("selectedPlan");
//       sessionStorage.removeItem("registrationData");
//       sessionStorage.removeItem("pendingPaymentId");
//       window.location.replace("/");
//   }, [clearTimer]);

//   const checkPayment = useCallback(
//     async function poll(attempt: number) {
//       const pendingId = sessionStorage.getItem("pendingPaymentId");
//       const paymobSuccess = params.get("success") === "true";

//       // No pending payment → they landed here directly, send them home
//       if (!pendingId) {
//         setPhase("failed");
//         setMessage("No pending payment found. Redirecting…");
//         timerRef.current = setTimeout(() => void redirectToHome(false), 1500);
//         return;
//       }

//       try {
//         const payments = await api.getPaymentHistory();
//         const payment = payments.find((p) => p.id === pendingId);

//         if (payment?.status === "SUCCEEDED") {
//           setPhase("success");
//           setMessage("Payment confirmed! Redirecting to your dashboard…");
//           timerRef.current = setTimeout(() => void redirectToHome(true), 1500);
//           return;
//         }

//         if (payment?.status === "FAILED") {
//           setPhase("failed");
//           setMessage("Payment was not completed. Redirecting…");
//           timerRef.current = setTimeout(() => void redirectToHome(false), 2000);
//           return;
//         }

//         // Still PENDING — keep polling
//         if (attempt < MAX_ATTEMPTS) {
//           setMessage(
//             paymobSuccess
//               ? `Paymob confirmed. Waiting for backend… (${attempt}/${MAX_ATTEMPTS})`
//               : `Waiting for payment confirmation… (${attempt}/${MAX_ATTEMPTS})`,
//           );
//           timerRef.current = setTimeout(
//             () => void poll(attempt + 1),
//             POLL_INTERVAL_MS,
//           );
//           return;
//         }

//         // Ran out of retries
//         setPhase("timeout");
//         setMessage(
//           paymobSuccess
//             ? "Paymob confirmed your payment but our backend hasn't caught up yet. Please wait a moment and retry."
//             : "Payment confirmation timed out. Please retry below.",
//         );
//       } catch {
//         if (attempt < MAX_ATTEMPTS) {
//           timerRef.current = setTimeout(
//             () => void poll(attempt + 1),
//             POLL_INTERVAL_MS,
//           );
//           return;
//         }
//         setPhase("timeout");
//         setMessage("Could not reach the server. Please retry below.");
//       }
//     },
//     [params, redirectToHome],
//   );

//   useEffect(() => {
//     void checkPayment(1);
//     return () => clearTimer();
//   }, [checkPayment, clearTimer]);

//   // ── UI ────────────────────────────────────────────────────────────────────

//   const icon =
//     phase === "success"
//       ? "✓"
//       : phase === "failed"
//         ? "✕"
//         : phase === "timeout"
//           ? "!"
//           : null;

//   const iconColor =
//     phase === "success"
//       ? "#1D9E75"
//       : phase === "failed" || phase === "timeout"
//         ? "#EF4444"
//         : "#534AB7";

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: 20,
//         padding: "40px 16px",
//         fontFamily: "'Sora', system-ui, sans-serif",
//         color: "var(--page-muted)",
//       }}
//     >
//       {/* Spinner or icon */}
//       {phase === "checking" ? (
//         <>
//           <div
//             style={{
//               width: 48,
//               height: 48,
//               border: "3px solid rgba(83,74,183,0.2)",
//               borderTopColor: "#534AB7",
//               borderRadius: "50%",
//               animation: "spin 0.8s linear infinite",
//             }}
//           />
//           <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//         </>
//       ) : (
//         <div
//           style={{
//             width: 56,
//             height: 56,
//             borderRadius: "50%",
//             background:
//               phase === "success"
//                 ? "rgba(29,158,117,0.12)"
//                 : "rgba(239,68,68,0.12)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontSize: 24,
//             fontWeight: 700,
//             color: iconColor,
//           }}
//         >
//           {icon}
//         </div>
//       )}

//       <p
//         style={{
//           maxWidth: 440,
//           textAlign: "center",
//           fontSize: 15,
//           fontWeight: 500,
//           color: "var(--page-text)",
//           margin: 0,
//         }}
//       >
//         {message}
//       </p>

//       {/* Retry / go home buttons for timeout */}
//       {phase === "timeout" && (
//         <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
//           <button
//             type="button"
//             onClick={() => {
//               setPhase("checking");
//               setMessage("Retrying verification…");
//               void checkPayment(1);
//             }}
//             style={{
//               background: "#534AB7",
//               color: "#fff",
//               border: "none",
//               borderRadius: 12,
//               padding: "12px 20px",
//               fontWeight: 600,
//               fontSize: 14,
//               fontFamily: "inherit",
//               cursor: "pointer",
//             }}
//           >
//             Retry verification
//           </button>
//           <button
//             type="button"
//             onClick={() => void redirectToHome(false)}
//             style={{
//               background: "transparent",
//               color: "var(--page-text)",
//               border: "1px solid var(--card-border)",
//               borderRadius: 12,
//               padding: "12px 20px",
//               fontWeight: 600,
//               fontSize: 14,
//               fontFamily: "inherit",
//               cursor: "pointer",
//             }}
//           >
//             Back to home
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }


// "use client";

// import { useEffect, useState } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { api } from "@/lib/api";

// type Phase = "checking" | "success" | "failed";

// export default function PaymentCallbackClient() {
//   const params = useSearchParams();
//   const router = useRouter();
//   const [phase, setPhase] = useState<Phase>("checking");
//   const [message, setMessage] = useState("Verifying your payment…");

//   useEffect(() => {
//     const success = params.get("success") === "true";
//     const paymentId = sessionStorage.getItem("paymentId") as string


//     if (!success) {
//       setPhase("failed");
//       setMessage("Payment was not completed. Redirecting…");
//       setTimeout(() => router.replace("/"), 2000);
//       return
//     }
//     api.confirmPayment(paymentId)
//     .then(() => {
//         sessionStorage.removeItem("paymentId");
//         sessionStorage.removeItem("selectedPlan");
//         setPhase("success");
//         setMessage("Payment confirmed! Redirecting to your dashboard…");
//         setTimeout(() => router.replace("/dashboard"), 2000);
//     })
//     .catch(() => {
//         setPhase("failed");
//         setMessage("Payment verification failed. Redirecting…");
//         setTimeout(() => router.replace("/"), 2000);
//     });
//   }, [params, router]);

//   const icon =
//     phase === "success" ? "✓" : phase === "failed" ? "✕" : null;

//   const iconColor =
//     phase === "success" ? "#1D9E75" : phase === "failed" ? "#EF4444" : "#534AB7";













"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 20;

type Phase = "checking" | "success" | "failed" | "timeout";

export default function PaymentCallbackClient() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("Verifying your payment…");

  const cleanup = useCallback(() => {
    sessionStorage.removeItem("paymentId");
    sessionStorage.removeItem("pendingUserId");
    sessionStorage.removeItem("selectedPlan");
    sessionStorage.removeItem("registrationData");
  }, []);

  const poll = useCallback(async function check(attempt: number) {
    const paymentId = sessionStorage.getItem("paymentId");
    const userId = sessionStorage.getItem("pendingUserId");

    if (!paymentId || !userId) {
      setPhase("failed");
      setMessage("No pending payment found. Redirecting…");
      timerRef.current = setTimeout(() => router.replace("/"), 1500);
      return;
    }

    try {
      const { status } = await api.getPaymentStatus(paymentId);

      if (status === "SUCCEEDED") {
        await api.loginAfterPayment(userId, paymentId);
        await refreshUser();
        cleanup();
        setPhase("success");
        setMessage("Payment confirmed! Redirecting to your dashboard…");
        timerRef.current = setTimeout(() => router.replace("/dashboard"), 1500);
        return;
      }

      if (status === "FAILED") {
        cleanup();
        setPhase("failed");
        setMessage("Payment was not completed. Redirecting…");
        timerRef.current = setTimeout(() => router.replace("/"), 2000);
        return;
      }

      if (attempt < MAX_ATTEMPTS) {
        setMessage(`Waiting for payment confirmation… (${attempt}/${MAX_ATTEMPTS})`);
        timerRef.current = setTimeout(() => void check(attempt + 1), POLL_INTERVAL_MS);
        return;
      }

      setPhase("timeout");
      setMessage("Payment confirmation timed out. Please retry or contact support.");
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        timerRef.current = setTimeout(() => void check(attempt + 1), POLL_INTERVAL_MS);
        return;
      }
      setPhase("timeout");
      setMessage("Could not reach the server. Please retry below.");
    }
  }, [router, refreshUser, cleanup]);

  useEffect(() => {
    void poll(1);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [poll]);

  const icon = phase === "success" ? "✓" : phase === "failed" ? "✕" : phase === "timeout" ? "!" : null;

  const iconColor = phase === "success" ? "#1D9E75" : phase === "failed" || phase === "timeout" ? "#EF4444" : "#534AB7";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "40px 16px",
        fontFamily: "'Sora', system-ui, sans-serif",
        color: "var(--page-muted)",
      }}
    >
      {phase === "checking" ? (
        <>
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid rgba(83,74,183,0.2)",
              borderTopColor: "#534AB7",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      ) : (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background:
              phase === "success"
                ? "rgba(29,158,117,0.12)"
                : "rgba(239,68,68,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            color: iconColor,
          }}
        >
          {icon}
        </div>
      )}

      <p
        style={{
          maxWidth: 440,
          textAlign: "center",
          fontSize: 15,
          fontWeight: 500,
          color: "var(--page-text)",
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}