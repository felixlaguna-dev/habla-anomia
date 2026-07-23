export {};

declare global {
  // Semantic version, injected via Vite `define` from package.json (see vite.config.ts).
  const __APP_VERSION__: string | undefined;
  // Git short hash at build time ('dev' when unavailable), injected via Vite `define`.
  const __APP_GIT_HASH__: string | undefined;
}
