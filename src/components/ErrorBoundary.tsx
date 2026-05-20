import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050510] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-[#0f0f2a] border border-[#ff3366]/30 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff3366]/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-[#ff3366]" />
            </div>

            <h2 className="text-xl font-display font-bold text-white mb-2">
              System Error
            </h2>
            <p className="text-sm font-mono text-white/60 mb-1">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <p className="text-xs font-mono text-white/30 mb-6">
              The STARIZ system encountered an error and needs to recover.
            </p>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-xs font-mono text-[#ff3366]/60 hover:text-[#ff3366] mb-2">
                  Technical Details
                </summary>
                <pre className="bg-[#0a0a1a] border border-[#1a1a3a] rounded p-3 text-[10px] font-mono text-[#ff3366]/80 overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1a1a3a] text-white/60 hover:text-white hover:border-white/30 text-xs font-mono transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff3366] text-xs font-mono hover:bg-[#ff3366]/20 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload App
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
