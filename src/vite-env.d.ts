/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT?: string;
  readonly VITE_RATING_ENDPOINT?: string;
  readonly VITE_NETLIFY_BASE_URL?: string;
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
