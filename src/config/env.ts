function requireEnvVar(key: string, fallback?: string): string {
  const value = (process.env[key] ?? '').trim() || (fallback ?? '');
  if (!value) {
    console.error(`[LAVSA] Missing required env var: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
export const API_BASE_URL: string = requireEnvVar('EXPO_PUBLIC_API_URL', 'https://campus-buy-sell-backend.onrender.com/api');
export const SOCKET_URL: string = requireEnvVar('EXPO_PUBLIC_SOCKET_URL', 'https://campus-buy-sell-backend.onrender.com');
