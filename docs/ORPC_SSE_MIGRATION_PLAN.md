# 🔄 oRPC SSE Migration Plan

**Date:** November 16, 2024  
**Topic:** Migrating Custom SSE to oRPC Native SSE + IORedis Publisher  
**Status:** Analysis & Recommendation

---

## 📊 Executive Summary

After reviewing oRPC's documentation and your current setup, here's the verdict:

### **✅ RECOMMENDATION: Migrate to oRPC Native SSE**

**Why:**

1. ✅ **Built-in SSE support** - No custom implementation needed
2. ✅ **IORedis Publisher adapter** - Multi-server support out of the box
3. ✅ **Resume support** - Automatic reconnection with `lastEventId`
4. ✅ **Type-safe** - Full TypeScript support with schema validation
5. ✅ **Better architecture** - Follows oRPC patterns you're already using
6. ✅ **Pino logging** - Professional logging integration
7. ✅ **WebSocket option** - Can upgrade to WebSocket later if needed

---

## 🔍 Current vs oRPC Comparison

### **Your Current Custom Implementation:**

```typescript
// lib/services/sse-connection.service.ts
export class SSEConnectionManager {
  private connections: Map<string, Map<string, SSEConnection>>;
  private redisPublisher?: Redis;
  private redisSubscriber?: Redis;

  broadcast(resourceId: string, data: unknown): Promise<void> {
    // Custom Redis Pub/Sub implementation
    if (this.isRedisEnabled) {
      await this.redisPublisher.publish(`sse:${resourceId}`, JSON.stringify(data));
    } else {
      this.broadcastLocal(resourceId, data);
    }
  }
}
```

**Issues:**

- ⚠️ Custom connection management
- ⚠️ Manual Redis Pub/Sub handling
- ⚠️ No automatic reconnection
- ⚠️ No resume support
- ⚠️ Not integrated with oRPC
- ⚠️ More code to maintain

---

### **oRPC Native Implementation:**

```typescript
// Using oRPC's built-in SSE + IORedis Publisher
import { IORedisPublisher } from '@orpc/experimental-publisher/ioredis';
import { Redis } from 'ioredis';

const publisher = new IORedisPublisher<{
  'queue-update': { doctorId: string; position: number };
  'appointment-update': { appointmentId: string; status: string };
}>({
  commander: new Redis(),
  subscriber: new Redis(),
  resumeRetentionSeconds: 60 * 2, // 2 minutes resume support
  prefix: 'orpc:hms:',
});

// Subscribe (SSE endpoint)
const liveQueue = os
  .input(z.object({ doctorId: z.string() }))
  .handler(async function* ({ input, signal, lastEventId }) {
    const iterator = publisher.subscribe('queue-update', {
      signal,
      lastEventId // Automatic resume!
    });

    for await (const payload of iterator) {
      if (payload.doctorId === input.doctorId) {
        yield payload;
      }
    }
  });

// Publish (from anywhere)
const updateQueue = os
  .input(z.object({ doctorId: z.string(), position: z.number() }))
  .handler(async ({ input }) => {
    await publisher.publish('queue-update', {
      doctorId: input.doctorId,
      position: input.position
    });
  });
```

**Benefits:**

- ✅ Built into oRPC (no custom code)
- ✅ Automatic Redis Pub/Sub
- ✅ Automatic reconnection
- ✅ Resume support with `lastEventId`
- ✅ Type-safe events
- ✅ Less code to maintain

---

## 🎯 Migration Strategy

### **Phase 1: Install Dependencies**

```bash
npm install @orpc/experimental-publisher@latest
npm install @orpc/experimental-pino@latest pino@latest
```

---

### **Phase 2: Create Publisher Service**

