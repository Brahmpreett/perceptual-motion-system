import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import useStore from "../store/useStore";

export type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";

export interface LastSent {
  ts: number;
  payload: string;
}

export function useWebSocket(ip: string) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [lastSent, setLastSent] = useState<LastSent | null>(null);
  const [lastReceived, setLastReceived] = useState<LastSent | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const { setBattery } = useStore();

  useEffect(() => {
    if (!ip) return;

    let reconnectTimer: ReturnType<typeof setTimeout>;
    let isComponentMounted = true;

    const connect = () => {
      setConnectionStatus("CONNECTING");
      const url = `ws://${ip}:8000/ws`;

      try {
        ws.current = new WebSocket(url);
      } catch (error) {
        if (isComponentMounted) setConnectionStatus("DISCONNECTED");
        return;
      }

      ws.current.onopen = () => {
        if (isComponentMounted) setConnectionStatus("CONNECTED");
        toast.success(`Connected to AXIS at ${ip}`);
      };

      ws.current.onmessage = (event) => {
        try {
          const payload = event.data;
          setLastReceived({ ts: Date.now(), payload });
          const message = JSON.parse(payload);
          if (message.status === "low_battery" || message.battery) {
            const level = message.level || message.battery;
            setBattery(level);
            if (message.status === "low_battery") {
              toast.error(`Low Battery: ${level}%`);
            }
          }
        } catch (e) {
          console.error("Error parsing WS message", e);
        }
      };

      ws.current.onclose = () => {
        if (isComponentMounted) {
          setConnectionStatus("DISCONNECTED");
          toast.error("Disconnected from AXIS");
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.current.onerror = () => {
        if (isComponentMounted) setConnectionStatus("DISCONNECTED");
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      clearTimeout(reconnectTimer);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
      }
    };
  }, [ip, setBattery]);

  const sendMessage = useCallback(
    (payload: string) => {
      const ts = Date.now();
      setLastSent({ ts, payload });
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(payload);
      }
    },
    []
  );

  return { sendMessage, connectionStatus, lastSent, lastReceived };
}
