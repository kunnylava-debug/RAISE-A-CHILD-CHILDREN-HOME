import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-200 bg-rose-50/50 shadow-sm text-center my-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900">
              {this.props.title || 'Unable to Load Section'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto">
              An unexpected error occurred while displaying this section. Your records remain safe.
            </p>
            {this.state.error && (
              <p className="text-[11px] font-mono text-rose-700 bg-rose-100/60 py-1.5 px-3 rounded-lg max-w-lg mx-auto mt-2 overflow-x-auto text-left">
                {String(this.state.error?.message || this.state.error)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm inline-flex items-center space-x-2 transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload This Tab</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
