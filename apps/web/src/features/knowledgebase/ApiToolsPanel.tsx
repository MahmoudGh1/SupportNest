"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { S } from "@/components/ui";

type AuthType = "BEARER" | "API_KEY" | "BASIC";
type Step = 1 | 2;
type PanelStatus = "idle" | "loading" | "success" | "error";

interface Props {
    onToolsExtracted: () => void;
}

export default function ApiToolsPanel({ onToolsExtracted }: Props) {
    // Step tracking
    const [step, setStep] = useState<Step>(1);

    // Step 1 state
    const [authType, setAuthType] = useState<AuthType>("BEARER");
    const [baseUrl, setBaseUrl] = useState("");
    const [authValue, setAuthValue] = useState("");
    const [headerName, setHeaderName] = useState("x-api-key");
    const [connectStatus, setConnectStatus] = useState<PanelStatus>("idle");
    const [connectError, setConnectError] = useState("");
    const [testEndpoint, setTestEndpoint] = useState("");

    // Step 2 state
    const [swaggerUrl, setSwaggerUrl] = useState("");
    const [swaggerTitle, setSwaggerTitle] = useState("");
    const [submitStatus, setSubmitStatus] = useState<PanelStatus>("idle");
    const [submitError, setSubmitError] = useState("");
    const [pollingDocId, setPollingDocId] = useState<string | null>(null);

    // On mount: check if already verified
    useEffect(() => {
        api.getApiConfig().then((cfg) => {
            if (cfg.configured && cfg.isVerified) {
                if (cfg.baseUrl) setBaseUrl(cfg.baseUrl);
                if (cfg.authType) setAuthType(cfg.authType as AuthType);
                if (cfg.headerName) setHeaderName(cfg.headerName);
                if (cfg.testEndpoint) setTestEndpoint(cfg.testEndpoint);
                setStep(2);
            }
        }).catch(() => { });
    }, []);

    // Poll document status after swagger submission
    useEffect(() => {
        if (!pollingDocId) return;
        const interval = setInterval(async () => {
            try {
                const result = await api.getKnowledgeDocs({ page: 1, limit: 50 });
                if (!result) return;
                const doc = result.data?.documents?.find((d: any) => d.id === pollingDocId);
                if (!doc) return;
                if (doc.status === "READY") {
                    clearInterval(interval);
                    setPollingDocId(null);
                    setSubmitStatus("success");
                    onToolsExtracted();
                } else if (doc.status === "FAILED") {
                    clearInterval(interval);
                    setPollingDocId(null);
                    setSubmitStatus("error");
                    setSubmitError("Tool extraction failed. Check that your Swagger URL is a valid OpenAPI spec.");
                }
            } catch {
                // on error, just wait for next tick — don't clear interval
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [onToolsExtracted, pollingDocId]);

    const handleConnect = async () => {
        setConnectError("");
        if (!baseUrl.trim() || !authValue.trim()) {
            setConnectError("Base URL and auth value are required.");
            return;
        }
        if (authType === "API_KEY" && !headerName.trim()) {
            setConnectError("Header name is required for API Key auth.");
            return;
        }
        if (!testEndpoint.trim()) {
            setConnectError("Test endpoint is required so we can verify your token.");
            return;
        }
        setConnectStatus("loading");
        try {
            await api.saveApiConfig({
                baseUrl,
                authType,
                authValue,
                headerName: authType === "API_KEY" ? headerName : undefined,
                testEndpoint: testEndpoint.trim(),
            });
            await api.verifyApiConfig();
            setConnectStatus("success");
            setTimeout(() => setStep(2), 800);
        } catch (e: any) {
            setConnectStatus("error");
            setConnectError(e.message ?? "Connection failed.");
        }
    };

    const handleSubmitSwagger = async () => {
        setSubmitError("");
        if (!swaggerUrl.trim()) {
            setSubmitError("Swagger URL is required.");
            return;
        }
        setSubmitStatus("loading");
        try {
            const { documentId } = await api.submitSwaggerUrl({
                title: swaggerTitle || swaggerUrl,
                swaggerUrl,
            });
            setPollingDocId(documentId);
        } catch (e: any) {
            setSubmitStatus("error");
            setSubmitError(e.message ?? "Submission failed.");
        }
    };

    const isPolling = !!pollingDocId;

    return (
        <div style={{
            background: "#fff",
            border: `0.5px solid ${S.border}`,
            borderRadius: 12,
            padding: "1.5rem",
            height: "100%",
        }}>
            {/* Header */}
            <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: S.dark }}>
                    API Tools Extractor
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: S.textMuted }}>
                    Connect your backend and extract tools from your Swagger/OpenAPI spec.
                </p>
            </div>

            {/* Step indicators */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem" }}>
                {([1, 2] as Step[]).map((s) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: step >= s ? S.purple : S.border,
                            color: step >= s ? "#fff" : S.textMuted,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 600, flexShrink: 0,
                            transition: "background .3s",
                        }}>
                            {step > s ? "✓" : s}
                        </div>
                        <span style={{ fontSize: 12, color: step >= s ? S.dark : S.textMuted, fontWeight: step === s ? 500 : 400 }}>
                            {s === 1 ? "Connect Backend" : "Submit API Spec"}
                        </span>
                        {s < 2 && <div style={{ width: 24, height: 1, background: S.border }} />}
                    </div>
                ))}
            </div>

            {/* ── STEP 1 ─────────────────────────────────────── */}
            {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Field label="Base URL" hint="e.g. https://api.yourapp.com">
                        <input
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="https://api.yourapp.com"
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="Auth Type">
                        <div style={{ display: "flex", gap: 8 }}>
                            {(["BEARER", "API_KEY", "BASIC"] as AuthType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setAuthType(t)}
                                    style={{
                                        flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 11,
                                        fontWeight: 500, cursor: "pointer", border: "1px solid",
                                        borderColor: authType === t ? S.purple : S.border,
                                        background: authType === t ? S.purpleBg : "#fff",
                                        color: authType === t ? S.purple : S.textMuted,
                                        transition: "all .15s",
                                    }}
                                >
                                    {t === "BEARER" ? "Bearer Token" : t === "API_KEY" ? "API Key" : "Basic Auth"}
                                </button>
                            ))}
                        </div>
                    </Field>

                    {authType === "API_KEY" && (
                        <Field label="Header Name" hint="e.g. x-api-key">
                            <input
                                value={headerName}
                                onChange={(e) => setHeaderName(e.target.value)}
                                placeholder="x-api-key"
                                style={inputStyle}
                            />
                        </Field>
                    )}

                    <Field label="Test Endpoint" hint="A protected endpoint we'll use to verify your token e.g. /api/users/me">
                        <input
                            value={testEndpoint}
                            onChange={(e) => setTestEndpoint(e.target.value)}
                            placeholder="/api/users/me"
                            style={inputStyle}
                        />
                    </Field>

                    <Field label={authType === "BEARER" ? "Bearer Token" : authType === "API_KEY" ? "API Key Value" : "username:password"}>
                        <input
                            type="password"
                            value={authValue}
                            onChange={(e) => setAuthValue(e.target.value)}
                            placeholder={authType === "BASIC" ? "username:password" : "••••••••••••"}
                            style={inputStyle}
                        />
                    </Field>

                    {connectError && <ErrorMsg msg={connectError} />}

                    {connectStatus === "success" && (
                        <div style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 6 }}>
                            <i className="ti ti-circle-check" /> API connected successfully! Moving to step 2…
                        </div>
                    )}

                    <button
                        onClick={handleConnect}
                        disabled={connectStatus === "loading"}
                        style={primaryBtn(connectStatus === "loading")}
                    >
                        {connectStatus === "loading"
                            ? <><Spinner /> Connecting…</>
                            : <><i className="ti ti-plug-connected" style={{ marginRight: 6 }} />Connect Backend</>
                        }
                    </button>
                </div>
            )}

            {/* ── STEP 2 ─────────────────────────────────────── */}
            {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 12px", borderRadius: 8,
                        background: "#f0fdf4", border: "1px solid #bbf7d0",
                        fontSize: 12, color: "#16a34a",
                    }}>
                        <i className="ti ti-circle-check-filled" />
                        Backend connected and verified.
                        <button onClick={() => setStep(1)} style={{
                            marginLeft: "auto", fontSize: 11, color: S.textMuted,
                            background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
                        }}>
                            Change
                        </button>
                    </div>

                    <Field label="Document Title" hint="Optional — defaults to URL">
                        <input
                            value={swaggerTitle}
                            onChange={(e) => setSwaggerTitle(e.target.value)}
                            placeholder="My API Spec"
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="Swagger / OpenAPI URL" hint="Must be a publicly accessible JSON or YAML file">
                        <input
                            value={swaggerUrl}
                            onChange={(e) => setSwaggerUrl(e.target.value)}
                            placeholder="https://api.yourapp.com/docs/openapi.json"
                            style={inputStyle}
                        />
                    </Field>

                    {submitError && <ErrorMsg msg={submitError} />}

                    {submitStatus === "success" && (
                        <div style={{ fontSize: 12, color: "#16a34a", display: "flex", alignItems: "center", gap: 6 }}>
                            <i className="ti ti-circle-check" /> All tools extracted successfully! Check the Tools tab.
                        </div>
                    )}

                    {isPolling && (
                        <div style={{ fontSize: 12, color: S.purple, display: "flex", alignItems: "center", gap: 6 }}>
                            <Spinner color={S.purple} /> Extracting tools from spec… this may take a moment.
                        </div>
                    )}

                    <button
                        onClick={handleSubmitSwagger}
                        disabled={isPolling || submitStatus === "success"}
                        style={primaryBtn(isPolling || submitStatus === "success")}
                    >
                        {isPolling
                            ? <><Spinner /> Extracting…</>
                            : <><i className="ti ti-bolt" style={{ marginRight: 6 }} />Submit Tools</>
                        }
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: S.dark, display: "block", marginBottom: 4 }}>
                {label}
                {hint && <span style={{ fontWeight: 400, color: S.textMuted, marginLeft: 4 }}>— {hint}</span>}
            </label>
            {children}
        </div>
    );
}

