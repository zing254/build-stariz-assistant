// Test setup file for Vitest
import '@testing-library/jest-dom/vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
class WebSocketMock {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: any }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1; // OPEN

  constructor(url: string) {
    // Constructor logic
  }

  send(_data: string) {
    // Mock send
  }

  close() {
    if (this.onclose) this.onclose();
  }
}

global.WebSocket = WebSocketMock as any;

// Mock Notification API
global.Notification = class Notification {
  static permission = 'granted';
  static requestPermission = vi.fn().mockResolvedValue('granted');
  
  constructor(title: string, options?: any) {
    // Constructor logic
  }
} as any;
