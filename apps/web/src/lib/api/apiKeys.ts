import type { ApiKey } from "@/types/types";
import { apiFetch } from "@/lib/api/client";
import { normalizeApiKey } from "@/lib/utils";

// ─── API KEYS ─────────────────────────────────────────────────────────────────

export async function getApiKeys(): Promise<ApiKey[]> {
  const data = await apiFetch<Record<string, unknown>[]>(
    "/dashboard/apikey/keys",
  );
  return Array.isArray(data) ? data.map(normalizeApiKey) : [];
}

export async function getWidgetKey(): Promise<string> {
  const widgetSecret = await apiFetch<string>("/dashboard/apikey/widgetSecret");
  return widgetSecret;
}

export async function createApiKey(input: {
  name: string;
  allowedOrigins: string[];
}): Promise<ApiKey> {
  const data = await apiFetch<string | Record<string, unknown>>(
    "/dashboard/apikey/create",
    {
      method: "POST",
      body: JSON.stringify({ allowedOrigins: input.allowedOrigins }),
    },
  );

  const rawKey =
    typeof data === "string"
      ? data
      : ((data.rawKey ?? data.raw_key ?? "") as string);
  const keyPrefix = rawKey.slice(0, 8);

  const keys = await getApiKeys().catch(() => []);
  const createdKey =
    keys.find((key) => key.key_prefix === keyPrefix) ??
    normalizeApiKey({
      name: input.name,
      keyPrefix,
      allowedOrigins: input.allowedOrigins,
      raw_key: rawKey,
    });

  return {
    ...createdKey,
    raw_key: rawKey,
    name: createdKey.name || input.name,
  };
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiFetch(`/dashboard/apikey/${id}/revoke`, { method: "PATCH" });
}
