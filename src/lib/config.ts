export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

if (!API_BASE_URL) {
  // Échec explicite si la variable d'environnement n'est pas définie
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL n'est pas définie. Ajoutez-la dans votre fichier .env.local"
  );
}
