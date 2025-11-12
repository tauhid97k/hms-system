import { queueEmitter, getQueueForDoctor } from "@/lib/queue-emitter";
import type { QueueUpdateEvent } from "@/lib/queue-emitter";
import { sseConnectionManager } from "@/lib/services/sse-connection.service";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) endpoint for real-time queue updates
 *
 * Features:
 * - Connection limits per doctor (max 20)
 * - Automatic cleanup on disconnect
 * - Heartbeat to keep connection alive
 * - Memory leak prevention
 * - Connection tracking and monitoring
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params;

  // Validate doctor ID
  if (!doctorId || typeof doctorId !== "string") {
    return new Response(
      JSON.stringify({ error: "Invalid doctor ID" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const encoder = new TextEncoder();
  let connectionId: string | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Try to add connection (with limit check)
      connectionId = sseConnectionManager.addConnection(doctorId, controller);

      if (!connectionId) {
        // Connection limit reached
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: "Connection limit reached for this doctor. Maximum 20 concurrent connections allowed.",
            })}\n\n`
          )
        );
        controller.close();
        return;
      }

      // Send initial queue data
      try {
        const initialQueue = await getQueueForDoctor(doctorId);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(initialQueue)}\n\n`)
        );
        sseConnectionManager.updateActivity(connectionId);
      } catch (error) {
        console.error("Error fetching initial queue:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: "Failed to fetch initial queue",
            })}\n\n`
          )
        );
      }

      // Listen for queue updates for this specific doctor
      const listener = (event: QueueUpdateEvent) => {
        if (event.doctorId === doctorId && connectionId) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event.queue)}\n\n`)
            );
            sseConnectionManager.updateActivity(connectionId);
          } catch (error) {
            console.error("Error sending queue update:", error);
            // Remove failed connection
            if (connectionId) {
              sseConnectionManager.removeConnection(connectionId);
            }
          }
        }
      };

      queueEmitter.on("queue-update", listener);

      // Send heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          if (connectionId) {
            sseConnectionManager.updateActivity(connectionId);
          }
        } catch (error) {
          // Connection might be closed
          console.error("Heartbeat error:", error);
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
        }
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener("abort", () => {
        console.log(`SSE connection closed for doctor: ${doctorId}`);
        queueEmitter.off("queue-update", listener);

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }

        if (connectionId) {
          sseConnectionManager.removeConnection(connectionId);
        }

        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      });
    },

    cancel() {
      console.log(`SSE stream cancelled for doctor: ${doctorId}`);

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      if (connectionId) {
        sseConnectionManager.removeConnection(connectionId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in nginx
    },
  });
}
