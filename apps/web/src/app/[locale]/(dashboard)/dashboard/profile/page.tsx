"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Input, Btn, S } from "@/components/ui";
import type { UpdatePasswordInput } from "@/lib/api";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ApiKey {
  id: string;
  key_prefix: string;
  key_hash: string;
  name: string;
  allowed_origins: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  raw_key?: string;
}

interface UpdateProfileInput {
  first_name: string;
  last_name: string;
  email: string;
}

// ─── MOCK API KEY STORE ───────────────────────────────────────────────────────
let mockApiKeys: ApiKey[] = [
  {
    id: "key_1",
    key_prefix: "sn_live_a",
    key_hash: "hashed_xxxx",
    name: "Production",
    allowed_origins: ["https://acme.com", "https://app.acme.com"],
    is_active: true,
    last_used_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    created_at: "2024-01-15T10:00:00Z",
  },
];

function generateKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return "sn_live_" + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ─── REAL API KEY WRAPPER ─────────────────────────────

const apiKeyApi = {


	async getApiKeys(): Promise<ApiKey[]> {
		const res = await api.getApiKeys();
		return res as ApiKey[];
	},


	async createApiKey(name: string, origins: string[]): Promise<any> {
  return await api.createApiKey(origins)
},
	async revokeApiKey(id: string): Promise<any> {
		return await api.revokeApiKey(id);
	},

};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── SECTION WRAPPER ──────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `0.5px solid ${S.border}`, padding: "1.5rem", marginBottom: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: S.dark }}>{title}</h3>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 999,
      background: type === "success" ? S.greenBg : S.dangerBg,
      border: `1px solid ${type === "success" ? S.green : "#E24B4A"}`,
      color: type === "success" ? "#0F6E56" : S.danger,
      borderRadius: 10, padding: "12px 18px", fontSize: 13, fontWeight: 500,
      display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
      animation: "slideUp .2s ease",
    }}>
      <i className={`ti ti-${type === "success" ? "check" : "alert-circle"}`} style={{ fontSize: 16 }} />
      {msg}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", marginLeft: 8, fontSize: 16 }}>×</button>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── CREATE API KEY MODAL ─────────────────────────────────────────────────────
