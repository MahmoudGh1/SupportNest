"use client";

import { useState } from "react";
import { S } from "../ui";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context.tsx";
import { useRouter } from "next/navigation";

export function DangerZone() {
  const [confirm, setConfirm] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [orgInput, setOrgInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const expectedFullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const expectedorganizationName = user?.organizationName ?? "";

  const canDelete =
    nameInput.trim() === expectedFullName &&
    orgInput.trim() === expectedorganizationName &&
    expectedFullName !== "" &&
    expectedorganizationName !== "";

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    setError(null);
    try {
      await api.deleteAccount({
        fullName: nameInput.trim(),
        organizationName: orgInput.trim(),
      });
      await logout();
      router.push("/login");
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete account.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1.5px solid #FCA5A5",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        background: "#FEF2F2",
      }}
    >
      <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#DC2626" }}>
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
          <i className="ti ti-trash" style={{ fontSize: 15 }} /> Delete my account
        </button>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: "#DC2626", margin: "0 0 10px" }}>
            This cannot be undone. Type your full name (<strong>{expectedFullName}</strong>) and your organization's name (<strong>{expectedorganizationName}</strong>) to confirm.
          </p>

          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your full name"
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 7,
              border: `1px solid ${S.border}`,
              fontSize: 13,
              fontFamily: "inherit",
              marginBottom: 8,
              boxSizing: "border-box",
            }}
          />
          <input
            value={orgInput}
            onChange={(e) => setOrgInput(e.target.value)}
            placeholder="Organization name"
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 7,
              border: `1px solid ${S.border}`,
              fontSize: 13,
              fontFamily: "inherit",
              marginBottom: 10,
              boxSizing: "border-box",
            }}
          />

          {error && (
            <p style={{ fontSize: 12, color: "#DC2626", margin: "0 0 10px" }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => {
                setConfirm(false);
                setNameInput("");
                setOrgInput("");
                setError(null);
              }}
              disabled={loading}
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
              onClick={handleDelete}
              disabled={!canDelete || loading}
              style={{
                padding: "7px 14px",
                borderRadius: 7,
                border: "none",
                background: canDelete ? "#DC2626" : "#F3A6A6",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: canDelete ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}