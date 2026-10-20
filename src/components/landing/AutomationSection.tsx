import React from 'react';
import { 
  Zap, 
  BarChart3, 
  UserCheck, 
  Trophy, 
  CheckCircle2, 
  Smartphone, 
  QrCode, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  Sparkles
} from 'lucide-react';

export function AutomationSection() {
  return (
    <section id="automacao" className="py-24 relative z-10 overflow-hidden border-t border-white/5 bg-[#030817]/60">
      
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#087CFF]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#8545FF]/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Top Eyebrow */}
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00D9FF]">
            MAIS QUE UM SISTEMA
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LADO ESQUERDO — Benefícios e Mensagem */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Automação que gera tempo.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF]">
                Gestão que gera resultados.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-[#A9BAD5] leading-relaxed">
              O BellaPDV Pro trabalha para você. Automatize tarefas, encante seus clientes, reduza faltas e tenha o controle total do seu negócio na palma da mão, de onde você estiver.
            </p>

            {/* 4 Benefícios com Ícones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#0B1933] border border-white/5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-[#00D9FF]/15 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF]">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Automatize processos</h4>
                <p className="text-xs text-[#A9BAD5]">Menos tempo em planilhas e mais tempo na cadeira atendendo.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1933] border border-white/5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-[#087CFF]/15 border border-[#087CFF]/30 flex items-center justify-center text-[#087CFF]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Acompanhe indicadores</h4>
                <p className="text-xs text-[#A9BAD5]">Métricas claras de tíquete médio, faturamento e lucro líquido.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1933] border border-white/5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-[#8545FF]/15 border border-[#8545FF]/30 flex items-center justify-center text-[#8545FF]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Atenda melhor clientes</h4>
                <p className="text-xs text-[#A9BAD5]">Histórico completo de cortes, preferências e fotos no CRM.</p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1933] border border-white/5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-[#E84BFF]/15 border border-[#E84BFF]/30 flex items-center justify-center text-[#E84BFF]">
                  <Trophy className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Gestão centralizada</h4>
                <p className="text-xs text-[#A9BAD5]">Controle de estoque, comissões e fechamento sem divergências.</p>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 italic">
              * Demonstração ilustrativa baseada nos módulos operacionais ativos do sistema.
            </div>
          </div>

          {/* LADO DIREITO — Mockup Smartphone e Cards Complementares */}
          <div className="lg:col-span-7 flex flex-col md:flex-row items-center justify-center gap-6 relative">
            
            {/* Phone Mockup (Center) */}
            <div className="relative w-64 sm:w-72 bg-[#050C1A] rounded-[40px] p-3 border-4 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(133,69,255,0.2)]">
              
              {/* Phone Notch/Speaker */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
              </div>

              {/* Phone Screen Display */}
              <div className="bg-[#030817] rounded-[32px] pt-8 pb-4 px-3 text-white overflow-hidden space-y-3">
                
                {/* App Brand Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-light text-[#00D9FF]">Bella</span>
                    <span className="text-xs font-bold text-white">PDV</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                    Ao Vivo
                  </span>
                </div>

                {/* Greeting Card */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#0B1933] to-[#071329] border border-white/5">
                  <div className="text-[10px] text-slate-400">Olá, Pedro!</div>
                  <div className="text-xs font-bold text-white">Hoje você tem 8 agendamentos</div>
                  <div className="text-[9px] text-[#00D9FF] mt-0.5 font-medium">Terça, 20 de Outubro</div>
                </div>

                {/* Appointments List */}
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B1933] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#8545FF]/30 text-[#8545FF] font-bold flex items-center justify-center text-[9px]">
                        AP
                      </div>
                      <div>
                        <div className="text-white font-medium">Ana Paula</div>
                        <div className="text-[8px] text-slate-400">Corte + Escova</div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-[#00D9FF] font-bold">14:00</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B1933] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#00D9FF]/30 text-[#00D9FF] font-bold flex items-center justify-center text-[9px]">
                        CS
                      </div>
                      <div>
                        <div className="text-white font-medium">Carlos Santos</div>
                        <div className="text-[8px] text-slate-400">Corte de Cabelo</div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold">16:00</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B1933] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E84BFF]/30 text-[#E84BFF] font-bold flex items-center justify-center text-[9px]">
                        BL
                      </div>
                      <div>
                        <div className="text-white font-medium">Beatriz Lima</div>
                        <div className="text-[8px] text-slate-400">Barba + Corte</div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-[#8545FF] font-bold">17:30</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B1933] border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-[9px]">
                        LA
                      </div>
                      <div>
                        <div className="text-white font-medium">Lucas Almeida</div>
                        <div className="text-[8px] text-slate-400">Corte Degradê</div>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold">19:00</span>
                  </div>
                </div>

                {/* Bottom App Navigation Bar */}
                <div className="pt-1 flex justify-around text-[8px] text-slate-400 border-t border-white/5">
                  <span className="text-[#00D9FF] font-bold">Agenda</span>
                  <span>Clientes</span>
                  <span>Vendas</span>
                  <span>Mais</span>
                </div>

              </div>

              {/* Floating Badge Top Left */}
              <div className="absolute -top-4 -left-6 bg-[#0B1933]/95 border border-[#00D9FF]/40 rounded-xl p-2.5 shadow-xl backdrop-blur-md hidden sm:block">
                <div className="text-[9px] uppercase font-bold text-slate-400">Exemplo de Cenário</div>
                <div className="text-xs font-extrabold text-[#00D9FF] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  +125% no faturamento
                </div>
                <div className="text-[8px] text-slate-400">simulação ilustrativa</div>
              </div>

              {/* Floating Badge Bottom Right */}
              <div className="absolute -bottom-4 -right-6 bg-[#0B1933]/95 border border-[#E84BFF]/40 rounded-xl p-2.5 shadow-xl backdrop-blur-md hidden sm:block">
                <div className="text-[9px] uppercase font-bold text-slate-400">Retenção de Clientes</div>
                <div className="text-xs font-extrabold text-[#E84BFF] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#E84BFF]" />
                  +18% de recorrência
                </div>
                <div className="text-[8px] text-slate-400">com lembretes de retorno</div>
              </div>

            </div>

            {/* Right Side Info Cards */}
            <div className="w-full sm:w-64 space-y-4">
              
              {/* Card App Android & QR Code */}
              <div className="bg-[#0B1933] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/15 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Gestão na Palma da Mão</div>
                    <div className="text-sm font-bold text-white">App Android & PWA</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#030817] p-2.5 rounded-xl border border-white/5">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                    <QrCode className="w-full h-full text-[#030817]" />
                  </div>
                  <p className="text-[11px] text-[#A9BAD5] leading-snug">
                    Aponte a câmera e conheça a agilidade do sistema no celular.
                  </p>
                </div>
              </div>

              {/* Card "Seu negócio em qualquer lugar" */}
              <div className="bg-[#0B1933] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-bold text-white">Seu negócio em qualquer lugar</div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Acompanhe em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Gerencie sua equipe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Atenda seus clientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Mais liberdade para você</span>
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
