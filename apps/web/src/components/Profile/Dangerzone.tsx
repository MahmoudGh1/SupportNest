"use client";

import { useState } from "react";
import { S } from "../ui";

export function DangerZone() {
  const [confirm, setConfirm] = useState(false);

  return (
    <div
      style={{
        border: "1.5px solid #FCA5A5",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        background: "#FEF2F2",
      }}
    >
      <h3
        style={{
          margin: "0 0 4px",
          fontSize: 14,
          fontWeight: 600,
          color: "#DC2626",
        }}
      >
        Danger zone
      </h3>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "#888" }}>
        Irreversible actions. Proceed with caution.
      </p>

      {!confirm ? (
        <button
          onClick={() => setConfirm(true)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1.5px solid #E24B4A",
            background: "#fff",
            color: "#DC2626",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="ti ti-trash" style={{ fontSize: 15 }} /> Delete my
          account
        </button>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#DC2626" }}>
            Are you sure? This cannot be undone.
          </span>
          <button
            onClick={() => setConfirm(false)}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: `1px solid ${S.border}`,
              background: "#fff",
              color: S.textSecondary,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "none",
              background: "#DC2626",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Delete account
          </button>
        </div>
      )}
    </div>
  );
}
