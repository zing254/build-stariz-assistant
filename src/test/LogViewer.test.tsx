import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LogViewer from '../components/LogViewer';

const mockEntries = [
  {
    timestamp: '2026-05-24T01:00:00',
    source: 'ai',
    type: 'chat',
    level: 'info',
    message: 'AI response generated',
    metadata: { model: 'qwen3:4b', tokens: 150 },
  },
  {
    timestamp: '2026-05-24T01:01:00',
    source: 'system',
    type: 'cpu',
    level: 'warning',
    message: 'CPU usage high',
    metadata: { percent: 85 },
  },
  {
    timestamp: '2026-05-24T01:02:00',
    source: 'voice',
    type: 'stt',
    level: 'error',
    message: 'Speech recognition failed',
    metadata: {},
  },
];

const mockStats = {
  total_entries: 3,
  sources: { ai: 1, system: 1, voice: 1 },
  levels: { debug: 0, info: 1, warning: 1, error: 1 },
  today: 3,
};

describe('LogViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));
    render(<LogViewer />);
    expect(screen.getByText('Loading logs...')).toBeTruthy();
  });

  it('renders header with stats', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ entries: mockEntries, total: 3, offset: 0, limit: 200 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats) });

    render(<LogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Log Viewer')).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText(/3 entries/)).toBeTruthy();
    });
  });

  it('renders log entries', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ entries: mockEntries, total: 3, offset: 0, limit: 200 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats) });

    render(<LogViewer />);

    await waitFor(() => {
      expect(screen.getByText('AI response generated')).toBeTruthy();
      expect(screen.getByText('CPU usage high')).toBeTruthy();
      expect(screen.getByText('Speech recognition failed')).toBeTruthy();
    });
  });

  it('shows empty state when no entries', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ entries: [], total: 0, offset: 0, limit: 200 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ...mockStats, total_entries: 0, sources: {}, today: 0 }) });

    render(<LogViewer />);

    await waitFor(() => {
      expect(screen.getByText('No log entries found')).toBeTruthy();
    });
  });

  it('renders filter dropdowns', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ entries: [], total: 0, offset: 0, limit: 200 }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockStats) });

    render(<LogViewer />);

    await waitFor(() => {
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });
  });
});
