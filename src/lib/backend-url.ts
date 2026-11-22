export const SESSION_COOKIE_NAME = 'fcp_token';

export function getBackendApiBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:3000/api';
  return url.replace(/\/+$/, '');
}
