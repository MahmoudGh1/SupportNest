import { ApiKey } from "@/types/profile";

const API_BASE = "http://localhost:3201/api/v1";

export async function createApiKey(
  name: string, // ← add name
  origins: string[],
): Promise<ApiKey> {
  const res = await fetch(`${API_BASE}/dashboard/apikey/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, allowed_origins: origins }),
  });

  const data = await res.json();
  console.log("Raw API response:", data); // ← paste this output here

  return {
    id: data.id,
    name: data.name ?? name,
    key_prefix: data.keyPrefix ?? data.key_prefix ?? "",
    key_hash: data.keyHash ?? data.key_hash ?? "",
    allowed_origins: data.allowedOrigins ?? data.allowed_origins ?? origins,
    is_active: data.isActive ?? data.is_active ?? true,
    last_used_at: data.lastUsedAt ?? data.last_used_at ?? null,
    created_at: data.createdAt ?? data.created_at ?? new Date().toISOString(),
    raw_key: data ?? data.raw_key ?? data.key ?? "",
  };
}
