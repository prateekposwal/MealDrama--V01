import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-white">
          <AlertTriangle size={40} className="text-red-400" />
          <p className="text-lg font-bold text-gray-900">Something went wrong</p>
          <p className="text-sm text-gray-500 text-center max-w-md">{this.state.error?.message}</p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={this.handleRetry}
              aria-label="Try again"
              className="px-6 py-3 rounded-[20px] bg-gray-100 text-gray-800 font-bold text-sm active:scale-95 transition-all"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              aria-label="Reload app"
              className="px-6 py-3 rounded-[20px] bg-[#FF385C] text-white font-bold text-sm active:scale-95 transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
