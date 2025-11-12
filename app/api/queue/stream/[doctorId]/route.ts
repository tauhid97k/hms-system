import { queueEmitter, getQueueForDoctor } from "@/lib/queue-emitter";
import type { QueueUpdateEvent } from "@/lib/queue-emitter";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) endpoint for real-time queue updates
 * Clients can subscribe to a specific doctor's queue updates
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params;

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial queue data
      try {
        const initialQueue = await getQueueForDoctor(doctorId);
        const data = JSON.stringify(initialQueue);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      } catch (error) {
        console.error("Error fetching initial queue:", error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Failed to fetch initial queue" })}\n\n`)
        );
      }

      // Listen for queue updates for this specific doctor
      const listener = (event: QueueUpdateEvent) => {
        if (event.doctorId === doctorId) {
          try {
            const data = JSON.stringify(event.queue);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (error) {
            console.error("Error sending queue update:", error);
          }
        }
      };

      queueEmitter.on("queue-update", listener);

      // Send heartbeat every 30 seconds to keep connection alive
      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (error) {
          console.error("Error sending heartbeat:", error);
        }
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener("abort", () => {
        console.log(`SSE connection closed for doctor: ${doctorId}`);
        queueEmitter.off("queue-update", listener);
        clearInterval(intervalId);
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      });
    },

    cancel() {
      console.log(`SSE stream cancelled for doctor: ${doctorId}`);
      if (intervalId) {
        clearInterval(intervalId);
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
