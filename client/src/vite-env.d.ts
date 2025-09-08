// Vite environment variables
declare interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_TITLE?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly MODE?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}