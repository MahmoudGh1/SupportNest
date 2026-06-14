export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  allowed_origins: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  raw_key?: string;
}

export interface UpdateProfileInput {
  first_name: string;
  last_name: string;
  email: string;
}
