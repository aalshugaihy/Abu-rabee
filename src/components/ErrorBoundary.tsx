import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the error in the dev console; in production this would go to a tracker.
    console.error('UI error:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
          <div className="card max-w-lg w-full p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={28} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Something went wrong</h1>
            <p className="text-sm text-slate-600 mt-1">حدث خطأ غير متوقع. يمكنك المحاولة مجدداً.</p>
            <pre dir="ltr" className="mt-4 text-start text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-auto max-h-40 text-slate-700 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button type="button" className="btn-secondary" onClick={() => location.reload()}>
                <RefreshCw size={14} /> Reload
              </button>
              <button type="button" className="btn-primary" onClick={this.reset}>
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
