import { useEffect } from "react";
import { S } from "../ui";

// ─── SECTION WRAPPER ──────────────────────────────────────────────────────────
export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        border: `0.5px solid ${S.border}`,
        padding: "1.5rem",
        marginBottom: 16,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: S.dark }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
export function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 999,
        background: type === "success" ? S.greenBg : S.dangerBg,
        border: `1px solid ${type === "success" ? S.green : "#E24B4A"}`,
        color: type === "success" ? "#0F6E56" : S.danger,
        borderRadius: 10,
        padding: "12px 18px",
        fontSize: 13,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        animation: "slideUp .2s ease",
      }}
    >
      <i
        className={`ti ti-${type === "success" ? "check" : "alert-circle"}`}
        style={{ fontSize: 16 }}
      />
      {msg}
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          marginLeft: 8,
          fontSize: 16,
        }}
      >
        ×
      </button>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