```typescript
// lib/services/orpc-publisher.service.ts
import { IORedisPublisher } from '@orpc/experimental-publisher/ioredis';
import { Redis } from 'ioredis';

// Define all SSE event types
export interface SSEEvents {
  // Queue updates
  'queue:update': {
    doctorId: string;
    queuePosition: number;
    estimatedWait: number;
    timestamp: Date;
  };

  // Appointment updates
  'appointment:update': {
    appointmentId: string;
    status: 'SCHEDULED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
    timestamp: Date;
  };

  // Patient updates
  'patient:update': {
    patientId: string;
    action: 'checked-in' | 'called' | 'completed';
    timestamp: Date;
  };

  // Dynamic channels (per doctor, per appointment, etc.)
  [key: `doctor:${string}`]: {
    type: string;
    data: unknown;
  };

  [key: `appointment:${string}`]: {
    type: string;
    data: unknown;
  };
}

// Create publisher instance
export const ssePublisher = new IORedisPublisher<SSEEvents>({
  commander: new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  }),
  subscriber: new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  }),
  resumeRetentionSeconds: 60 * 2, // 2 minutes resume support
  prefix: 'orpc:hms:',
});

console.log('✅ oRPC SSE Publisher initialized');
```

---

### **Phase 3: Create SSE Endpoints in Router**

```typescript
// router/sse.ts
import { os } from '@/lib/orpc';
import { ssePublisher } from '@/lib/services/orpc-publisher.service';
import { z } from 'zod';
import { eventIterator } from '@orpc/server';

// Queue updates SSE endpoint
export const liveQueue = os
  .input(z.object({
    doctorId: z.string()
  }))
  .output(eventIterator(z.object({
    queuePosition: z.number(),
    estimatedWait: z.number(),
    timestamp: z.date(),
  })))
  .handler(async function* ({ input, signal, lastEventId }) {
    console.log(`📡 Client subscribed to doctor ${input.doctorId} queue`);

    const iterator = publisher.subscribe('queue:update', {
      signal,
      lastEventId, // Automatic resume support
    });

    try {
      for await (const payload of iterator) {
        // Filter events for this specific doctor
        if (payload.doctorId === input.doctorId) {
          yield {
            queuePosition: payload.queuePosition,
            estimatedWait: payload.estimatedWait,
            timestamp: payload.timestamp,
          };
        }
      }
    } finally {
      console.log(`📡 Client unsubscribed from doctor ${input.doctorId} queue`);
    }
  });

// Appointment updates SSE endpoint
export const liveAppointment = os
  .input(z.object({
    appointmentId: z.string()
  }))
  .output(eventIterator(z.object({
    status: z.enum(['SCHEDULED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']),
    timestamp: z.date(),
  })))
  .handler(async function* ({ input, signal, lastEventId }) {
    console.log(`📡 Client subscribed to appointment ${input.appointmentId}`);

    const iterator = publisher.subscribe('appointment:update', {
      signal,
      lastEventId,
    });

    try {
      for await (const payload of iterator) {
        if (payload.appointmentId === input.appointmentId) {
          yield {
            status: payload.status,
            timestamp: payload.timestamp,
          };
        }
      }
    } finally {
      console.log(`📡 Client unsubscribed from appointment ${input.appointmentId}`);
    }
  });

// Publish queue update (called from other routers)
export const publishQueueUpdate = os
  .input(z.object({
    doctorId: z.string(),
    queuePosition: z.number(),
    estimatedWait: z.number(),
  }))
  .handler(async ({ input }) => {
    await ssePublisher.publish('queue:update', {
      doctorId: input.doctorId,
      queuePosition: input.queuePosition,
      estimatedWait: input.estimatedWait,
      timestamp: new Date(),
    });

    return { success: true };
  });

// Publish appointment update
export const publishAppointmentUpdate = os
  .input(z.object({
    appointmentId: z.string(),
    status: z.enum(['SCHEDULED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']),
  }))
  .handler(async ({ input }) => {
    await ssePublisher.publish('appointment:update', {
      appointmentId: input.appointmentId,
      status: input.status,
      timestamp: new Date(),
    });

    return { success: true };
  });
```

---

### **Phase 4: Update Existing Routers to Publish Events**

