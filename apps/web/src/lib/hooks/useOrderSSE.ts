"use client";

import { useEffect, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type OrderSSEEvent = {
  type: string;
  bookingId: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

type UseOrderSSEOptions = {
  bookingId: string;
  token: string;
  onEvent?: (event: OrderSSEEvent) => void;
  enabled?: boolean;
};

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

export function useOrderSSE({ bookingId, token, onEvent, enabled = true }: UseOrderSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!enabled || !token) return;

    const url = `${API_URL}/events/stream?token=${encodeURIComponent(token)}&bookingId=${encodeURIComponent(bookingId)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as OrderSSEEvent;
        onEventRef.current?.(data);
        retriesRef.current = 0; // reset on successful message
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      if (retriesRef.current < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, retriesRef.current);
        retriesRef.current++;
        setTimeout(connect, delay);
      }
    };
  }, [bookingId, token, enabled]);

  useEffect(() => {
    connect();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      retriesRef.current = 0;
    };
  }, [connect]);
}
