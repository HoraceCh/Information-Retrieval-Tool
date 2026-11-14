import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { clearAppStorage } from "../utils/recoveryStorage.mjs";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React Error Boundary:", error, errorInfo);
  }

  private handleReset = () => {
    const confirmed = window.confirm(
      "Clear AI Retrieval Tool data saved in this browser? This removes this app's API keys, settings, history, templates and cache. Other websites' data will not be touched."
    );
    if (!confirmed) return;

    for (const storage of [window.localStorage, window.sessionStorage]) {
      try {
        clearAppStorage(storage);
      } catch (error) {
        console.error("Unable to clear app-scoped browser data:", error);
      }
    }

    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">应用加载异常 / Application Error</h2>
              <p className="text-xs text-slate-400">
                运行环境捕获到了未处理的异常，已暂停渲染以保护界面状态。
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/50 p-3 rounded-lg border border-red-500/20 text-[11px] font-mono text-red-300 overflow-x-auto max-h-32 custom-scrollbar">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                刷新重试 / Reload
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清除本应用数据 / Clear app data
              </button>
            </div>
            <p className="text-[10px] leading-5 text-slate-500">
              仅清除本应用保存的设置、API Key、历史记录和缓存，不会清除同一浏览器中其他网站的数据。
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
