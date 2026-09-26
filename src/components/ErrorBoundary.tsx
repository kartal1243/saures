import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Render crash'lerinde karanlık/boş sayfa yerine anlaşılır ekran gösterir. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    console.error('UI hatası yakalandı:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl font-black">
            !
          </div>
          <p className="text-base font-black text-stone-900 dark:text-white">Bir şeyler ters gitti</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs">
            Ekranda bir hata oluştu. Verilerin güvende — sayfayı yenilemen yeterli.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-1 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black shadow-md transition-colors cursor-pointer"
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
