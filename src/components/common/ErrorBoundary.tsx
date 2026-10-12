import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onReset?: () => void;
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
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Bắt được lỗi runtime:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Đã xảy ra sự cố khi hiển thị dữ liệu',
        fallbackDescription = 'Hệ thống đã tự động khoanh vùng lỗi để tránh làm gián đoạn các phần khác của ứng dụng.',
      } = this.props;

      return (
        <div className="w-full my-4 p-5 sm:p-6 bg-white border border-rose-200 rounded-lg shadow-sm text-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex-shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {fallbackTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {fallbackDescription}
              </p>

              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded font-mono text-[11px] text-rose-700 overflow-x-auto max-h-32">
                  <div className="font-bold">Chi tiết lỗi:</div>
                  <div className="mt-0.5 whitespace-pre-wrap">
                    {this.state.error.message || String(this.state.error)}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Thử tải lại phân hệ này</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Tải lại toàn bộ trang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
