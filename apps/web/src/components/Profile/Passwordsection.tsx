"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { UpdatePasswordInput } from "@/types/types";
import { Btn, Input, S } from "../ui";
import { Section } from "./Ui";
import { Trans, useLingui } from "@lingui/react/macro";

export function PasswordSection() {
  const { t } = useLingui();
  const [form, setForm] = useState<UpdatePasswordInput>({
    current_password: "",
    new_password: "",
  });
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [show, setShow] = useState({ curr: false, next: false, conf: false });

  const toggle = (k: keyof typeof show) =>
    setShow((s) => ({ ...s, [k]: !s[k] }));
  const set = (k: keyof UpdatePasswordInput) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const strength = (() => {
    const p = form.new_password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", t`Weak`, t`Fair`, t`Good`, t`Strong`];
  const strengthColor = ["", "#E24B4A", "#EF9F27", S.green, S.green];

  const handleSave = async () => {
    setError("");
    setSuccess(false);
    if (!form.current_password) {
      setError(t`Current password is required.`);
      return;
    }
    if (form.new_password.length < 8) {
      setError(t`New password must be at least 8 characters.`);
      return;
    }
    if (form.new_password !== confirm) {
      setError(t`Passwords do not match.`);
      return;
    }
    setLoading(true);
    try {
      await api.updatePassword(form);
      setSuccess(true);
      setForm({ current_password: "", new_password: "" });
      setConfirm("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const eyeBtn = (k: keyof typeof show) => (
    <button
      type="button"
      onClick={() => toggle(k)}
      style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, display: "flex" }}
    >
      <i className={`ti ti-eye${show[k] ? "-off" : ""}`} style={{ fontSize: 17 }} />
    </button>
  );

  return (
    <Section
      title={t`Change Password`}
      subtitle={t`Use a strong password with at least 8 characters.`}
    >
      <Input
        label={t`Current password`}
        type={show.curr ? "text" : "password"}
        value={form.current_password}
        onChange={set("current_password")}
        placeholder="••••••••"
        icon="lock"
        rightEl={eyeBtn("curr")}
      />
      <Input
        label={t`New password`}
        type={show.next ? "text" : "password"}
        value={form.new_password}
        onChange={set("new_password")}
        placeholder={t`Min. 8 characters`}
        icon="lock"
        rightEl={eyeBtn("next")}
      />

      {form.new_password && (
        <div style={{ marginTop: -10, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= strength ? strengthColor[strength] : S.border,
                transition: "background .2s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: strengthColor[strength] }}>
            {strengthLabel[strength]}
          </span>
        </div>
      )}

      <Input
        label={t`Confirm new password`}
        type={show.conf ? "text" : "password"}
        value={confirm}
        onChange={setConfirm}
        placeholder={t`Repeat password`}
        icon="lock"
        rightEl={eyeBtn("conf")}
      />

      {error && (
        <div style={{
          background: "#FCEBEB",
          border: "1px solid #FCA5A5",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          color: S.danger,
          marginBottom: 12,
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          background: S.greenBg,
          border: `1px solid ${S.green}40`,
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: 13,
          color: "#0F6E56",
          marginBottom: 12,
        }}>
          <Trans>✓ Password updated successfully.</Trans>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn loading={loading} onClick={handleSave}>
          <Trans>Update password</Trans>
        </Btn>
      </div>
    </Section>
  );
}