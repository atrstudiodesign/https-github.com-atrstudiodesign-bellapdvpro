import React from 'react';
import { ShoppingCart, Calendar, Users, Megaphone, ChevronRight, CheckCircle, Plus, Minus } from 'lucide-react';
import { ZoomCardData } from './CardZoomModal';

interface FloatingFeatureCardsProps {
  onCardClick: (card: ZoomCardData) => void;
}

export function FloatingFeatureCards({ onCardClick }: FloatingFeatureCardsProps) {
  const cardsData: ZoomCardData[] = [
    {
      id: 'pdv',
      title: 'Frente de Caixa',
      subtitle: 'Venda rápida e prática.',
      color: '#00D9FF',
      badge: 'PDV ÁGIL',
      description: 'Registre vendas de serviços e produtos em poucos segundos. Adicione descontos, comissões por barbeiro e encerre pelo Pix, cartão ou dinheiro com emissão ágil.',
      features: [
        'Vendas rápidas com 1 clique',
        'Cálculo automático de comissão por profissional',
        'Recebimentos Pix QR Code instantâneo',
        'Controle de abertura e fechamento de caixa'
      ]
    },
    {
      id: 'agenda',
      title: 'Agenda Online',
      subtitle: 'Organize seus atendimentos.',
      color: '#8545FF',
      badge: 'AGENDAMENTO PRO',
      description: 'Visão unificada dos horários da sua equipe. Permita que seus clientes agendem pelo WhatsApp ou link personalizado sem você precisar responder mensagem por mensagem.',
      features: [
        'Grade diária e semanal por barbeiro',
        'Lembretes automáticos via WhatsApp',
        'Bloqueio inteligente de horários de almoço',
        'Link de agendamento público para bio do Instagram'
      ]
    },
    {
      id: 'crm',
      title: 'CRM & Funil',
      subtitle: 'Converta e fidelize clientes.',
      color: '#E84BFF',
      badge: 'RELACIONAMENTO',
      description: 'Tenha o histórico de corte, frequência e gasto de cada cliente em um funil Kanban intuitivo. Saiba exatamente quem está pronto para retornar e quem precisa ser resgatado.',
      features: [
        'Funil visual de clientes em Kanban',
        'Histórico detalhado de preferências e fotos',
        'Identificação de clientes em risco de abandono',
        'Segmentação por ticket médio e frequência'
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing IA',
      subtitle: 'Campanhas automáticas.',
      color: '#087CFF',
      badge: 'AUTOPILOT IA',
      description: 'Inteligência artificial dedicada à sua barbearia. Cria textos persuasivos para promoções, dispara mensagens de aniversário e reativa clientes inativos automaticamente.',
      features: [
        'Disparo automático de lembretes no WhatsApp',
        'Campanha de reativação para clientes há 30+ dias sem cortar',
        'Mensagens de aniversário automáticas com cupom',
        'Gerador de copy para Instagram e WhatsApp com IA'
      ]
    }
  ];

  return (
    <section id="recursos" className="py-12 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section kicker */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00D9FF]">
            FLUXO OPERACIONAL COMPLETO
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            As quatro engrenagens do seu sucesso diário
          </h3>
          <p className="text-xs sm:text-sm text-[#A9BAD5] mt-1">
            Clique em qualquer card para ver a demonstração ampliada do módulo
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CARD 01 — Frente de Caixa */}
          <div
            onClick={() => onCardClick(cardsData[0])}
            className="group cursor-pointer rounded-2xl bg-[#0B1933]/90 hover:bg-[#0E2042] border border-[#00D9FF]/20 hover:border-[#00D9FF]/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_35px_rgba(0,217,255,0.2)] flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/15 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#00D9FF] flex items-center gap-0.5">
                  Expandir <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <h4 className="text-lg font-bold text-white group-hover:text-[#00D9FF] transition-colors">
                Frente de Caixa
              </h4>
              <p className="text-xs text-[#A9BAD5] mb-4">Venda rápida e prática.</p>

              {/* Real UI Mockup Snippet */}
              <div className="bg-[#030817] p-3 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <span className="text-slate-300 font-medium">Corte Simples</span>
                  <div className="flex items-center gap-1.5 bg-[#0B1933] px-2 py-0.5 rounded border border-white/10">
                    <Minus className="w-2.5 h-2.5 text-slate-400" />
                    <span className="font-bold text-white text-[11px]">1</span>
                    <Plus className="w-2.5 h-2.5 text-[#00D9FF]" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 uppercase text-[10px]">TOTAL</span>
                  <span className="font-extrabold text-[#00D9FF] text-sm">R$ 40,00</span>
                </div>

                <div className="w-full py-2 bg-gradient-to-r from-[#00D9FF] to-[#087CFF] rounded-lg text-center text-[#030817] font-extrabold text-xs shadow-[0_0_15px_rgba(0,217,255,0.3)]">
                  FINALIZAR VENDA →
                </div>
              </div>
            </div>
            
            <div className="pt-3 mt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Pix, Cartão e Dinheiro</span>
            </div>
          </div>

          {/* CARD 02 — Agenda Online */}
          <div
            onClick={() => onCardClick(cardsData[1])}
            className="group cursor-pointer rounded-2xl bg-[#0B1933]/90 hover:bg-[#0E2042] border border-[#8545FF]/20 hover:border-[#8545FF]/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_35px_rgba(133,69,255,0.25)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#8545FF]/15 border border-[#8545FF]/30 flex items-center justify-center text-[#8545FF] group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#8545FF] flex items-center gap-0.5">
                  Expandir <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <h4 className="text-lg font-bold text-white group-hover:text-[#8545FF] transition-colors">
                Agenda Online
              </h4>
              <p className="text-xs text-[#A9BAD5] mb-4">Organize seus atendimentos.</p>

              {/* Real UI Mockup Snippet */}
              <div className="bg-[#030817] p-2.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 pb-1 border-b border-white/5">
                  <span className="font-bold text-white">Hoje</span>
                  <span className="text-[#8545FF] font-medium">20 de Outubro</span>
                </div>

                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0B1933] border border-white/5">
                    <span className="font-mono text-slate-400 font-bold">14:00</span>
                    <div className="truncate flex-1">
                      <div className="text-white font-medium truncate">Ana Paula</div>
                      <div className="text-[9px] text-[#A9BAD5] truncate">Corte + Escova</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0B1933] border border-white/5">
                    <span className="font-mono text-slate-400 font-bold">16:00</span>
                    <div className="truncate flex-1">
                      <div className="text-white font-medium truncate">Carlos Santos</div>
                      <div className="text-[9px] text-[#A9BAD5] truncate">Corte de Cabelo</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0B1933] border border-white/5">
                    <span className="font-mono text-slate-400 font-bold">17:30</span>
                    <div className="truncate flex-1">
                      <div className="text-white font-medium truncate">Beatriz Lima</div>
                      <div className="text-[9px] text-[#A9BAD5] truncate">Barba + Corte</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-[#8545FF]" />
              <span>Multi-profissionais sincronizados</span>
            </div>
          </div>

          {/* CARD 03 — CRM & Funil */}
          <div
            onClick={() => onCardClick(cardsData[2])}
            className="group cursor-pointer rounded-2xl bg-[#0B1933]/90 hover:bg-[#0E2042] border border-[#E84BFF]/20 hover:border-[#E84BFF]/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_35px_rgba(232,75,255,0.25)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#E84BFF]/15 border border-[#E84BFF]/30 flex items-center justify-center text-[#E84BFF] group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#E84BFF] flex items-center gap-0.5">
                  Expandir <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <h4 className="text-lg font-bold text-white group-hover:text-[#E84BFF] transition-colors">
                CRM & Funil
              </h4>
              <p className="text-xs text-[#A9BAD5] mb-4">Converta e fidelize clientes.</p>

              {/* Real UI Mockup Snippet */}
              <div className="bg-[#030817] p-2.5 rounded-xl border border-white/5 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Lead</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">12</div>
                  </div>
                  <div className="bg-[#0B1933] p-2 rounded-lg border border-[#00D9FF]/20">
                    <div className="text-[9px] text-[#00D9FF] uppercase font-semibold">Interessado</div>
                    <div className="text-sm font-extrabold text-[#00D9FF] mt-0.5">8</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-[#0B1933] p-2 rounded-lg border border-[#8545FF]/20">
                    <div className="text-[9px] text-[#8545FF] uppercase font-semibold">Agendado</div>
                    <div className="text-sm font-extrabold text-[#8545FF] mt-0.5">6</div>
                  </div>
                  <div className="bg-[#0B1933] p-2 rounded-lg border border-[#E84BFF]/20">
                    <div className="text-[9px] text-[#E84BFF] uppercase font-semibold">Atendido</div>
                    <div className="text-sm font-extrabold text-[#E84BFF] mt-0.5">24</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-[#E84BFF]" />
              <span>Funil Kanban em tempo real</span>
            </div>
          </div>

          {/* CARD 04 — Marketing IA */}
          <div
            onClick={() => onCardClick(cardsData[3])}
            className="group cursor-pointer rounded-2xl bg-[#0B1933]/90 hover:bg-[#0E2042] border border-[#087CFF]/20 hover:border-[#087CFF]/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_35px_rgba(8,124,255,0.25)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#087CFF]/15 border border-[#087CFF]/30 flex items-center justify-center text-[#00D9FF] group-hover:scale-105 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#00D9FF] flex items-center gap-0.5">
                  Expandir <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              <h4 className="text-lg font-bold text-white group-hover:text-[#00D9FF] transition-colors">
                Marketing IA
              </h4>
              <p className="text-xs text-[#A9BAD5] mb-4">Campanhas automáticas.</p>

              {/* Real UI Mockup Snippet */}
              <div className="bg-[#030817] p-2.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#0B1933] border border-white/5 text-[10px]">
                  <span className="text-slate-300 truncate">Confirmação Lembretes</span>
                  <div className="w-6 h-3.5 rounded-full bg-emerald-500 flex items-center justify-end px-0.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#0B1933] border border-white/5 text-[10px]">
                  <span className="text-slate-300 truncate">Reativação de Clientes</span>
                  <div className="w-6 h-3.5 rounded-full bg-[#00D9FF] flex items-center justify-end px-0.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                </div>

                <div className="w-full py-1.5 bg-gradient-to-r from-[#8545FF] to-[#E84BFF] rounded-lg text-center text-white font-bold text-[10px] shadow-[0_0_12px_rgba(232,75,255,0.3)]">
                  Gerar Campanha com IA →
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>Automações com Inteligência Artificial</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
