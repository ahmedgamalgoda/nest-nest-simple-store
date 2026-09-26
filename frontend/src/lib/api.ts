import { ApiResponse, ApiErrorResponse } from '@/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Standard API fetch helper function that always sends `credentials: 'include'`
 * so the httpOnly `token` authentication cookie is automatically sent.
 * 
 * Also automatically unwraps `.data` from the NestJS TransformInterceptor response envelope:
 * `{ success: true, data: ..., timestamp: ... }`
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...options,
    credentials: 'include', // Strictly always include credentials for httpOnly auth cookies
    headers,
  };

  const response = await fetch(url, config);

  // Parse JSON response safely
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const errorJson = json as ApiErrorResponse | null;
    let errorMessage = 'An unexpected error occurred';

    if (errorJson?.message) {
      if (Array.isArray(errorJson.message)) {
        errorMessage = errorJson.message.join(', ');
      } else {
        errorMessage = errorJson.message;
      }
    } else if (response.statusText) {
      errorMessage = response.statusText;
    }

    throw new ApiError(errorMessage, response.status, json);
  }

  // The backend wraps successful responses in { success: true, data: <payload>, timestamp: ... }
  // We extract and return the inner data payload
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as ApiResponse<T>).data;
  }

  return json as T;
}
