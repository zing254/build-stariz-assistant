import { useState, useEffect, useCallback, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  [key: string]: any;
}

interface SystemStats {
  cpu_percent: number;
  cpu_count: number;
  memory: {
    total: number;
    available: number;
    used: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
  uptime: number;
  processes: number;
  timestamp: number;
}

interface UsePythonBackendReturn {
  connected: boolean;
  systemStats: SystemStats | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  callTool: (tool: string, params: any) => Promise<any>;
}

const BACKEND_URL = import.meta.env?.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';
const WS_URL = BACKEND_URL.replace('http', 'ws');

export function usePythonBackend(): UsePythonBackendReturn {
  const [connected, setConnected] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/frontend-${Date.now()}`);

      ws.onopen = () => {
        console.log('Connected to Python backend');
        setConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'system_stats' && message.data) {
            setSystemStats(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from Python backend');
        setConnected(false);
        setSystemStats(null);

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < 5) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, 2000 * reconnectAttemptsRef.current);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting to Python backend:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const getEndpoints = useCallback((tool: string): { method: string; url: string; body?: any } => {
    const getEndpoints = new Set([
      'system/info', 'system/cpu', 'system/memory', 'system/disk',
      'system/network', 'system/processes', 'image/to-base64',
    ]);
    const url = `${BACKEND_URL}/api/tools/${tool}`;
    if (getEndpoints.has(tool)) {
      const queryString = Object.keys(params).length
        ? '?' + new URLSearchParams(params).toString()
        : '';
      return { method: 'GET', url: url + queryString };
    }
    return { method: 'POST', url, body: JSON.stringify(params) };
  }, []);

  const callTool = useCallback(async (tool: string, params: any = {}): Promise<any> => {
    try {
      const { method, url, body } = getEndpoints(tool);
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body ? { body } : {}),
      });

      if (!response.ok) {
        throw new Error(`Tool call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling tool ${tool}:`, error);
      throw error;
    }
  }, [getEndpoints]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    systemStats,
    connect,
    disconnect,
    sendMessage,
    callTool,
  };
}
