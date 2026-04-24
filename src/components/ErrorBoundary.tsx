import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught a render error:', error, info);
    this.setState({ info });
  }

  private handleReset = () => {
    this.setState({ error: null, info: null });
  };

  private handleHome = () => {
    this.setState({ error: null, info: null });
    window.location.assign('/');
  };

  render() {
    const { error, info } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="mx-auto max-w-2xl space-y-6 py-10">
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50/80 p-8 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/20">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-rose-700 dark:text-rose-300">
                Clinical module error
              </p>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Something interrupted this view.
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                The rest of the app is still safe. You can retry this section or head back to the care hub.
              </p>
              <p className="mt-2 rounded-xl bg-background/70 px-3 py-2 font-mono text-xs text-muted-foreground">
                {error.message || 'Unknown render error'}
              </p>
              {info?.componentStack ? (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-semibold">Technical detail</summary>
                  <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-xl bg-background/70 p-3 text-[11px]">
                    {info.componentStack}
                  </pre>
                </details>
              ) : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Retry
                </button>
                <button
                  onClick={this.handleHome}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-foreground hover:bg-muted"
                >
                  <Home className="h-4 w-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
