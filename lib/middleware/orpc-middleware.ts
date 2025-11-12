/**
 * ORPC Middleware Utilities
 *
 * Provides reusable middleware functions for ORPC routes:
 * - Performance monitoring
 * - Request timing
 * - Error handling
 * - Cache helpers
 */

import { performance } from "perf_hooks";

/**
 * Measure query execution time
 * Logs slow queries (>100ms) in development
 */
export async function measureQuery<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > 100) {
      console.warn(`🐌 Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    } else if (process.env.NODE_ENV === "development") {
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(
      `❌ Error in ${name} after ${duration.toFixed(2)}ms:`,
      error
    );
    throw error;
  }
}

/**
 * Batch helper for reducing N+1 queries
 * Usage: const results = await batchFetch(ids, fetchFn)
 */
export async function batchFetch<T, R>(
  items: T[],
  fetchFn: (items: T[]) => Promise<R[]>
): Promise<R[]> {
  if (items.length === 0) return [];
  return await fetchFn(items);
}

/**
 * Retry helper for transient failures
 */
export async function retryOperation<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(
          `Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Cache key generator helper
 * Creates consistent cache keys from parameters
 */
export function createCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedKeys = Object.keys(params).sort();
  const keyParts = sortedKeys.map((key) => `${key}:${params[key]}`);
  return `${prefix}:${keyParts.join(":")}`;
}

/**
 * Pagination helper
 * Returns skip and take values from page/limit
 */
export function getPaginationParams(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Response helper
 * Formats paginated responses consistently
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}
