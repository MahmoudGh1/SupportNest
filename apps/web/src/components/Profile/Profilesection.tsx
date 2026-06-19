"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { UpdateProfileInput } from "@/types/profile";
import { Section } from "./Ui";
import { Btn, Input, S } from "../ui";

export function ProfileSection() {
  const { user: authUser } = useAuth();

  const [form, setForm] = useState<UpdateProfileInput>({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authUser) return;
    setForm({
      first_name: authUser.firstName ?? "",
      last_name: authUser.lastName ?? "",
      email: authUser.email ?? "",
    });
  }, [authUser]);

  const set = (k: keyof UpdateProfileInput) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      await api.updateUserProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authUser)
    return (
      <Section title="Profile Information">
        <div
          style={{ textAlign: "center", padding: "1.5rem", color: S.textMuted }}
        >
          <i
            className="ti ti-loader-2"
            style={{ fontSize: 20, animation: "spin 1s linear infinite" }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </Section>
    );

  const initials =
    `${authUser.firstName?.[0] ?? ""}${authUser.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <Section
      title="Profile Information"
      subtitle="Update your personal details and login email."
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: `0.5px solid ${S.border}`,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: S.purple,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: S.dark }}>
            {authUser.firstName} {authUser.lastName}
          </div>
          
          {/* Email row featuring the verification badge layout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <div style={{ fontSize: 12, color: S.textMuted }}>
              {authUser.email}
            </div>
            { (console.log("authUser", authUser.isEmailVerified), null) }
            {authUser.isEmailVerified ? (
              <span
                style={{
                  background: S.greenBg,
                  color: S.green,
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <i className="ti ti-circle-check" style={{ fontSize: 11 }} />
                Verified
              </span>
            ) : (
              <span
                style={{
                  background: S.dangerBg,
                  color: S.danger,
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <i className="ti ti-alert-circle" style={{ fontSize: 11 }} />
                Not Verified
              </span>
            )}
          </div>

          <div style={{ fontSize: 11, marginTop: 4 }}>
            <span
              style={{
                background: S.purpleBg,
                color: S.purple,
                padding: "2px 8px",
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {authUser.role?.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Input
          label="First name"
          value={form.first_name}
          onChange={set("first_name")}
          placeholder="First name"
          icon="user"
        />
        <Input
          label="Last name"
          value={form.last_name}
          onChange={set("last_name")}
          placeholder="Last name"
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={set("email")}
        placeholder="you@company.com"
        icon="mail"
      />

      {error && (
        <div
          style={{
            background: "#FCEBEB",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: S.danger,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn loading={loading} onClick={handleSave}>
          {saved ? (
            <>
              <i className="ti ti-check" style={{ fontSize: 15 }} /> Saved
            </>
          ) : (
            "Save changes"
          )}
        </Btn>
      </div>
    </Section>
  );
}
