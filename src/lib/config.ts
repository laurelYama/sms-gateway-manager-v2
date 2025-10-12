// Provide a safe default during build if the env var is not defined.
// Some Next.js prerendering steps run in CI or local builds where .env.local
// may not be present. Avoid throwing here to allow the build to complete.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '') as string;

if (!API_BASE_URL) {
  // Warn during build rather than throwing — callers should handle an empty URL.
  // This keeps the production build from failing when the env var is intentionally
  // injected at runtime (e.g., in deployment pipelines).
  console.warn(
    "WARNING: NEXT_PUBLIC_API_BASE_URL n'est pas définie. Utilisation d'une chaîne vide comme valeur par défaut."
  );
}
