export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Default 6s timeout if no custom signal provided
  const signal = options.signal || (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(6000) : undefined);

  const res = await fetch(url, {
    ...options,
    signal,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type');
  let body: Record<string, unknown> | string | null = null;
  if (contentType && contentType.includes('application/json')) {
    body = (await res.json()) as Record<string, unknown>;
  } else {
    body = await res.text();
  }

  if (!res.ok) {
    const errorMsg =
      (typeof body === 'object' && body !== null && ('message' in body || 'error' in body)
        ? String(body.message || body.error)
        : null) || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return body as T;
}
