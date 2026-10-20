import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Crown, ArrowRight, Shield } from 'lucide-react';

interface PlansSectionProps {
  onSelectPlan: (planName: string) => void;
}

export function PlansSection({ onSelectPlan }: PlansSectionProps) {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'basic',
      name: 'Plano Básico',
      price: '89,90',
      period: '/mês',
      description: 'Ideal para profissionais autônomos ou barbearias que estão iniciando a digitalização do caixa.',
      isPopular: false,
      badge: 'INICIANTE',
      features: [
        'Frente de Caixa (PDV) completo',
        'Controle de vendas e formas de pagamento',
        'Cadastro de clientes e histórico de serviços',
        'Fechamento e conferência de caixa',
        '1 unidade operacional',
        'Suporte padrão por e-mail e chamado'
      ],
      limitations: [
        'Até 1 profissional cadastrado',
        'Sem automação de marketing com IA',
        'Sem disparos diretos de WhatsApp'
      ],
      cta: 'Assinar Plano Básico'
    },
    {
      id: 'pro',
      name: 'Plano Pro',
      price: '149,90',
      period: '/mês',
      description: 'A solução ideal para barbearias consolidadas que querem automatizar agendamentos e fidelizar clientes.',
      isPopular: true,
      badge: 'MAIS ESCOLHIDO',
      features: [
        'Tudo incluído no Plano Básico',
        'Agenda Online inteligente com grade de horários',
        'Gestão de múltiplos profissionais e comissões',
        'CRM completo com funil visual Kanban',
        'Relatórios gerenciais e fluxo financeiro',
        'Lembretes de agendamento automáticos',
        'Até 5 profissionais ativos',
        'Suporte prioritário'
      ],
      limitations: [
        'Sem disparos em massa com IA'
      ],
      cta: 'Assinar Plano Pro'
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: '249,90',
      period: '/mês',
      description: 'Poder total para barbearias de alto fluxo e redes que exigem inteligência artificial e escala sem limites.',
      isPopular: false,
      badge: 'COMPLETO VIP',
      features: [
        'Tudo incluído no Plano Pro',
        'Módulo Marketing com Inteligência Artificial',
        'Integração oficial de WhatsApp para lembretes e pós-venda',
        'Programa de Fidelidade e Recompensas',
        'Catálogo público e Totem de Autoatendimento',
        'Profissionais ilimitados na mesma unidade',
        'Acesso multi-dispositivos simultâneos',
        'Atendimento prioritário VIP via WhatsApp'
      ],
      limitations: [],
      cta: 'Assinar Plano Premium'
    }
  ];

  const handlePlanClick = (planName: string) => {
    onSelectPlan(planName);
  };

  return (
    <section id="planos" className="py-24 relative z-10 border-t border-white/5 bg-[#030817]">
      
      {/* Background Glow behind Pro card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#087CFF]/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] text-xs font-bold tracking-widest uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INVESTIMENTO TRANSPARENTE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Planos sob medida para o tamanho do seu negócio
          </h2>
          <p className="text-sm sm:text-base text-[#A9BAD5] mt-3 leading-relaxed">
            Sem taxas ocultas, sem fidelidade abusiva. Escolha o plano que melhor se adapta à rotina da sua barbearia.
          </p>
        </div>

        {/* 3 Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.isPopular
                  ? 'bg-[#0B1933] border-2 border-[#00D9FF] shadow-[0_0_50px_rgba(0,217,255,0.25)] lg:-translate-y-3'
                  : 'bg-[#071329] border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] text-[#030817] font-black text-[11px] tracking-wider uppercase shadow-[0_0_15px_rgba(0,217,255,0.5)]">
                  RECOMENDADO
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {plan.badge}
                  </span>
                  {plan.id === 'premium' && <Crown className="w-5 h-5 text-yellow-400" />}
                </div>

                <h3 className="text-2xl font-extrabold text-white mb-2">
                  {plan.name}
                </h3>

                <p className="text-xs text-[#A9BAD5] leading-relaxed mb-6 min-h-[36px]">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-1.5 pb-6 mb-6 border-b border-white/10">
                  <span className="text-xs text-slate-400 font-medium">R$</span>
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>

                {/* Feature List */}
                <div className="space-y-3 mb-8">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Recursos incluídos:
                  </div>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}

                  {plan.limitations.length > 0 && (
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      {plan.limitations.map((lim, idx) => (
                        <div key={idx} className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          <span>{lim}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handlePlanClick(plan.name)}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  plan.isPopular
                    ? 'bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] hover:brightness-110 text-white shadow-[0_0_25px_rgba(8,124,255,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          ))}
        </div>

        {/* Security guarantee line */}
        <div className="mt-12 text-center flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> Sem fidelidade obrigatória</span>
          <span>•</span>
          <span>Ativação imediata no navegador</span>
          <span>•</span>
          <span>Cancele a qualquer momento com 1 clique</span>
        </div>

      </div>
    </section>
  );
}
