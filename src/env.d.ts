/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_GOOGLE_FORM_URL: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly API_INGEST_KEY: string;
  readonly API_ALLOWED_ORIGINS: string;
  readonly TRUSTED_CIDRS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
