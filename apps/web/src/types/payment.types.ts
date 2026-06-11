// ── Design tokens ──────────────────────────────────────────────────────────────
export const T = {
  white: "#FFFFFF",
  violet: "#534AB7",
  violetHover: "#6259D0",
  violetMuted: "rgba(83,74,183,0.15)",
  darkBg: "#141414",
  darkSurface: "#1E1E1E",
  darkSurface2: "#252525",
  darkBorder: "rgba(255,255,255,0.08)",
  darkBorder2: "rgba(255,255,255,0.12)",
  darkBorder3: "rgba(255,255,255,0.18)",
  gray300: "rgba(255,255,255,0.55)",
  gray500: "rgba(255,255,255,0.30)",
  gray200: "rgba(255,255,255,0.75)",
  errorText: "#f87171",
  successText: "#4ade80",
  successBg: "rgba(74,222,128,0.08)",
  successBorder: "rgba(74,222,128,0.2)",
  radius: "10px",
  radiusLg: "14px",
  radiusXl: "18px",
  font: "'Sora', system-ui, sans-serif",
} as const;

// ── Shared input / label styles ────────────────────────────────────────────────
export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: T.darkSurface2,
  border: `1.5px solid ${T.darkBorder2}`,
  borderRadius: T.radius,
  color: T.white,
  fontSize: 14,
  fontFamily: T.font,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s",
};

export const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: T.gray300,
  marginBottom: 6,
  display: "block",
};

export const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: T.errorText,
  marginTop: 4,
};

// ── Types ──────────────────────────────────────────────────────────────────────
export type PaymentMethod =
  | "mastercard"
  | "visa"
  | "vodafone"
  | "instapay"
  | "fawry";
export type PaymentStep = "method" | "details" | "processing" | "success";

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  industry: string;
  size: string;
  phone: string;
}

// ── Payment method config ──────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  {
    id: "mastercard" as PaymentMethod,
    label: "Mastercard",
    sub: "Credit or debit card",
  },
  {
    id: "visa" as PaymentMethod,
    label: "Visa",
    sub: "Credit or debit card",
  },
  {
    id: "vodafone" as PaymentMethod,
    label: "Vodafone Cash",
    sub: "Pay from your Vodafone wallet",
  },
  {
    id: "instapay" as PaymentMethod,
    label: "InstaPay",
    sub: "Egyptian instant bank transfer",
  },
  {
    id: "fawry" as PaymentMethod,
    label: "Fawry",
    sub: "Pay at any Fawry outlet",
  },
] as const;

// ── Format helpers ─────────────────────────────────────────────────────────────
export function formatCard(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
export function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}
export function formatPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11);
}