function ErrorMsg({ msg }: { msg: string }) {
    return (
        <div style={{
            fontSize: 12, color: "#dc2626", padding: "8px 12px",
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
            display: "flex", alignItems: "flex-start", gap: 6,
        }}>
            <i className="ti ti-alert-circle" style={{ flexShrink: 0, marginTop: 1 }} />
            {msg}
        </div>
    );
}

function Spinner({ color = "#fff" }: { color?: string }) {
    return (
        <>
            <style>{`@keyframes sn-spin{to{transform:rotate(360deg)}}`}</style>
            <span style={{
                width: 12, height: 12, border: `2px solid ${color}33`,
                borderTop: `2px solid ${color}`, borderRadius: "50%",
                display: "inline-block", animation: "sn-spin .7s linear infinite",
                marginRight: 6, flexShrink: 0,
            }} />
        </>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: 12,
    border: `1px solid ${S.border}`, borderRadius: 8,
    outline: "none", color: S.dark, background: "#fff",
    boxSizing: "border-box",
};

function primaryBtn(disabled: boolean): React.CSSProperties {
    return {
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 4, padding: "9px 16px", borderRadius: 8, fontSize: 12,
        fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
        border: "none", background: disabled ? S.border : S.purple,
        color: disabled ? S.textMuted : "#fff", marginTop: 4,
        transition: "all .15s", width: "100%",
    };
}