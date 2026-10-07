"use client";

import useSWR, { SWRConfiguration, KeyedMutator } from "swr";

export interface UseCachedFetchResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: KeyedMutator<T>;
  refresh: () => Promise<T | undefined>;
}

const defaultFetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
};

/**
 * Client-side cached fetch hook using SWR.
 * Provides instantaneous UI rendering when revisiting pages
 * with automated background revalidation.
 */
export function useCachedFetch<T>(
  key: string | null,
  options?: SWRConfiguration
): UseCachedFetchResult<T> {
  const config: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    dedupingInterval: 30000, // 30s deduping window for snappy tab switching
    keepPreviousData: true,
    ...options,
  };

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    key,
    defaultFetcher,
    config
  );

  return {
    data,
    error: error || null,
    isLoading,
    isValidating,
    mutate,
    refresh: () => mutate(),
  };
}

export default useCachedFetch;
