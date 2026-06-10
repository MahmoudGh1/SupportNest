export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  allowed_origins: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  raw_key?: string; // ← or whatever field your backend actually returns
  key?: string; // ← add this if backend uses "key"
}

export interface UpdateProfileInput {
  first_name: string;
  last_name: string;
  email: string;
}
