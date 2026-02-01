"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook to get and manage CSRF token for client-side requests
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCsrfToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/csrf");
      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      setCsrfToken(data.csrfToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCsrfToken();
  }, [fetchCsrfToken]);

  /**
   * Get headers with CSRF token for fetch requests
   */
  const getCsrfHeaders = useCallback((): HeadersInit => {
    if (!csrfToken) {
      return {};
    }
    return {
      "x-csrf-token": csrfToken,
    };
  }, [csrfToken]);

  /**
   * Make a fetch request with CSRF token
   */
  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers);
      if (csrfToken) {
        headers.set("x-csrf-token", csrfToken);
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [csrfToken]
  );

  return {
    csrfToken,
    loading,
    error,
    refresh: fetchCsrfToken,
    getCsrfHeaders,
    csrfFetch,
  };
}

export default useCsrf;
