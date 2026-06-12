import { api } from "@/lib/api";
import { ApiKey } from "@/types/profile";

export async function createApiKey(
  name: string,
  origins: string[],
): Promise<ApiKey> {
  return api.createApiKey({ name, allowedOrigins: origins });
}
