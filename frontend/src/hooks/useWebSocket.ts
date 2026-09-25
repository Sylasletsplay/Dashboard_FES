import { useState, useEffect, useRef, useCallback } from 'react';
import { KatSState, TelemetryState } from '../types/dashboard';

const DEFAULT_STATE: KatSState = {
  alarm_level: 0,
  alarm_title: "Stufe 0 - Normalbetrieb",
  threat_assessment: {
    hochwasser: "Keine Hochwassergefahr (Normal)",
    unwetter: "Keine Unwetterwarnung aktiv",
    kritis: "Regulärer Netz- & Versorgungsbetrieb",
    notes: "Lage ruhig. Keine besonderen Vorkommnisse gemeldet. Regelhafter Stabsdienst-Bereitschaftsmodus."
  },
  incidents: [],
  units: [],
  etb: []
};

export function useWebSocket() {
  const [state, setState] = useState<KatSState>(DEFAULT_STATE);
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    isConnected: false,
    lastPingMs: 0,
    lastUpdate: null,
    eventsReceived: 0,
    isLiveFeed: false,
    serverTime: null,
    connectedClients: 1,
    uptimeSeconds: 0,
    live: {
      last_updated: new Date().toISOString(),
      water_levels: [
        { station: 'Donau / Passau', level_cm: 485, trend: 'gleichbleibend', delta_1h: '+1 cm', danger_level: 0, max_normal: 600 },
        { station: 'Rhein / Köln', level_cm: 244, trend: 'gleichbleibend', delta_1h: '0 cm', danger_level: 0, max_normal: 620 },
        { station: 'Elbe / Dresden', level_cm: 182, trend: 'fallend', delta_1h: '-2 cm', danger_level: 0, max_normal: 400 }
      ],
      weather: {
        temperature_c: 14.5,
        wind_speed_kmh: 22,
        wind_gusts_kmh: 38,
        wind_direction: 'WSW',
        precipitation_mm: 0.2,
        air_pressure_hpa: 1014.2,
        warning_level: 0,
        warning_text: 'Keine akute Unwetterwarnung'
      },
      kritis: {
        power_grid: { status: 'OK', label: 'Stromnetz stabil (50.02 Hz)', load_percent: 68 },
        water_supply: { status: 'OK', label: 'Trinkwasserversorgung 100% nominal', pressure_bar: 4.8 },
        communication: { status: 'OK', label: 'BOS-Digitalfunk & 5G aktiv', redundancy: '2/2 Wege' }
      }
    }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '5173' ? '127.0.0.1:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setTelemetry(prev => ({
          ...prev,
          isConnected: true,
          isLiveFeed: true,
          lastUpdate: new Date()
        }));

        // Start ping heartbeat every 2 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "ping",
              client_time: Date.now()
            }));
          }
        }, 2000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const now = Date.now();

          if (msg.type === "pong") {
            const rtt = msg.client_time ? Math.max(1, now - msg.client_time) : 1;
            setTelemetry(prev => ({
              ...prev,
              lastPingMs: rtt,
              serverTime: msg.server_time,
              connectedClients: msg.connected_clients || 1,
              isLiveFeed: true
            }));
            return;
          }

          setTelemetry(prev => ({
            ...prev,
            eventsReceived: prev.eventsReceived + 1,
            lastUpdate: new Date(),
            isLiveFeed: true
          }));

          if (msg.type === "INITIAL_STATE") {
            setState(msg.data);
            if (msg.live_telemetry) {
              setTelemetry(prev => ({ ...prev, live: msg.live_telemetry }));
            }
          } else if (msg.type === "TELEMETRY_UPDATED") {
            setTelemetry(prev => ({ ...prev, live: msg.data }));
          } else if (msg.type === "ALARM_LEVEL_CHANGED") {
            setState(prev => ({
              ...prev,
              alarm_level: msg.data.alarm_level,
              alarm_title: msg.data.alarm_title,
              etb: msg.data.etb_entry ? [...prev.etb, msg.data.etb_entry] : prev.etb
            }));
          } else if (msg.type === "THREATS_UPDATED") {
            setState(prev => ({
              ...prev,
              threat_assessment: { ...prev.threat_assessment, ...msg.data }
            }));
          } else if (msg.type === "UNIT_UPDATED") {
            setState(prev => ({
              ...prev,
              units: prev.units.map(u => u.id === msg.data.unit.id ? msg.data.unit : u),
              etb: msg.data.etb_entry ? [...prev.etb, msg.data.etb_entry] : prev.etb
            }));
          } else if (msg.type === "UNIT_ADDED") {
            setState(prev => ({
              ...prev,
              units: [...prev.units, msg.data]
            }));
          } else if (msg.type === "UNIT_DELETED") {
            setState(prev => ({
              ...prev,
              units: prev.units.filter(u => u.id !== msg.data.id)
            }));
          } else if (msg.type === "INCIDENT_ADDED") {
            setState(prev => ({
              ...prev,
              incidents: [msg.data.incident, ...prev.incidents],
              etb: msg.data.etb_entry ? [...prev.etb, msg.data.etb_entry] : prev.etb
            }));
          } else if (msg.type === "INCIDENT_UPDATED") {
            setState(prev => ({
              ...prev,
              incidents: prev.incidents.map(inc => inc.id === msg.data.id ? { ...inc, ...msg.data } : inc)
            }));
          } else if (msg.type === "INCIDENT_DELETED") {
            setState(prev => ({
              ...prev,
              incidents: prev.incidents.filter(inc => inc.id !== msg.data.id)
            }));
          } else if (msg.type === "ETB_ADDED") {
            setState(prev => ({
              ...prev,
              etb: [...prev.etb, msg.data]
            }));
          } else if (msg.type === "STATE_RESET") {
            setState(msg.data);
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setTelemetry(prev => ({
          ...prev,
          isConnected: false,
          isLiveFeed: false
        }));
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        // Auto-reconnect after 2s
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error("WebSocket connection error:", err);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(connect, 2000);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendEvent = useCallback((type: string, data?: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn("WebSocket is offline. Event not sent live:", type, data);
    }
  }, []);

  return { state, telemetry, sendEvent };
}
