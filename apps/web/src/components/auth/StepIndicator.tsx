"use client";

const T = {
  white:      "#FFFFFF",
  violet:     "#534AB7",
  green:      "#1D9E75",
  darkBorder: "rgba(255,255,255,0.08)",
} as const;

interface Props {
  current: 1 | 2;
}

export function StepIndicator({ current }: Props) {
  const steps = [
    { n: 1, label: "Account Details" },
    { n: 2, label: "Payment" },
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
      marginBottom: 40,
      padding: "20px 0",
      borderTop: `1px solid ${T.darkBorder}`,
      borderBottom: `1px solid ${T.darkBorder}`,
    }}>
      {steps.map((step, i) => {
        const done   = current > step.n;
        const active = current === step.n;

        return (
          <div key={step.n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: done ? T.green : active ? T.violet : "transparent",
                border: `2px solid ${done ? T.green : active ? T.violet : "rgba(255,255,255,0.15)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                color: done || active ? T.white : "rgba(255,255,255,0.25)",
                flexShrink: 0,
                transition: "all .25s",
              }}>
                {done
                  ? <i className="ti ti-check" style={{ fontSize: 15 }} />
                  : step.n
                }
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active
                  ? T.white
                  : done
                  ? "rgba(255,255,255,0.5)"
                  : "rgba(255,255,255,0.25)",
                whiteSpace: "nowrap",
                transition: "color .25s",
              }}>
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div style={{
                width: 80,
                height: 2,
                margin: "0 24px",
                background: current > 1
                  ? T.green
                  : "rgba(255,255,255,0.08)",
                borderRadius: 2,
                transition: "background .3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}