```typescript
// router/appointments.ts
import { publishAppointmentUpdate } from './sse';

export const updateAppointmentStatus = os
  .input(z.object({
    id: z.string(),
    status: z.enum(['SCHEDULED', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']),
  }))
  .handler(async ({ input }) => {
    // Update database
    const appointment = await prisma.appointments.update({
      where: { id: input.id },
      data: { status: input.status },
    });

    // Publish SSE event (multi-server safe!)
    await publishAppointmentUpdate({
      appointmentId: input.id,
      status: input.status,
    });

    return appointment;
  });
```

---

### **Phase 5: Client-Side Usage**

```typescript
// app/dashboard/queue/[doctorId]/page.tsx
'use client';

import { client } from '@/lib/orpc';
import { useEffect, useState } from 'react';

export default function QueuePage({ params }: { params: { doctorId: string } }) {
  const [queueData, setQueueData] = useState<{
    position: number;
    estimatedWait: number;
  } | null>(null);

  useEffect(() => {
    let abortController = new AbortController();

    async function subscribeToQueue() {
      try {
        // Subscribe to SSE stream
        const iterator = await client.liveQueue(
          { doctorId: params.doctorId },
          { signal: abortController.signal }
        );

        for await (const event of iterator) {
          setQueueData({
            position: event.queuePosition,
            estimatedWait: event.estimatedWait,
          });
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('SSE error:', error);
          // Auto-retry with exponential backoff
          setTimeout(subscribeToQueue, 1000);
        }
      }
    }

    subscribeToQueue();

    return () => {
      abortController.abort();
    };
  }, [params.doctorId]);

  return (
    <div>
      <h1>Queue Status</h1>
      {queueData && (
        <div>
          <p>Position: {queueData.position}</p>
          <p>Estimated Wait: {queueData.estimatedWait} minutes</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Key Advantages of oRPC SSE

### **1. Automatic Resume Support**

```typescript
// Client automatically resumes from last event
const iterator = await client.liveQueue(
  { doctorId: '123' },
  { lastEventId: 'event-42' } // Automatically handled by oRPC
);
```

### **2. Type Safety**

```typescript
// Compile-time type checking
const iterator = await client.liveQueue({ doctorId: '123' });

for await (const event of iterator) {
  // event.queuePosition is typed as number
  // event.estimatedWait is typed as number
  // TypeScript knows the exact shape!
}
```

### **3. Multi-Server by Default**

```typescript
// No special code needed - IORedis Publisher handles it
await ssePublisher.publish('queue:update', data);
// ↓
// Redis Pub/Sub automatically broadcasts to all servers
// ↓
// All connected clients receive the update
```

### **4. Built-in Cleanup**

```typescript
// Automatic cleanup when client disconnects
const iterator = publisher.subscribe('queue:update', {
  signal, // AbortSignal for cleanup
  lastEventId,
});

// When signal aborts or connection closes:
// - Subscription automatically cleaned up
// - No memory leaks
// - No manual tracking needed
```

---

## 📊 Comparison Table

| Feature               | Custom SSE             | oRPC SSE                     |
| --------------------- | ---------------------- | ---------------------------- |
| **Implementation**    | 300+ lines custom code | ~50 lines with oRPC          |
| **Redis Pub/Sub**     | Manual implementation  | Built-in IORedis adapter     |
| **Resume Support**    | Not implemented        | Automatic with `lastEventId` |
| **Type Safety**       | Manual typing          | Full TypeScript inference    |
| **Connection Limits** | Manual tracking        | Handled by oRPC              |
| **Cleanup**           | Manual `destroy()`     | Automatic with `signal`      |
| **Multi-Server**      | Custom Redis logic     | Built-in                     |
| **Logging**           | console.log            | Pino integration             |
| **Testing**           | Complex                | Simple (just test handlers)  |
| **Maintenance**       | High                   | Low                          |

---

## 🚀 Migration Steps (Detailed)

### **Step 1: Install Dependencies (5 minutes)**

```bash
npm install @orpc/experimental-publisher@latest
npm install @orpc/experimental-pino@latest pino@latest
```

### **Step 2: Create Publisher Service (10 minutes)**

Create `lib/services/orpc-publisher.service.ts` with the publisher configuration.

### **Step 3: Create SSE Router (20 minutes)**

Create `router/sse.ts` with all SSE endpoints (subscribe + publish).

### **Step 4: Update Existing Routers (30 minutes)**

Update routers to call publish functions when data changes.

### **Step 5: Update Client Code (30 minutes)**

Replace custom SSE client code with oRPC client calls.

### **Step 6: Add Pino Logging (15 minutes)**

Add Pino logging plugin to oRPC handler.

### **Step 7: Testing (30 minutes)**

Test SSE connections, reconnections, and multi-server scenarios.

### **Step 8: Remove Old Code (10 minutes)**

Delete `lib/services/sse-connection.service.ts` and related files.

**Total Time: ~2.5 hours**

---

## 🎯 Optional: Add Pino Logging

```typescript
// lib/orpc.server.ts
import { LoggingHandlerPlugin } from '@orpc/experimental-pino';
import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

