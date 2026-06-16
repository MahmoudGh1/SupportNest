"use client";

import { useEffect, useState, useRef } from "react";
import { OrgProfile, WidgetConfig } from "@/types/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

// ─── THEME TOKENS ─────────────────────────────────────────────────────────────
const T = {
  surface: "var(--surface,    #ffffff)",
  surfaceSub: "var(#27006a2b,#f9f8ff)",
  pageBg: "var(--page-bg,    #f4f3fb)",
  brandFaint: "var(--color-brand-faint, #eeecfb)",
  text: "var(--page-text,  #1a1830)",
  muted: "var(--page-muted, #6b6a80)",
  brand: "var(--color-brand,       #534AB7)",
  brandLight: "var(--color-brand-light, #7F77DD)",
  danger: "var(--color-danger,  #E24B4A)",
  success: "var(--color-success, #0F6E56)",
  border: "var(--card-border,   rgba(0,0,0,0.09))",
} as const;

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const fieldBase = (focused: boolean, error?: string): React.CSSProperties => ({
  width: "100%",
  boxSizing: "border-box",
  height: 40,
  padding: "0 12px",
  border: `1.5px solid ${error ? T.danger : focused ? T.brand : T.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  color: T.text,
  outline: "none",
  background: T.surface,
  transition: "border-color .15s",
});

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 500,
          color: T.text,
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...fieldBase(focused, error),
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {error && (
        <p style={{ fontSize: 11, color: T.danger, margin: "4px 0 0" }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p style={{ fontSize: 11, color: T.muted, margin: "4px 0 0" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SaveBtn({
  loading,
  onClick,
  label = "Save changes",
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        height: 38,
        padding: "0 20px",
        background: loading ? T.brandLight : T.brand,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: loading ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        transition: "background .15s",
      }}
    >
      {loading ? (
        <>
          <i
            className="ti ti-loader-2"
            style={{ fontSize: 14, animation: "spin 1s linear infinite" }}
          />
          Saving…
        </>
      ) : (
        <>
          <i className="ti ti-check" style={{ fontSize: 14 }} />
          {label}
        </>
      )}
    </button>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: T.surface,
        border: `0.5px solid ${T.border}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: `0.5px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: T.surface,
        }}
      >
        <i
          className={`ti ti-${icon}`}
          style={{ fontSize: 17, color: T.brand }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "20px", background: T.surface }}>{children}</div>
    </div>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  const isError = message.startsWith("Error:");
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        background: T.text,
        color: "#fff",
        fontSize: 13,
        padding: "10px 16px",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        animation: "fadeIn .2s ease",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <i
        className={`ti ti-${isError ? "alert-circle" : "check"}`}
        style={{ fontSize: 15, color: isError ? T.danger : T.success }}
      />
      {message}
    </div>
  );
}

// ─── TAB: ORGANIZATION ────────────────────────────────────────────────────────
function OrgTab({ org }: { org: OrgProfile }) {
  const [name, setName] = useState(org.name);
  const [email, setEmail] = useState(org.email);
  const [widget, setWidget] = useState<WidgetConfig>({ ...org.widget_config });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const colorRef = useRef<HTMLInputElement>(null);

  const setW = (k: keyof WidgetConfig) => (v: string) =>
    setWidget((w) => ({ ...w, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Organization name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
    if (!widget.greeting.trim()) e.greeting = "Greeting message is required.";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const [orgResult, widgetResult] = await Promise.all([
        api.updateOrgProfile({ name, email }),
        api.updateWidgetConfig({
          title: widget.title ?? "Support",
          greetingMessage: widget.greeting,
          accentColor: widget.color,
          placeholder: "Type a message...",
        }),
      ]);
      const merged = {
        ...orgResult.organization,
        widget_config: widgetResult.organization.widget_config,
      };
      setName(merged.name);
      setEmail(merged.email);
      setWidget(merged.widget_config);
      setToast("Organization settings saved.");
    } catch (err) {
      setToast(
        err instanceof Error
          ? "Error: " + err.message
          : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  const previewBg = widget.color;

  const SWATCHES = [
    "#534AB7",
    "#0F6E56",
    "#854F0B",
    "#A32D2D",
    "#185FA5",
    "#1a1830",
  ];

  return (
    <>
      {/* ── General ── */}
      <SectionCard title="General" icon="building">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <Field
            label="Organization Name"
            value={name}
            onChange={setName}
            placeholder="Acme Corp"
            error={errors.name}
          />
          <Field
            label="Support Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="support@company.com"
            error={errors.email}
          />
        </div>
        <Field
          label="Slug"
          value={org.slug}
          disabled
          hint="URL-safe identifier — contact support to change."
        />
      </SectionCard>

      {/* ── Widget Configuration ── */}
      <SectionCard title="Widget Configuration" icon="message-chatbot">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 24,
          }}
        >
          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Color picker */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: T.text,
                  marginBottom: 8,
                }}
              >
                Widget Color
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {/* Swatch trigger */}
                <div
                  onClick={() => colorRef.current?.click()}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: widget.color,
                    cursor: "pointer",
                    border: `2px solid ${T.border}`,
                    flexShrink: 0,
                    transition: "background .15s",
                  }}
                />
                <input
                  ref={colorRef}
                  type="color"
                  value={widget.color}
                  onChange={(e) => setW("color")(e.target.value)}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                    width: 0,
                    height: 0,
                  }}
                />
                {/* Hex input */}
                <input
                  value={widget.color}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setW("color")(v);
                  }}
                  placeholder="#534AB7"
                  style={{
                    width: 110,
                    height: 40,
                    padding: "0 12px",
                    border: `1.5px solid ${T.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: T.text,
                    outline: "none",
                    background: T.surfaceSub,
                  }}
                />
                {/* Preset swatches */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {SWATCHES.map((c) => (
                    <div
                      key={c}
                      onClick={() => setW("color")(c)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        background: c,
                        cursor: "pointer",
                        border: `2px solid ${widget.color === c ? T.text : "transparent"}`,
                        transition: "border .1s",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Widget title */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: T.text,
                  marginBottom: 5,
                }}
              >
                Widget Title
                <span
                  style={{ color: T.muted, fontWeight: 400, marginLeft: 6 }}
                >
                  ({(widget.title ?? "").length}/30)
                </span>
              </label>
              <input
                type="text"
                value={widget.title ?? ""}
                onChange={(e) => {
                  if (e.target.value.length <= 30)
                    setW("title")(e.target.value);
                }}
                placeholder="e.g. Support"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: `1.5px solid ${errors.title ? T.danger : T.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "inherit",
                  color: T.text,
                  outline: "none",
                  background: T.surfaceSub,
                  transition: "border-color .15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = T.brand)}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.title
                    ? T.danger
                    : T.border)
                }
              />
              {errors.title && (
                <p style={{ fontSize: 11, color: T.danger, margin: "4px 0 0" }}>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Greeting */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: T.text,
                  marginBottom: 5,
                }}
              >
                Greeting Message
                <span
                  style={{ color: T.muted, fontWeight: 400, marginLeft: 6 }}
                >
                  ({widget.greeting.length}/120)
                </span>
              </label>
              <textarea
                value={widget.greeting}
                rows={3}
                onChange={(e) => {
                  if (e.target.value.length <= 120)
                    setW("greeting")(e.target.value);
                }}
                placeholder="Hi! How can we help you today?"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: `1.5px solid ${errors.greeting ? T.danger : T.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "inherit",
                  color: T.text,
                  outline: "none",
                  background: T.surfaceSub,
                  resize: "none",
                  transition: "border-color .15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = T.brand)}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.greeting
                    ? T.danger
                    : T.border)
                }
              />
              {errors.greeting && (
                <p style={{ fontSize: 11, color: T.danger, margin: "4px 0 0" }}>
                  {errors.greeting}
                </p>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: T.text,
                marginBottom: 8,
              }}
            >
              Live Preview
            </label>
            <div
              style={{
                background: T.brandFaint,
                borderRadius: 12,
                padding: 16,
                height: 280,
                position: "relative",
                overflow: "hidden",
                border: `0.5px solid ${T.border}`,
              }}
            >
              {/* Fake browser chrome */}
              <div
                style={{
                  background: T.surface,
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 11,
                  color: T.muted,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: `0.5px solid ${T.border}`,
                }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  {["#F87171", "#FBBF24", "#34D399"].map((c) => (
                    <div
                      key={c}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: c,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    flex: 1,
                    background: T.brandFaint,
                    borderRadius: 4,
                    padding: "3px 8px",
                    fontSize: 10,
                    color: T.muted,
                  }}
                >
                  yoursite.com
                </div>
              </div>

              {/* Widget bubble */}
              <div style={{ position: "absolute", bottom: 16, right: 16 }}>
                {/* Chat window */}
                <div
                  style={{
                    background: T.surface,
                    borderRadius: 12,
                    width: 190,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    marginBottom: 10,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ background: previewBg, padding: "10px 12px" }}>
                    <div
                      style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}
                    >
                      {widget.title ?? "Support"}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.7)",
                        marginTop: 2,
                      }}
                    >
                      We typically reply instantly
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", background: T.surface }}>
                    <div
                      style={{
                        background: T.brandFaint,
                        borderRadius: "0 8px 8px 8px",
                        padding: "8px 10px",
                        fontSize: 11,
                        color: T.text,
                        lineHeight: 1.4,
                      }}
                    >
                      {widget.greeting || "Hi! How can we help?"}
                    </div>
                  </div>
                  <div
                    style={{ padding: "0 10px 10px", background: T.surface }}
                  >
                    <div
                      style={{
                        border: `1px solid ${T.border}`,
                        borderRadius: 20,
                        padding: "5px 10px",
                        fontSize: 10,
                        color: T.muted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Type a message…</span>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: previewBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <i
                          className="ti ti-send"
                          style={{ fontSize: 9, color: "#fff" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* FAB */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: previewBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    marginLeft: "auto",
                    cursor: "pointer",
                  }}
                >
                  <i
                    className="ti ti-message-2"
                    style={{ fontSize: 18, color: "#fff" }}
                  />
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: T.muted, margin: "8px 0 0" }}>
              Preview updates as you change settings.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 20,
            paddingTop: 16,
            borderTop: `0.5px solid ${T.border}`,
          }}
        >
          <SaveBtn
            loading={loading}
            onClick={handleSave}
            label="Save organization settings"
          />
        </div>
      </SectionCard>

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type Tab = "organization";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("organization");
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      setLoading(false);
      return;
    }
    api
      .getOrgProfile()
      .then((o) => setOrg(o.organization))
      .catch((err) => console.error("Failed to load org profile:", err))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: T.muted,
        }}
      >
        <i
          className="ti ti-loader-2"
          style={{ fontSize: 24, animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "organization", label: "Organization", icon: "building" },
  ];

  return (
    <>
      <style>{`
				@keyframes spin   { to { transform: rotate(360deg) } }
				@keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
			`}</style>

      <div style={{ padding: "1.5rem", maxWidth: 860, margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: T.text,
              margin: "0 0 4px",
            }}
          >
            Settings
          </h1>
          <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
            Manage your organization details and widget configuration.
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: T.brandFaint,
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
            width: "fit-content",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "7px 16px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 500,
                background: tab === t.key ? T.surface : "transparent",
                color: tab === t.key ? T.text : T.muted,
                boxShadow:
                  tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 7,
                transition: "all .15s",
              }}
            >
              <i
                className={`ti ti-${t.icon}`}
                style={{
                  fontSize: 15,
                  color: tab === t.key ? T.brand : T.muted,
                }}
              />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ animation: "fadeIn .2s ease" }} key={tab}>
          {tab === "organization" && org && <OrgTab org={org} />}
        </div>
      </div>
    </>
  );
}
