import { Logo } from './ui/Logo';

export function StartupScreen({ message = 'Preparando seu ambiente…' }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="min-h-screen w-full flex items-center justify-center bg-[#050C1A] text-white px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <div className="rounded-3xl border border-cyan-400/20 bg-[#0C2242] shadow-[0_0_60px_rgba(8,124,255,0.15)] p-6">
          <Logo size="xl" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">BellaPDV Pro</h1>
          <p className="text-xs tracking-[0.2em] uppercase text-cyan-300 mt-2">Gestão inteligente para seu negócio</p>
        </div>
        <div aria-hidden="true" className="w-56 h-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 animate-pulse" />
        </div>
        <p className="text-slate-300 text-sm">{message}</p>
        <p className="text-slate-500 text-xs mt-4">Desenvolvido por ATR Studio</p>
      </div>
    </div>
  );
}
