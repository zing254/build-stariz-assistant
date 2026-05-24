import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastContainer, toast } from '../components/Toast';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render success toast', async () => {
    render(<ToastContainer />);
    
    toast.success('Success message');
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render error toast', async () => {
    render(<ToastContainer />);
    
    toast.error('Error message');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should render info toast', async () => {
    render(<ToastContainer />);
    
    toast.info('Info message');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should remove toast after timeout', async () => {
    render(<ToastContainer />);
    
    toast.success('Temporary message', 100);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.getByText('Temporary message')).toBeInTheDocument();
    
    // Wait for auto-remove
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(screen.queryByText('Temporary message')).not.toBeInTheDocument();
  });
});
