"use client";

import { useState, useEffect } from "react";
import { S } from "@/components/ui";
import { getWidgetKey } from "@/lib/api/apiKeys"; // adjust path as needed

function maskSecret(secret: string, visibleChars = 9, maskLength = 32) {
  if (!secret) return "";
  return secret.slice(0, visibleChars) + "•".repeat(maskLength);
}

export function WidgetSecretLine() {
  const [secret, setSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    getWidgetKey()
      .then(setSecret)
      .catch(() => setLoadError(true));
  }, []);

  const copy = async () => {
    if (!secret) return; // nothing loaded yet, or load failed — don't attempt

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(secret);
      } else {
        const ta = document.createElement("textarea");
        ta.value = secret;
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("execCommand failed");
      }
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: S.bg,
    border: `1px solid ${S.border}`,
    borderRadius: 10,
    padding: "10px 14px",
  } as const;

  if (loadError) {
    return (
      <div style={rowStyle}>
        <span style={{ fontSize: 13, color: S.danger }}>
          Failed to load widget secret
        </span>
      </div>
    );
  }

  if (!secret) {
    return (
      <div style={rowStyle}>
        <span style={{ fontSize: 13, color: S.dark, opacity: 0.5 }}>
          Loading…
        </span>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <code
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          color: S.dark,
          letterSpacing: "0.5px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {maskSecret(secret)}
      </code>

      <button
        onClick={copy}
        title="Copy widget secret"
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
          fontWeight: 500,
          color: copyError ? S.danger : copied ? S.green : S.purple,
          padding: "4px 6px",
        }}
      >
        <i
          className={`ti ti-${copied ? "check" : copyError ? "alert-circle" : "copy"}`}
          style={{ fontSize: 15 }}
        />
        {copied ? "Copied" : copyError ? "Failed" : "Copy"}
      </button>
    </div>
  );
}
