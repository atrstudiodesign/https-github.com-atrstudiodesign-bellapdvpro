import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check, Bug } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; resetError: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  title?: string;
  description?: string;
  /** Whether to render as an inline/card container instead of full screen */
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Gracefully log runtime errors to console with full trace
    console.error('[BellaPDV ErrorBoundary Caught]:', error, errorInfo);

    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (cbErr) {
        console.error('[BellaPDV ErrorBoundary onError callback failed]:', cbErr);
      }
    }
  }

  resetError = (): void => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (resetErr) {
        console.error('[BellaPDV ErrorBoundary onReset callback failed]:', resetErr);
      }
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleCopyDetails = async (): Promise<void> => {
    const { error, errorInfo } = this.state;
    const text = [
      `=== BELLA PDV - RELATÓRIO DE ERRO ===`,
      `Data/Hora: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `Mensagem: ${error?.message || 'Erro desconhecido'}`,
      `Stack do Erro:`,
      error?.stack || 'Sem stack trace',
      `Component Stack:`,
      errorInfo?.componentStack || 'Sem component stack',
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => {
        this.setState({ copied: false });
      }, 2500);
    } catch (err) {
      console.warn('Falha ao copiar detalhes para a área de transferência', err);
    }
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showDetails, copied } = this.state;
    const { children, fallback, inline, title, description } = this.props;

    if (!hasError) {
      return children;
    }

    // Custom fallback provided by caller
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback({
          error: error || new Error('Unknown error'),
          resetError: this.resetError,
        });
      }
      return fallback;
    }

    const heading = title || 'Algo não saiu como esperado';
    const subtext =
      description ||
      'Ocorreu uma falha inesperada na interface. Os dados cadastrados permanecem protegidos e você pode restaurar a visualização a qualquer momento.';

    const containerClasses = inline
      ? 'w-full p-6 my-4 rounded-2xl bg-[#090D1A] border border-red-500/20 shadow-xl'
      : 'min-h-screen w-full flex items-center justify-center p-4 md:p-6 bg-[#05070F] text-slate-100 select-none';

    return (
      <div className={containerClasses}>
        <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
          {/* Glowing Alert Icon */}
          <div className="relative mb-6">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 via-amber-500/20 to-red-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-18 h-18 rounded-2xl bg-gradient-to-br from-red-500/10 to-amber-500/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-950/40">
              <AlertTriangle className="w-9 h-9 text-red-400 drop-shadow-md" />
            </div>
          </div>

          {/* Heading and Scannable Explanation */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/20 mb-3">
            <Bug className="w-3.5 h-3.5 text-red-400" />
            Recuperação de Erro de Execução
          </span>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            {heading}
          </h2>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mb-8">
            {subtext}
          </p>

          {/* Action Buttons: Try Again (Primary), Reload, Home */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <button
              type="button"
              onClick={this.resetError}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar Novamente
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-white border border-slate-700/60 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              Recarregar Página
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-400" />
              Início
            </button>
          </div>

          {/* Technical Details Accordion */}
          {error && (
            <div className="w-full mt-4 text-left border border-slate-800/80 rounded-xl bg-slate-950/60 overflow-hidden">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Bug className="w-3.5 h-3.5 text-slate-500" />
                  Detalhes Técnicos do Erro
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  {showDetails ? (
                    <>
                      Ocultar <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Exibir <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </span>
              </button>

              {showDetails && (
                <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#03050A]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
                      {error.name || 'Error'}
                    </span>
                    <button
                      type="button"
                      onClick={this.handleCopyDetails}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copiar Detalhes</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-300 font-mono text-xs break-words">
                    {error.message || 'Sem mensagem descritiva de erro.'}
                  </div>

                  {error.stack && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                        Rastreamento de Pilha (Stack Trace)
                      </span>
                      <pre className="p-3 rounded-lg bg-slate-900/90 text-slate-400 font-mono text-[11px] overflow-x-auto max-h-40 leading-relaxed">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                        Component Stack (Árvore React)
                      </span>
                      <pre className="p-3 rounded-lg bg-slate-900/90 text-slate-400 font-mono text-[11px] overflow-x-auto max-h-32 leading-relaxed">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
