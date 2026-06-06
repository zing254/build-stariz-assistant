// Test setup file for Vitest
import { vi } from 'vitest';
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

  constructor(_url: string) {
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
  
  constructor(_title: string, _options?: any) {
    // Constructor logic
  }
} as any;

// Mock AudioContext to suppress console errors in test (sounds.ts)
const mockAudioCtx = {
  currentTime: 0,
  sampleRate: 44100,
  state: 'running' as AudioContextState,
  destination: {} as AudioDestinationNode,
  createOscillator: () => ({
    connect: vi.fn().mockReturnThis(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    type: 'sine',
  }),
  createGain: () => ({
    connect: vi.fn().mockReturnThis(),
    gain: {
      value: 0.3,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  }),
  close: vi.fn(),
  resume: vi.fn(),
};
window.AudioContext = vi.fn(() => mockAudioCtx) as unknown as typeof AudioContext;
(window as any).webkitAudioContext = window.AudioContext;
