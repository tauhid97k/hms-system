import { useEffect, useState, useRef, useCallback } from "react";

type Appointment = {
  id: string;
  serialNumber: number;
  queuePosition: number;
  status: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";
  appointmentType: "NEW" | "FOLLOWUP";
  chiefComplaint: string | null;
  appointmentDate: Date;
  patient: {
    id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string | null;
    phone: string;
  };
  doctor: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  assignedByEmployee: {
    id: string;
    user: {
      name: string;
    };
  };
};

interface UseQueueStreamOptions {
  doctorId: string;
  enabled?: boolean;
  onUpdate?: (queue: Appointment[]) => void;
  onError?: (error: Error) => void;
}

interface UseQueueStreamResult {
  queue: Appointment[];
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

/**
 * Custom hook for subscribing to real-time queue updates via Server-Sent Events (SSE)
 *
 * @param options - Configuration options
 * @returns Queue data and connection status
 *
 * @example
 * ```tsx
 * const { queue, isConnected, error } = useQueueStream({
 *   doctorId: 'doctor-123',
 *   enabled: true,
 *   onUpdate: (queue) => console.log('Queue updated:', queue),
 *   onError: (error) => console.error('Connection error:', error)
 * });
 * ```
 */
export function useQueueStream({
  doctorId,
  enabled = true,
  onUpdate,
  onError,
}: UseQueueStreamOptions): UseQueueStreamResult {
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !doctorId) {
      cleanup();
      return;
    }

    // Close existing connection
    cleanup();

    try {
      const eventSource = new EventSource(
        `/api/queue/stream/${doctorId}`
      );

      eventSource.onopen = () => {
        console.log(`SSE connected for doctor: ${doctorId}`);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Check if it's an error message
          if (data.error) {
            const err = new Error(data.error);
            setError(err);
            onError?.(err);
            return;
          }

          // Update queue data
          setQueue(data);
          onUpdate?.(data);
        } catch (err) {
          console.error("Error parsing SSE message:", err);
          const parseError = new Error("Failed to parse queue data");
          setError(parseError);
          onError?.(parseError);
        }
      };

      eventSource.onerror = (event) => {
        console.error("SSE connection error:", event);
        setIsConnected(false);

        const connectionError = new Error("Queue stream connection lost");
        setError(connectionError);
        onError?.(connectionError);

        // Close the current connection
        eventSource.close();

        // Implement exponential backoff for reconnection
        const maxAttempts = 5;
        const baseDelay = 1000;

        if (reconnectAttemptsRef.current < maxAttempts) {
          const delay =
            baseDelay * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current += 1;

          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error("Max reconnection attempts reached");
          setError(new Error("Unable to reconnect to queue stream"));
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error("Error creating EventSource:", err);
      const initError = new Error("Failed to initialize queue stream");
      setError(initError);
      onError?.(initError);
    }
  }, [doctorId, enabled, cleanup, onUpdate, onError]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [connect, cleanup]);

  return {
    queue,
    isConnected,
    error,
    reconnect,
  };
}
