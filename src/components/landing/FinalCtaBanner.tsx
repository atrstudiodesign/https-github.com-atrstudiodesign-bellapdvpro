import React from 'react';
import { Sparkles, CheckCircle2, ChevronRight, Shield, Laptop } from 'lucide-react';

interface FinalCtaBannerProps {
  onRequestDemo: () => void;
}

export function FinalCtaBanner({ onRequestDemo }: FinalCtaBannerProps) {
  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Horizontal Card with Gradient Border */}
        <div className="relative rounded-3xl p-1 bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] shadow-[0_0_60px_rgba(8,124,255,0.3)] overflow-hidden">
          
          <div className="bg-[#071329] rounded-[22px] p-8 sm:p-12 lg:p-14 relative overflow-hidden">
            
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#00D9FF]/15 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#E84BFF]/15 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Icon + Text */}
              <div className="lg:col-span-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D9FF]/20 to-[#8545FF]/20 border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] shadow-[0_0_20px_rgba(0,217,255,0.3)]">
                  <Laptop className="w-6 h-6" />
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Pronto para levar sua barbearia ao próximo nível?
                </h3>

                <p className="text-sm sm:text-base text-[#A9BAD5] max-w-2xl leading-relaxed">
                  Conheça uma solução que conecta atendimento, vendas, agendamentos, clientes e gestão em uma única plataforma feita sob medida para o seu dia a dia.
                </p>

                {/* Subtext info */}
                <div className="pt-2 text-xs text-slate-400">
                  Sem compromisso. Atendimento consultivo e suporte para migração de dados.
                </div>
              </div>

              {/* Right Column: CTA Button + Checklist */}
              <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center space-y-5">
                <button
                  onClick={onRequestDemo}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] hover:brightness-110 text-white font-extrabold text-sm sm:text-base transition-all duration-300 shadow-[0_0_30px_rgba(0,217,255,0.5)] hover:shadow-[0_0_45px_rgba(232,75,255,0.7)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group whitespace-nowrap"
                >
                  <span>Solicite uma demonstração</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Verified Checklist */}
                <div className="space-y-2 text-xs text-slate-300 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instalação rápida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Suporte especializado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sistema 100% na nuvem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>App Android incluso</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
