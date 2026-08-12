import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production, error telemetry can be recorded here securely without leaking to DOM
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an unhandled component error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">
            Something went wrong
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
            The application encountered an unexpected display issue. Your attendance records and session data remain safe.
          </p>

          <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleGoHome}
              leftIcon={<Home className="w-3.5 h-3.5" />}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
