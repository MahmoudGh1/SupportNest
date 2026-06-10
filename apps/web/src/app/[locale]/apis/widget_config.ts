export interface WidgetConfig {
  title: string;
  greetingMessage: string;
  accentColor: string;
  placeholder: string;
}

export async function updateWidgetConfig(config: WidgetConfig): Promise<void> {
  const res = await fetch(
    "http://localhost:3201/api/v1/organizations/widget-config",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(config),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to update widget config");
  }

  return data;
}
