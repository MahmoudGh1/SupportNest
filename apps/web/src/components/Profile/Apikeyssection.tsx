"use client";

import { ApiKey } from "@/types/profile.js";
import { useEffect, useState } from "react";
import { Section, Toast } from "./Ui";
import { Btn, S } from "../ui";
import { fmtDate, timeAgo } from "@/app/[locale]/utils/profile";
import { CreateKeyModal, KeyRevealModal } from "./Apikeymodals";
import { api } from "@/lib/api";

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const loadKeys = async () => {
      setLoading(true);
      try {
        const data = await api.getApiKeys();
        setKeys(data);
      } catch (error: any) {
        setToast({
          msg: error.message ?? "Failed to load API keys",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadKeys();
  }, []);

  const handleCreated = (key: ApiKey) => {
    setKeys((k) => [key, ...k]);
    setShowCreate(false);
    setNewKey(key); // ← just set it directly
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await api.revokeApiKey(id);
      setKeys((k) =>
        k.map((x) => (x.id === id ? { ...x, is_active: false } : x)),
      );
      setToast({ msg: "API key revoked", type: "success" });
    } catch {
      setToast({ msg: "Failed to revoke key", type: "error" });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div>
      <Section
        title="API Keys"
        subtitle="Keys authenticate your embeddable widget. Never expose them client-side outside the widget."
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: keys.length ? 16 : 0,
          }}
        >
          <Btn onClick={() => setShowCreate(true)} size="sm">
            <i className="ti ti-plus" style={{ fontSize: 15 }} /> Create API key
          </Btn>
        </div>

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: S.textMuted,
            }}
          >
            <i
              className="ti ti-loader-2"
              style={{ fontSize: 20, animation: "spin 1s linear infinite" }}
            />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && keys.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem",
              color: S.textMuted,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: S.purpleBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <i
                className="ti ti-key"
                style={{ fontSize: 26, color: S.purple }}
              />
            </div>
            <p style={{ margin: 0, fontSize: 13 }}>
              No API keys yet. Create one to get started.
            </p>
          </div>
        )}

        {!loading &&
          keys.map((key, i) => (
            <div
              key={i}
              style={{
                border: `0.5px solid ${S.border}`,
                borderRadius: 10,
                padding: "1rem 1.1rem",
                marginBottom: i < keys.length - 1 ? 10 : 0,
                background: key.is_active ? S.surface : S.bg,
                opacity: key.is_active ? 1 : 0.65,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{ fontSize: 14, fontWeight: 600, color: S.dark }}
                    >
                      {key.name}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: key.is_active ? S.greenBg : S.bg,
                        color: key.is_active ? "#0F6E56" : S.textMuted,
                        border: `1px solid ${key.is_active ? S.green + "40" : S.border}`,
                      }}
                    >
                      {key.is_active ? "Active" : "Revoked"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <code
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: S.textSecondary,
                        background: S.bg,
                        padding: "3px 8px",
                        borderRadius: 5,
                        border: `0.5px solid ${S.border}`,
                      }}
                    >
                      {key.key_prefix}••••••••••••••••••••••••
                    </code>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 5,
                      marginBottom: 8,
                    }}
                  >
                    {key?.allowed_origins?.map((o) => (
                      <span
                        key={o}
                        style={{
                          fontSize: 11,
                          background: S.purpleBg,
                          color: S.purple,
                          padding: "2px 8px",
                          borderRadius: 5,
                          fontFamily: "monospace",
                        }}
                      >
                        {o}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 11, color: S.textMuted }}>
                      <i
                        className="ti ti-calendar"
                        style={{ fontSize: 11, marginRight: 3 }}
                      />
                      Created {fmtDate(key.created_at)}
                    </span>
                    <span style={{ fontSize: 11, color: S.textMuted }}>
                      <i
                        className="ti ti-clock"
                        style={{ fontSize: 11, marginRight: 3 }}
                      />
                      Last used: {timeAgo(key.last_used_at)}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {key.is_active && (
                    <button
                      onClick={() => handleRevoke(key.id)}
                      disabled={revoking === key.id}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        border: `1px solid ${S.border}`,
                        background: S.surface,
                        color: S.textSecondary,
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        opacity: revoking === key.id ? 0.6 : 1,
                      }}
                    >
                      {revoking === key.id ? (
                        <i
                          className="ti ti-loader-2"
                          style={{
                            fontSize: 13,
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      ) : (
                        <i className="ti ti-ban" style={{ fontSize: 13 }} />
                      )}
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </Section>

      {showCreate && (
        <CreateKeyModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}
      {newKey && (
        <KeyRevealModal apiKey={newKey} onClose={() => setNewKey(null)} />
      )}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
