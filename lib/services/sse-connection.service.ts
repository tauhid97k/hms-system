/**
 * SSE Connection Manager Service
 *
 * Manages Server-Sent Events connections with:
 * - Connection limits per resource
 * - Memory leak prevention
 * - Automatic cleanup
 * - Connection tracking and monitoring
 */

export interface SSEConnection {
  id: string;
  resourceId: string;
  controller: ReadableStreamDefaultController;
  createdAt: Date;
  lastActivity: Date;
}

export class SSEConnectionManager {
  private static instance: SSEConnectionManager;
  private connections: Map<string, Map<string, SSEConnection>>;
  private maxConnectionsPerResource: number;
  private connectionTimeout: number; // ms

  private constructor(
    maxConnectionsPerResource: number = 20,
    connectionTimeout: number = 1000 * 60 * 30 // 30 minutes
  ) {
    this.connections = new Map();
    this.maxConnectionsPerResource = maxConnectionsPerResource;
    this.connectionTimeout = connectionTimeout;

    // Cleanup stale connections every 5 minutes
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 1000 * 60 * 5);
  }

  static getInstance(): SSEConnectionManager {
    if (!SSEConnectionManager.instance) {
      SSEConnectionManager.instance = new SSEConnectionManager();
    }
    return SSEConnectionManager.instance;
  }

  /**
   * Add a new connection
   * @returns connection ID if successful, null if limit reached
   */
  addConnection(
    resourceId: string,
    controller: ReadableStreamDefaultController
  ): string | null {
    if (!this.connections.has(resourceId)) {
      this.connections.set(resourceId, new Map());
    }

    const resourceConnections = this.connections.get(resourceId)!;

    // Check connection limit
    if (resourceConnections.size >= this.maxConnectionsPerResource) {
      console.warn(
        `Connection limit reached for resource: ${resourceId} (${resourceConnections.size}/${this.maxConnectionsPerResource})`
      );
      return null;
    }

    // Generate unique connection ID
    const connectionId = `${resourceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const connection: SSEConnection = {
      id: connectionId,
      resourceId,
      controller,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    resourceConnections.set(connectionId, connection);

    console.log(
      `✅ SSE connection added: ${connectionId} (${resourceConnections.size}/${this.maxConnectionsPerResource} for ${resourceId})`
    );

    return connectionId;
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): void {
    for (const [resourceId, resourceConnections] of this.connections) {
      if (resourceConnections.has(connectionId)) {
        resourceConnections.delete(connectionId);
        console.log(
          `✅ SSE connection removed: ${connectionId} (${resourceConnections.size} remaining for ${resourceId})`
        );

        // Clean up empty resource maps
        if (resourceConnections.size === 0) {
          this.connections.delete(resourceId);
        }

        return;
      }
    }
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): SSEConnection | null {
    for (const resourceConnections of this.connections.values()) {
      const connection = resourceConnections.get(connectionId);
      if (connection) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Get all connections for a resource
   */
  getResourceConnections(resourceId: string): SSEConnection[] {
    const resourceConnections = this.connections.get(resourceId);
    if (!resourceConnections) {
      return [];
    }
    return Array.from(resourceConnections.values());
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(connectionId: string): void {
    const connection = this.getConnection(connectionId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * Cleanup stale connections (inactive for more than timeout)
   */
  private cleanupStaleConnections(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [resourceId, resourceConnections] of this.connections) {
      const staleConnections = Array.from(resourceConnections.values()).filter(
        (conn) => now - conn.lastActivity.getTime() > this.connectionTimeout
      );

      for (const staleConn of staleConnections) {
        try {
          staleConn.controller.close();
        } catch (err) {
          // Controller might already be closed
        }
        resourceConnections.delete(staleConn.id);
        cleanedCount++;
      }

      // Clean up empty resource maps
      if (resourceConnections.size === 0) {
        this.connections.delete(resourceId);
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} stale SSE connections`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const resourceStats = Array.from(this.connections.entries()).map(
      ([resourceId, connections]) => ({
        resourceId,
        connectionCount: connections.size,
        connections: Array.from(connections.values()).map((conn) => ({
          id: conn.id,
          createdAt: conn.createdAt,
          lastActivity: conn.lastActivity,
          ageSeconds: Math.floor(
            (Date.now() - conn.createdAt.getTime()) / 1000
          ),
        })),
      })
    );

    const totalConnections = resourceStats.reduce(
      (sum, stat) => sum + stat.connectionCount,
      0
    );

    return {
      totalConnections,
      resourceCount: this.connections.size,
      maxConnectionsPerResource: this.maxConnectionsPerResource,
      connectionTimeout: this.connectionTimeout,
      resources: resourceStats,
    };
  }

  /**
   * Broadcast message to all connections for a resource
   */
  broadcast(resourceId: string, data: any): void {
    const resourceConnections = this.connections.get(resourceId);
    if (!resourceConnections) {
      return;
    }

    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoded = encoder.encode(message);

    let successCount = 0;
    let failCount = 0;

    for (const [connectionId, connection] of resourceConnections) {
      try {
        connection.controller.enqueue(encoded);
        this.updateActivity(connectionId);
        successCount++;
      } catch (error) {
        console.error(
          `Failed to send to connection ${connectionId}:`,
          error
        );
        failCount++;

        // Remove failed connection
        this.removeConnection(connectionId);
      }
    }

    if (successCount > 0 || failCount > 0) {
      console.log(
        `📡 Broadcast to ${resourceId}: ${successCount} success, ${failCount} failed`
      );
    }
  }
}

// Export singleton instance
export const sseConnectionManager = SSEConnectionManager.getInstance();
