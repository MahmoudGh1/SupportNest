"use client";

import { useState } from "react";
import {
  T,
  inputStyle,
  labelStyle,
  errorStyle,
  formatCard,
  formatExpiry,
} from "@/types/payment.types";
import type { PaymentMethod, RegistrationData } from "@/types/payment.types";

interface Props {
  method: PaymentMethod;
  loading: boolean;
  registrationData: RegistrationData;
  onPay: (cardData: {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
  }) => void;
}

export function CardForm({ method, loading, registrationData, onPay }: Props) {
  const defaultName =
    `${registrationData.firstName} ${registrationData.lastName}`.toUpperCase();
  const [card, setCard] = useState({
    number: "",
    name: defaultName,
    expiry: "",
    cvv: "",
  });
  const [flip, setFlip] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (card.number.replace(/\s/g, "").length < 16)
      e.number = "Enter a valid 16-digit number";
    if (!card.name.trim()) e.name = "Cardholder name is required";
    if (card.expiry.length < 5) e.expiry = "Enter valid expiry MM/YY";
    if (card.cvv.length < 3) e.cvv = "CVV must be 3–4 digits";
    return e;
  };

  const handlePay = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onPay(card);
  };

  const digits = card.number || "•••• •••• •••• ••••";
  const holder = card.name || "FULL NAME";
  const exp = card.expiry || "MM/YY";

  return (
    <div>
      {/* Animated card preview */}
      <div style={{ perspective: 800, marginBottom: 24 }}>
        <div
          style={{
            width: "100%",
            height: 170,
            position: "relative",
            transformStyle: "preserve-3d",
            transform: flip ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform .5s ease",
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              borderRadius: 14,
              background: "linear-gradient(135deg, #1a1830 0%, #534AB7 100%)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 16px 48px rgba(83,74,183,0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: 4 }}>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.3)",
                    }}
                  />
                ))}
              </div>
              {method === "mastercard" && (
                <div style={{ display: "flex" }}>
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "#EB001B",
                      opacity: 0.9,
                    }}
                  />
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "#F79E1B",
                      opacity: 0.9,
                      marginLeft: -9,
                    }}
                  />
                </div>
              )}
              {method === "visa" && (
                <span
                  style={{
                    color: "white",
                    fontWeight: 900,
                    fontSize: 16,
                    fontStyle: "italic",
                    fontFamily: "serif",
                  }}
                >
                  VISA
                </span>
              )}
            </div>
            <div
              style={{
                width: 36,
                height: 26,
                borderRadius: 4,
                background: "linear-gradient(135deg, #d4af37, #f0e68c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 18,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.15)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  padding: 2,
                }}
              >
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    style={{ background: "rgba(0,0,0,0.1)", borderRadius: 1 }}
                  />
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  marginBottom: 4,
                }}
              >
                CARD NUMBER
              </div>
              <div
                style={{
                  color: "white",
                  fontSize: 15,
                  letterSpacing: "0.2em",
                  fontFamily: "monospace",
                  fontWeight: 500,
                }}
              >
                {digits}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    marginBottom: 3,
                  }}
                >
                  CARDHOLDER
                </div>
                <div
                  style={{
                    color: "white",
                    fontSize: 12,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {holder}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    marginBottom: 3,
                  }}
                >
                  EXPIRES
                </div>
                <div style={{ color: "white", fontSize: 12, fontWeight: 500 }}>
                  {exp}
                </div>
              </div>
            </div>
          </div>
          {/* Back */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: 14,
              background: "linear-gradient(135deg, #2d2b4e 0%, #1a1830 100%)",
              overflow: "hidden",
              boxShadow: "0 16px 48px rgba(83,74,183,0.4)",
            }}
          >
            <div
              style={{
                height: 40,
                background: "rgba(0,0,0,0.5)",
                margin: "22px 0 18px",
              }}
            />
            <div style={{ padding: "0 24px" }}>
              <div
                style={{
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  marginBottom: 6,
                }}
              >
                CVV
              </div>
              <div
                style={{
                  background: T.darkSurface2,
                  borderRadius: 6,
                  padding: "8px 12px",
                  textAlign: "right",
                  fontFamily: "monospace",
                  fontSize: 15,
                  letterSpacing: "0.3em",
                  color: T.white,
                }}
              >
                {card.cvv ? "•".repeat(card.cvv.length) : "•••"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Card number</label>
          <input
            value={card.number}
            onChange={(e) =>
              setCard((c) => ({ ...c, number: formatCard(e.target.value) }))
            }
            placeholder="1234 5678 9012 3456"
            style={{
              ...inputStyle,
              ...(errors.number ? { borderColor: T.errorText } : {}),
            }}
          />
          {errors.number && <p style={errorStyle}>{errors.number}</p>}
        </div>
        <div>
          <label style={labelStyle}>Cardholder name</label>
          <input
            value={card.name}
            onChange={(e) =>
              setCard((c) => ({ ...c, name: e.target.value.toUpperCase() }))
            }
            placeholder="FULL NAME"
            style={{
              ...inputStyle,
              ...(errors.name ? { borderColor: T.errorText } : {}),
            }}
          />
          {errors.name && <p style={errorStyle}>{errors.name}</p>}
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <label style={labelStyle}>Expiry date</label>
            <input
              value={card.expiry}
              onChange={(e) =>
                setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))
              }
              placeholder="MM/YY"
              style={{
                ...inputStyle,
                ...(errors.expiry ? { borderColor: T.errorText } : {}),
              }}
            />
            {errors.expiry && <p style={errorStyle}>{errors.expiry}</p>}
          </div>
          <div>
            <label style={labelStyle}>CVV</label>
            <input
              value={card.cvv}
              onChange={(e) =>
                setCard((c) => ({
                  ...c,
                  cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                }))
              }
              onFocus={() => setFlip(true)}
              onBlur={() => setFlip(false)}
              placeholder="•••"
              style={{
                ...inputStyle,
                ...(errors.cvv ? { borderColor: T.errorText } : {}),
              }}
            />
            {errors.cvv && <p style={errorStyle}>{errors.cvv}</p>}
          </div>
        </div>
      </div>

      <button
        onClick={handlePay}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "13px",
          background: loading ? "rgba(83,74,183,0.6)" : T.violet,
          color: T.white,
          border: "none",
          borderRadius: T.radius,
          fontSize: 15,
          fontWeight: 600,
          fontFamily: T.font,
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "background .15s",
        }}
      >
        {loading ? "Processing…" : "🔒 Pay now"}
      </button>
      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          color: T.gray500,
          marginTop: 10,
        }}
      >
        256-bit SSL encrypted · PCI DSS compliant
      </p>
    </div>
  );
}
