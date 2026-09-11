import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public declare props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BIM Studio Uncaught Exception:', error, errorInfo);
  }

  public handleReset = () => {
    try {
      localStorage.removeItem('bim_studio_autosave_data');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen w-screen bg-slate-950 text-slate-100 p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto text-xl font-bold">
              !
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Workspace Recovery</h2>
              <p className="text-xs text-slate-400 mt-1">
                BIM Studio encountered an unexpected runtime issue while rendering technical drawing elements.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-lg text-left text-xs font-mono text-red-300 overflow-x-auto max-h-32 border border-slate-800">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Reset & Reload Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

