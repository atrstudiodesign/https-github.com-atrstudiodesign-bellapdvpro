import React from 'react';
import { Sparkles, ArrowRight, Flame, ShieldAlert, LogOut } from 'lucide-react';
import { useDemoModalStore } from '../../services/demoService';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';

export function DemoTopBanner() {
  const { openDemoModal } = useDemoModalStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleExitDemo = async () => {
    await logout();
    navigate('/landing');
  };

  return (
    <div className="bg-gradient-to-r from-[#031525] via-[#061e38] to-[#120f2e] border-b border-cyan-500/30 px-3 sm:px-6 py-2.5 relative z-20 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs">
        
        {/* Left: Info */}
        <div className="flex items-center gap-2.5 text-slate-200 text-center md:text-left">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/40">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-cyan-300 uppercase tracking-wider text-[11px]">
              Modo Demonstração (Degustação):
            </span>
            <span className="text-slate-300 text-[11px] sm:text-xs">
              Todas as telas liberadas para conhecer. Para operar seu negócio real e desbloquear todas as funções, ative seu teste grátis de 15 dias.
            </span>
          </div>
        </div>

        {/* Right: Actions & Promo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black">
            <Flame className="w-3 h-3 fill-current text-emerald-400" />
            <span>De R$ 89,90 por R$ 29,90/mês</span>
          </div>

          <button
            onClick={() => openDemoModal('Barra de Demonstração')}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-[#087CFF] to-[#8545FF] hover:opacity-90 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,217,255,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Cadastrar e Testar 15 Dias Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExitDemo}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            title="Sair do modo de demonstração"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

      </div>
    </div>
  );
}
