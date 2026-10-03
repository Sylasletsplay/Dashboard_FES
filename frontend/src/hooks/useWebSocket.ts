import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryState, RefreshStatus, RefreshWidget } from '../types/dashboard';

// Backend WebSocket URL, set per environment in .env.development / .env.production.
const WS_URL = import.meta.env.VITE_WS_URL;

// Keeps the connection alive; the backend drops clients silent for 90s.
const HEARTBEAT_INTERVAL_MS = 25000;
const RECONNECT_DELAY_MS = 2000;
// How long the result of a refresh stays visible on the button.
const REFRESH_RESULT_VISIBLE_MS = 3000;
// Give up waiting for the server's REFRESH_RESULT after this long.
const REFRESH_RESPONSE_TIMEOUT_MS = 20000;

export function useWebSocket() {
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    isConnected: false,
    lastUpdate: null,
    live: null,
  });
  const [refreshStatus, setRefreshStatus] = useState<Partial<Record<RefreshWidget, RefreshStatus>>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const refreshTimersRef = useRef<Partial<Record<RefreshWidget, number>>>({});

  const setRefreshTimer = (widget: RefreshWidget, fn: () => void, ms: number) => {
    const timers = refreshTimersRef.current;
    if (timers[widget]) clearTimeout(timers[widget]);
    timers[widget] = window.setTimeout(fn, ms);
  };

  // Show a refresh outcome on the button, then return it to idle.
  const showRefreshResult = (widget: RefreshWidget, status: RefreshStatus['status'], retryIn?: number) => {
    setRefreshStatus(prev => ({ ...prev, [widget]: { status, retryIn } }));
    setRefreshTimer(widget, () => {
      setRefreshStatus(prev => {
        const next = { ...prev };
        delete next[widget];
        return next;
      });
    }, REFRESH_RESULT_VISIBLE_MS);
  };

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
    };

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setTelemetry(prev => ({ ...prev, isConnected: true }));
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        heartbeatRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, HEARTBEAT_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INITIAL_STATE' && msg.live_telemetry) {
            setTelemetry(prev => ({ ...prev, live: msg.live_telemetry, lastUpdate: new Date() }));
          } else if (msg.type === 'TELEMETRY_UPDATED') {
            setTelemetry(prev => ({ ...prev, live: msg.data, lastUpdate: new Date() }));
          } else if (msg.type === 'REFRESH_RESULT') {
            const { widget, status, retry_in } = msg.data;
            showRefreshResult(widget, status === 'skipped' ? 'cooldown' : status, retry_in);
          }
        } catch (e) {
          console.error('Failed to parse websocket message', e);
        }
      };

      ws.onclose = () => {
        setTelemetry(prev => ({ ...prev, isConnected: false }));
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      scheduleReconnect();
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      Object.values(refreshTimersRef.current).forEach(t => clearTimeout(t));
      if (wsRef.current) {
        wsRef.current.onclose = null; // don't schedule a reconnect after unmount
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const refreshWidget = useCallback((widget: RefreshWidget) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showRefreshResult(widget, 'error');
      return;
    }
    setRefreshStatus(prev => ({ ...prev, [widget]: { status: 'loading' } }));
    wsRef.current.send(JSON.stringify({ type: 'REFRESH_TELEMETRY', data: { widget } }));
    // No answer (e.g. connection dropped mid-request) -> show an error
    setRefreshTimer(widget, () => showRefreshResult(widget, 'error'), REFRESH_RESPONSE_TIMEOUT_MS);
  }, []);

  return { telemetry, refreshStatus, refreshWidget };
}