function CreateKeyModal({ onClose, onCreate }: { onClose: () => void; onCreate: (key: ApiKey) => void }) {
  const [name, setName]       = useState("");
  const [origins, setOrigins] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const addOrigin    = () => setOrigins(o => [...o, ""]);
  const removeOrigin = (i: number) => setOrigins(o => o.filter((_, idx) => idx !== i));
  const setOrigin    = (i: number, v: string) => setOrigins(o => o.map((x, idx) => idx === i ? v : x));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Key name is required.";
    const validOrigins = origins.filter(o => o.trim());
    if (validOrigins.length === 0) e.origins = "Add at least one allowed origin.";
    validOrigins.forEach((o, i) => {
      try { new URL(o); } catch { e[`origin_${i}`] = `Invalid URL: ${o}`; }
    });
    return e;
  };

  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const key = await apiKeyApi.createApiKey(name.trim(), origins.filter(o => o.trim()));
      onCreate(key);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,24,48,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, padding: "2rem", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: S.dark }}>Create API Key</h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>Keys are hashed — save the raw key immediately after creation.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <Input label="Key name" value={name} onChange={setName} placeholder="e.g. Production, Staging" error={errors.name} icon="tag" />
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: S.dark }}>Allowed origins</label>
            <button onClick={addOrigin} style={{ background: "none", border: "none", cursor: "pointer", color: S.purple, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              <i className="ti ti-plus" style={{ fontSize: 14 }} /> Add origin
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {origins.map((o, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <i className="ti ti-world" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: S.textMuted, fontSize: 15 }} />
                  <input
                    value={o}
                    onChange={e => { setOrigin(i, e.target.value); if (errors[`origin_${i}`]) setErrors(ev => ({ ...ev, [`origin_${i}`]: "" })); }}
                    placeholder="https://yoursite.com"
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 10px 9px 32px", fontSize: 13, border: `1.5px solid ${errors[`origin_${i}`] ? "#E24B4A" : S.border}`, borderRadius: 8, outline: "none", fontFamily: "inherit", color: S.dark, transition: "border-color .15s" }}
                    onFocus={e => (e.target.style.borderColor = S.purple)}
                    onBlur={e => (e.target.style.borderColor = errors[`origin_${i}`] ? "#E24B4A" : S.border)}
                  />
                  {errors[`origin_${i}`] && <p style={{ fontSize: 11, color: "#E24B4A", margin: "3px 0 0" }}>{errors[`origin_${i}`]}</p>}
                </div>
                {origins.length > 1 && (
                  <button onClick={() => removeOrigin(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#E24B4A", fontSize: 18, lineHeight: 1, padding: "4px" }}>
                    <i className="ti ti-trash" style={{ fontSize: 16 }} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.origins && <p style={{ fontSize: 12, color: "#E24B4A", marginTop: 6 }}>{errors.origins}</p>}
          <p style={{ fontSize: 11, color: S.textMuted, marginTop: 8 }}>Only requests from these origins will be accepted.</p>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn loading={loading} onClick={handleCreate}>
            <i className="ti ti-key" style={{ fontSize: 15 }} /> Generate key
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── KEY REVEAL MODAL ─────────────────────────────────────────────────────────
function KeyRevealModal({ apiKey, onClose }: { apiKey: ApiKey; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(apiKey.raw_key ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,24,48,0.55)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, padding: "2rem", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: S.amberBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: 22, color: "#D97706" }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: S.dark }}>Save your API key now</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: S.textMuted, lineHeight: 1.5 }}>
              This key will <strong>never be shown again</strong>. Copy it and store it securely.
            </p>
          </div>
        </div>
        <div style={{ background: S.bg, border: `1.5px solid ${S.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em" }}>{apiKey.name}</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: S.dark, wordBreak: "break-all", lineHeight: 1.6 }}>{apiKey.raw_key}</div>
        </div>
        <button onClick={copy} style={{ width: "100%", padding: "11px 0", borderRadius: 9, background: copied ? S.greenBg : S.purpleBg, border: `1.5px solid ${copied ? S.green : S.purple}`, color: copied ? "#0F6E56" : S.purple, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .15s", marginBottom: 16 }}>
          <i className={`ti ti-${copied ? "check" : "copy"}`} style={{ fontSize: 16 }} />
          {copied ? "Copied!" : "Copy to clipboard"}
        </button>
        <div style={{ background: S.bg, borderRadius: 9, padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: S.textMuted, fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".06em" }}>Allowed origins</div>
          {apiKey.allowed_origins.map(o => (
            <div key={o} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: S.green }} />
              <span style={{ fontSize: 12, color: S.dark, fontFamily: "monospace" }}>{o}</span>
            </div>
          ))}
        </div>
        <Btn fullWidth onClick={onClose} variant="outline">I&apos;ve saved my key — close</Btn>
      </div>
    </div>
  );
}

// ─── API KEYS SECTION ─────────────────────────────────────────────────────────
function ApiKeysSection() {
  const [keys, setKeys]             = useState<ApiKey[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey]         = useState<ApiKey | null>(null);
  const [revoking, setRevoking]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    apiKeyApi.getApiKeys().then(setKeys).finally(() => setLoading(false));
  }, []);

  const handleCreated = (key: ApiKey) => { setKeys(k => [key, ...k]); setShowCreate(false); setNewKey(key); };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try { await apiKeyApi.revokeApiKey(id); setKeys(k => k.map(x => x.id === id ? { ...x, is_active: false } : x)); setToast({ msg: "API key revoked", type: "success" }); }
    catch { setToast({ msg: "Failed to revoke key", type: "error" }); }
    finally { setRevoking(null); }
  };

  // const handleDelete = async (id: string) => {
  //   setDeleting(id);
  //   try { await apiKeyApi.deleteApiKey(id); setKeys(k => k.filter(x => x.id !== id)); setToast({ msg: "API key deleted", type: "success" }); }
  //   catch { setToast({ msg: "Failed to delete key", type: "error" }); }
  //   finally { setDeleting(null); }
  // };

  return (
    <>
      <Section title="API Keys" subtitle="Keys authenticate your embeddable widget. Never expose them client-side outside the widget.">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: keys.length ? 16 : 0 }}>
          <Btn onClick={() => setShowCreate(true)} size="sm"><i className="ti ti-plus" style={{ fontSize: 15 }} /> Create API key</Btn>
        </div>
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem", color: S.textMuted }}>
            <i className="ti ti-loader-2" style={{ fontSize: 20, animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {!loading && keys.length === 0 && (
          <div style={{ textAlign: "center", padding: "2.5rem", color: S.textMuted }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: S.purpleBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <i className="ti ti-key" style={{ fontSize: 26, color: S.purple }} />
            </div>
            <p style={{ margin: 0, fontSize: 13 }}>No API keys yet. Create one to get started.</p>
          </div>
        )}
        {!loading && keys.map((key, i) => (
          <div key={key.id} style={{ border: `0.5px solid ${S.border}`, borderRadius: 10, padding: "1rem 1.1rem", marginBottom: i < keys.length - 1 ? 10 : 0, background: key.is_active ? "#fff" : S.bg, opacity: key.is_active ? 1 : 0.65 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: S.dark }}>{key.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: key.is_active ? S.greenBg : S.bg, color: key.is_active ? "#0F6E56" : S.textMuted, border: `1px solid ${key.is_active ? S.green + "40" : S.border}` }}>
                    {key.is_active ? "Active" : "Revoked"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <code style={{ fontFamily: "monospace", fontSize: 12, color: S.textSecondary, background: S.bg, padding: "3px 8px", borderRadius: 5, border: `0.5px solid ${S.border}` }}>
                    {key.key_prefix}••••••••••••••••••••••••
                  </code>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                  {key.allowed_origins.map(o => (
                    <span key={o} style={{ fontSize: 11, background: S.purpleBg, color: S.purple, padding: "2px 8px", borderRadius: 5, fontFamily: "monospace" }}>{o}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ fontSize: 11, color: S.textMuted }}><i className="ti ti-calendar" style={{ fontSize: 11, marginRight: 3 }} />Created {fmtDate(key.created_at)}</span>
                  <span style={{ fontSize: 11, color: S.textMuted }}><i className="ti ti-clock" style={{ fontSize: 11, marginRight: 3 }} />Last used: {timeAgo(key.last_used_at)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {key.is_active && (
                  <button onClick={() => handleRevoke(key.id)} disabled={revoking === key.id}
                    style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${S.border}`, background: "#fff", color: S.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, opacity: revoking === key.id ? 0.6 : 1 }}>
                    {revoking === key.id ? <i className="ti ti-loader-2" style={{ fontSize: 13, animation: "spin 1s linear infinite" }} /> : <i className="ti ti-ban" style={{ fontSize: 13 }} />}
                    Revoke
                  </button>
                )}
                <button onClick={() => handleDelete(key.id)} disabled={deleting === key.id}
                  style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, opacity: deleting === key.id ? 0.6 : 1 }}>
                  {deleting === key.id ? <i className="ti ti-loader-2" style={{ fontSize: 13, animation: "spin 1s linear infinite" }} /> : <i className="ti ti-trash" style={{ fontSize: 13 }} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </Section>
      {showCreate && <CreateKeyModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />}
      {newKey     && <KeyRevealModal apiKey={newKey} onClose={() => setNewKey(null)} />}
      {toast      && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

// ─── PROFILE SECTION — reads from real auth context ───────────────────────────
function ProfileSection() {
  const { user: authUser } = useAuth()  // ← real logged-in user

  const [form, setForm] = useState<UpdateProfileInput>({
    first_name: "",
    last_name:  "",
    email:      "",
  })
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState("")

  // Pre-fill form with real user data as soon as auth loads
  useEffect(() => {
    if (!authUser) return
    setForm({
      // AuthUser uses camelCase (firstName) — map to snake_case for the form
      first_name: authUser.firstName ?? "",
      last_name:  authUser.lastName  ?? "",
      email:      authUser.email     ?? "",
    })
  }, [authUser])

  const set = (k: keyof UpdateProfileInput) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setLoading(true); setError(""); setSaved(false)
    try {
      await api.updateUserProfile(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!authUser) return (
    <Section title="Profile Information">
      <div style={{ textAlign: "center", padding: "1.5rem", color: S.textMuted }}>
        <i className="ti ti-loader-2" style={{ fontSize: 20, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Section>
  )

  const initials = `${authUser.firstName?.[0] ?? ""}${authUser.lastName?.[0] ?? ""}`.toUpperCase()

  return (
    <Section title="Profile Information" subtitle="Update your personal details and login email.">
      {/* Avatar row — shows real user name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: `0.5px solid ${S.border}` }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: S.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: S.dark }}>{authUser.firstName} {authUser.lastName}</div>
          <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{authUser.email}</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            <span style={{ background: S.purpleBg, color: S.purple, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600 }}>
              {authUser.role?.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Form — pre-filled with real user data */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Input label="First name" value={form.first_name} onChange={set("first_name")} placeholder="First name" icon="user" />
        <Input label="Last name"  value={form.last_name}  onChange={set("last_name")}  placeholder="Last name" />
      </div>
      <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" icon="mail" />

      {error && (
        <div style={{ background: "#FCEBEB", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: S.danger, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn loading={loading} onClick={handleSave}>
          {saved ? <><i className="ti ti-check" style={{ fontSize: 15 }} /> Saved</> : "Save changes"}
        </Btn>
      </div>
    </Section>
  )
}

// ─── CHANGE PASSWORD SECTION ──────────────────────────────────────────────────
function PasswordSection() {
  const [form, setForm]       = useState<UpdatePasswordInput>({ current_password: "", new_password: "" })
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState(false)
  const [show, setShow]       = useState({ curr: false, next: false, conf: false })

  const toggle = (k: keyof typeof show) => setShow(s => ({ ...s, [k]: !s[k] }))
  const set    = (k: keyof UpdatePasswordInput) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const strength = (() => {
    const p = form.new_password; if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"]
  const strengthColor = ["", "#E24B4A", "#EF9F27", S.green, S.green]

  const handleSave = async () => {
    setError(""); setSuccess(false)
    if (!form.current_password) { setError("Current password is required."); return }
    if (form.new_password.length < 8) { setError("New password must be at least 8 characters."); return }
    if (form.new_password !== confirm) { setError("Passwords do not match."); return }
    setLoading(true)
    try {
      await api.updatePassword(form)
      setSuccess(true)
      setForm({ current_password: "", new_password: "" })
      setConfirm("")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const eyeBtn = (k: keyof typeof show) => (
    <button type="button" onClick={() => toggle(k)} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted, display: "flex" }}>
      <i className={`ti ti-eye${show[k] ? "-off" : ""}`} style={{ fontSize: 17 }} />
    </button>
  )

  return (
    <Section title="Change Password" subtitle="Use a strong password with at least 8 characters.">
      <Input label="Current password" type={show.curr ? "text" : "password"} value={form.current_password} onChange={set("current_password")} placeholder="••••••••" icon="lock" rightEl={eyeBtn("curr")} />
      <Input label="New password" type={show.next ? "text" : "password"} value={form.new_password} onChange={set("new_password")} placeholder="Min. 8 characters" icon="lock" rightEl={eyeBtn("next")} />
      {form.new_password && (
        <div style={{ marginTop: -10, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor[strength] : S.border, transition: "background .2s" }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
        </div>
      )}
      <Input label="Confirm new password" type={show.conf ? "text" : "password"} value={confirm} onChange={setConfirm} placeholder="Repeat password" icon="lock" rightEl={eyeBtn("conf")} />
      {error   && <div style={{ background: "#FCEBEB", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: S.danger, marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: S.greenBg, border: `1px solid ${S.green}40`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#0F6E56", marginBottom: 12 }}>✓ Password updated successfully.</div>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn loading={loading} onClick={handleSave}>Update password</Btn>
      </div>
    </Section>
  )
}

// ─── DANGER ZONE ──────────────────────────────────────────────────────────────
function DangerZone() {
  const [confirm, setConfirm] = useState(false)
  return (
    <div style={{ border: "1.5px solid #FCA5A5", borderRadius: 12, padding: "1.25rem 1.5rem", background: "#FEF2F2" }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#DC2626" }}>Danger zone</h3>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "#888" }}>Irreversible actions. Proceed with caution.</p>
      {!confirm ? (
        <button onClick={() => setConfirm(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #E24B4A", background: "#fff", color: "#DC2626", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-trash" style={{ fontSize: 15 }} /> Delete my account
        </button>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#DC2626" }}>Are you sure? This cannot be undone.</span>
          <button onClick={() => setConfirm(false)} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${S.border}`, background: "#fff", color: S.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete account</button>
        </div>
      )}
    </div>
  )
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [tab, setTab] = useState<"profile" | "apikeys">("profile")

  const tabStyle = (t: typeof tab) => ({
    padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: "pointer", border: "none", fontFamily: "inherit",
    background: tab === t ? S.purple : "transparent",
    color:      tab === t ? "#fff"    : S.textMuted,
    transition: "all .15s",
  })

  return (
    <div style={{ padding: "1.5rem", overflowY: "auto", maxWidth: 780, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: S.dark }}>Profile & API Keys</h2>
        <p style={{ margin: 0, fontSize: 13, color: S.textMuted }}>Manage your account details and widget authentication keys.</p>
      </div>

      <div style={{ display: "inline-flex", gap: 4, background: S.bg, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 4, marginBottom: 24 }}>
        <button style={tabStyle("profile")} onClick={() => setTab("profile")}>
          <i className="ti ti-user" style={{ fontSize: 14, marginRight: 6 }} />Profile
        </button>
        <button style={tabStyle("apikeys")} onClick={() => setTab("apikeys")}>
          <i className="ti ti-key" style={{ fontSize: 14, marginRight: 6 }} />API Keys
        </button>
      </div>

      {tab === "profile" && (
        <>
          <ProfileSection />
          <PasswordSection />
          <DangerZone />
        </>
      )}

      {tab === "apikeys" && (
        <>
          <ApiKeysSection />
          <Section title="Widget embed snippet" subtitle="Paste this in the <head> of your website.">
            <div style={{ background: "#1a1830", borderRadius: 10, padding: "1rem 1.25rem" }}>
              <code style={{ fontFamily: "monospace", fontSize: 12, color: "#AFA9EC", lineHeight: 1.8, whiteSpace: "pre-wrap", display: "block" }}>
{`<script>
  window.SupportNestConfig = {
    apiKey: "sn_live_YOUR_KEY_HERE",
    // color: "#534AB7",
    // position: "bottom-right",
  };
</script>
<script
  src="https://cdn.supportnest.ai/widget.js"
  async
></script>`}
              </code>
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