// Update your RPCHandler to include logging
const handler = new RPCHandler(router, {
  plugins: [
    new LoggingHandlerPlugin({
      logger,
      logRequestResponse: process.env.NODE_ENV === 'development',
      logRequestAbort: true,
    }),
  ],
});
```

**Benefits:**

- ✅ Structured JSON logging
- ✅ Request/response tracking
- ✅ Performance monitoring
- ✅ Error tracking
- ✅ Production-ready

---

## 🎯 Optional: Add WebSocket Support (Future)

If you need lower latency than SSE:

```typescript
// Install WebSocket adapter
npm install @orpc/server/websocket

// Same handlers work with WebSocket!
import { RPCHandler } from '@orpc/server/websocket';

const handler = new RPCHandler(router);

// Upgrade to WebSocket
const { socket, response } = Deno.upgradeWebSocket(req);
handler.upgrade(socket, { context: {} });
```

**When to use WebSocket:**

- Need bidirectional communication
- Need lower latency (<100ms)
- Need to send data from client to server frequently

**When to use SSE (current):**

- Server-to-client updates only
- Simpler implementation
- Better browser support
- Automatic reconnection

---

## ✅ Recommendation

### **Migrate to oRPC Native SSE + IORedis Publisher**

**Why:**

1. ✅ **Less code** - 80% reduction in custom code
2. ✅ **Better architecture** - Follows oRPC patterns
3. ✅ **More features** - Resume support, type safety, logging
4. ✅ **Easier maintenance** - Let oRPC handle complexity
5. ✅ **Multi-server ready** - IORedis adapter handles it
6. ✅ **Future-proof** - Can upgrade to WebSocket later

**Migration Time:** ~2.5 hours

**Risk:** Low (can run both systems in parallel during migration)

---

## 📋 Migration Checklist

- [ ] Install `@orpc/experimental-publisher`
- [ ] Install `@orpc/experimental-pino` and `pino`
- [ ] Create `lib/services/orpc-publisher.service.ts`
- [ ] Create `router/sse.ts` with SSE endpoints
- [ ] Update existing routers to publish events
- [ ] Update client-side code to use oRPC client
- [ ] Add Pino logging plugin
- [ ] Test SSE connections
- [ ] Test reconnection/resume
- [ ] Test multi-server (if applicable)
- [ ] Remove old `sse-connection.service.ts`
- [ ] Update documentation
- [ ] Deploy to production

---

## 🎉 Summary

**Current Setup:**

- ❌ 300+ lines of custom SSE code
- ❌ Manual Redis Pub/Sub
- ❌ No resume support
- ❌ Complex maintenance

**With oRPC:**

- ✅ ~50 lines of code
- ✅ Built-in Redis Pub/Sub
- ✅ Automatic resume
- ✅ Simple maintenance
- ✅ Type-safe
- ✅ Production-ready

**Recommendation: Migrate to oRPC Native SSE!** 🚀
