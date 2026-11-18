function requireEnvVar(key: string, fallback?: string): string {
  const value = (process.env[key] ?? '').trim() || (fallback ?? '');
  if (!value) {
    console.error(`[UniTrade] Missing required env var: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}
export const API_BASE_URL: string = requireEnvVar('EXPO_PUBLIC_API_URL', 'http://10.20.19.53:5000/api');
export const SOCKET_URL: string = requireEnvVar('EXPO_PUBLIC_SOCKET_URL', 'http://10.20.19.53:5000');
