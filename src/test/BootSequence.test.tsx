import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import BootSequence from '../components/BootSequence';

describe('BootSequence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the version and initializing text', () => {
    render(<BootSequence onComplete={vi.fn()} />);
    expect(screen.getByText(/v2\.4\.1/)).toBeTruthy();
    expect(screen.getByText(/Initializing System/)).toBeTruthy();
  });

  it('renders all 6 boot steps', () => {
    render(<BootSequence onComplete={vi.fn()} />);
    expect(screen.getByText('Initializing AI Core')).toBeTruthy();
    expect(screen.getByText('Loading Voice Engine')).toBeTruthy();
    expect(screen.getByText('Connecting RAG Database')).toBeTruthy();
    expect(screen.getByText('Mounting Memory System')).toBeTruthy();
    expect(screen.getByText('Starting Agent Services')).toBeTruthy();
    expect(screen.getByText('Securing Dashboard')).toBeTruthy();
  });

  it('shows step counter', () => {
    render(<BootSequence onComplete={vi.fn()} />);
    expect(screen.getByText(/Step 1 of 6/)).toBeTruthy();
  });

  it('shows the S logo', () => {
    render(<BootSequence onComplete={vi.fn()} />);
    const logos = screen.getAllByText('S');
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onComplete after all steps finish', () => {
    const onComplete = vi.fn();
    render(<BootSequence onComplete={onComplete} />);

    for (let i = 0; i < 200; i++) {
      act(() => {
        vi.advanceTimersByTime(30);
      });
    }

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows loading subsystems message', () => {
    render(<BootSequence onComplete={vi.fn()} />);
    expect(screen.getByText('Loading subsystems...')).toBeTruthy();
  });
});
