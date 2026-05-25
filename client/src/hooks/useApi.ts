import { useState, useEffect, useCallback, useRef } from 'react';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

export function apiGet<T>(url: string) {
  return request<T>(url);
}

export function apiPost<T>(url: string, body?: unknown) {
  return request<T>(url, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined });
}

export function apiPut<T>(url: string, body?: unknown) {
  return request<T>(url, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined });
}

export function apiDelete(url: string) {
  return request<void>(url, { method: 'DELETE' });
}

export function useApi<T>(url: string | null, opts?: { manual?: boolean }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!opts?.manual);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<T>(url);
      if (mountedRef.current) setData(result);
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!opts?.manual && url) refetch();
  }, [refetch, opts?.manual, url]);

  return { data, loading, error, refetch, setData };
}
