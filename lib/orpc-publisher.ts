/**
 * oRPC Publisher Service
 *
 * Provides SSE (Server-Sent Events) publishing with Redis Pub/Sub for multi-server support.
 * Uses IORedis adapter for automatic event distribution across multiple server instances.
 *
 * Features:
 * - Multi-server SSE broadcasting via Redis Pub/Sub
 * - Automatic resume support with event retention
 * - Type-safe event definitions
 * - Configurable via environment variables
 */

import { MemoryPublisher } from "@orpc/experimental-publisher/memory";

/**
 * Define all SSE event types for the HMS system
 * Each event type maps to a specific channel with typed payload
 */
export type SSEEvents = Record<
  string,
  {
    doctorId?: string;
    appointmentId?: string;
    patientId?: string;
    queuePosition?: number;
    estimatedWait?: number;
    status?: string;
    action?: string;
    timestamp: Date;
    [key: string]: unknown;
  }
>;

/**
 * Create Publisher instance
 *
 * Using MemoryPublisher for now (single-server mode)
 * TODO: Switch to IORedisPublisher when Redis is configured for multi-server support
 */
export const ssePublisher = new MemoryPublisher<SSEEvents>({
  resumeRetentionSeconds: 60 * 2, // 2 minutes resume support
});

// Log initialization
if (process.env.REDIS_HOST) {
  console.log(
    "ℹ️ oRPC SSE Publisher initialized in memory-only mode (single-server)",
  );
} else {
  console.log(
    "ℹ️ oRPC SSE Publisher initialized in memory-only mode (single-server)",
  );
}

/**
 * Helper function to publish events with automatic typing
 *
 * @example
 * await publishSSE('queue:update', {
 *   doctorId: '123',
 *   queuePosition: 5,
 *   estimatedWait: 15,
 *   timestamp: new Date()
 * });
 */
export async function publishSSE<K extends keyof SSEEvents>(
  channel: K,
  payload: SSEEvents[K],
): Promise<void> {
  try {
    await ssePublisher.publish(channel, payload);
  } catch (error) {
    console.error(
      `❌ Failed to publish SSE event to ${String(channel)}:`,
      error,
    );
    throw error;
  }
}

/**
 * Get publisher statistics
 */
export function getPublisherStats() {
  return {
    redisEnabled: !!process.env.REDIS_HOST,
    redisHost: process.env.REDIS_HOST || "not configured",
    redisPort: process.env.REDIS_PORT || "6379",
    resumeRetentionSeconds: 60 * 2,
    prefix: "orpc:hms:",
  };
}
