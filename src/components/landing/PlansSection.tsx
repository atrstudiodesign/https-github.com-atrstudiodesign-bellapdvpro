import { BELLA_COMMERCIAL_PLANS } from '../../lib/commercialPlans';
import React from 'react';
import { Check, Sparkles, Crown, ArrowRight, Shield, Zap, Gift, Flame } from 'lucide-react';
import { trackTrialStartClick, trackPlanSelection } from '../../services/analyticsService';

interface PlansSectionProps {
  onSelectPlan: (planName: string) => void;
}

export function PlansSection({ onSelectPlan }: PlansSectionProps) {
  const plans = [
    {
      id: 'basic',
      name: 'Plano Básico',
      regularPrice: BELLA_COMMERCIAL_PLANS.basic.regularPrice,
      promoPrice: BELLA_COMMERCIAL_PLANS.basic.promoPrice,
      period: '/mês',
      hasPromo: true,
      promoHighlightText: 'De R$ 89,90 por apenas R$ 29,90 nos primeiros 3 meses',
      trialBadge: '15 dias de teste grátis',
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
      cta: 'Começar com 15 Dias Grátis'
    },
    {
      id: 'pro',
      name: 'Plano Pro',
      regularPrice: BELLA_COMMERCIAL_PLANS.pro.regularPrice,
      promoPrice: BELLA_COMMERCIAL_PLANS.pro.promoPrice,
      period: '/mês',
      hasPromo: false,
      promoHighlightText: null,
      trialBadge: '15 dias de teste grátis',
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
      regularPrice: BELLA_COMMERCIAL_PLANS.premium.regularPrice,
      promoPrice: BELLA_COMMERCIAL_PLANS.premium.promoPrice,
      period: '/mês',
      hasPromo: false,
      promoHighlightText: null,
      trialBadge: '15 dias de teste grátis',
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

  return (
    <section id="planos" className="py-24 relative z-10 border-t border-white/5 bg-[#030817]">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#087CFF]/10 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#00D9FF]/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#8545FF]/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          
          {/* Main Promotional Pill */}
          <div 
            onClick={() => {
              trackTrialStartClick({
                source: 'plans_header_pill',
                plan: 'Plano Básico',
                promoText: 'De R$ 89,90 por apenas R$ 29,90 nos primeiros 3 meses',
                buttonLabel: 'OFERTA ESPECIAL'
              });
              onSelectPlan('Plano Básico');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 via-[#00D9FF]/20 to-[#8545FF]/20 border border-emerald-400/50 text-emerald-300 text-xs sm:text-sm font-extrabold tracking-wide mb-4 shadow-[0_0_30px_rgba(52,211,153,0.3)] animate-pulse cursor-pointer hover:border-emerald-300 transition-colors"
          >
            <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>OFERTA ESPECIAL: De R$ 89,90 por apenas R$ 29,90 nos primeiros 3 meses</span>
            <span className="hidden sm:inline bg-emerald-400 text-[#030817] font-black text-[10px] px-2 py-0.5 rounded-full ml-1 uppercase">
              15 dias de teste grátis
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Planos sob medida para o tamanho do seu negócio
          </h2>
          <p className="text-sm sm:text-base text-[#A9BAD5] mt-3 leading-relaxed">
            Sem fidelidade e sem pegadinhas. Comece agora com <strong className="text-white font-bold">15 dias de teste grátis</strong> e aproveite a promoção exclusiva do Plano Básico de <strong className="text-emerald-300">R$ 89,90 por apenas R$ 29,90</strong> nos primeiros 3 meses.
          </p>
        </div>

        {/* 3 Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                plan.isPopular
                  ? 'bg-[#0B1933] border-2 border-[#00D9FF] shadow-[0_0_50px_rgba(0,217,255,0.25)] lg:-translate-y-3 ring-1 ring-[#00D9FF]/40'
                  : plan.hasPromo
                  ? 'bg-[#08172E] border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(52,211,153,0.2)] lg:-translate-y-1'
                  : 'bg-[#071329] border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Popular Badge for Pro */}
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] text-[#030817] font-black text-[11px] tracking-wider uppercase shadow-[0_0_20px_rgba(0,217,255,0.6)]">
                  RECOMENDADO
                </div>
              )}

              {/* Special Promotion Badge for Basic */}
              {plan.hasPromo && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-[#030817] font-black text-[11px] tracking-wider uppercase shadow-[0_0_25px_rgba(52,211,153,0.7)] flex items-center gap-1.5 whitespace-nowrap">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>15 DIAS DE TESTE GRÁTIS</span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${plan.hasPromo ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {plan.badge}
                  </span>
                  {plan.id === 'premium' && <Crown className="w-5 h-5 text-yellow-400" />}
                  {plan.hasPromo && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      OFERTA ATIVA
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  {plan.name}
                </h3>

                <p className="text-xs text-[#A9BAD5] leading-relaxed mb-5 min-h-[44px]">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="pb-6 mb-6 border-b border-white/10">
                  {plan.hasPromo ? (
                    <div>
                      {/* Highlight Box with requested text */}
                      <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-black tracking-wide flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
                        <span>De R$ 89,90 por apenas R$ 29,90 nos primeiros 3 meses</span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-slate-400 line-through font-semibold">De R$ {plan.regularPrice}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                          ECONOMIZE R$ 60/MÊS
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm text-slate-300 font-medium">Por apenas R$</span>
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                          {plan.promoPrice}
                        </span>
                        <span className="text-xs text-slate-400">{plan.period}</span>
                      </div>
                      
                      <p className="text-[11px] text-cyan-300 font-medium mt-1.5">
                        Válido nos 3 primeiros meses <span className="text-slate-400 font-normal">• após, R$ {plan.regularPrice}/mês</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-slate-400 font-medium">R$</span>
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                          {plan.regularPrice}
                        </span>
                        <span className="text-xs text-slate-400">{plan.period}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        Faturamento mensal sem fidelidade
                      </p>
                    </div>
                  )}

                  {/* Prominent Badge for 15 Days Free Trial */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 text-[11px] font-extrabold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{plan.trialBadge}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Sem cartão de crédito</span>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-3 mb-8">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    RECURSOS INCLUÍDOS:
                  </div>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}

                  {plan.limitations.length > 0 && (
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      {plan.limitations.map((lim, idx) => (
                        <div key={idx} className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                          <span>{lim}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  trackPlanSelection({
                    planId: plan.id,
                    planName: plan.name,
                    price: plan.regularPrice,
                    promoPrice: plan.promoPrice,
                    isPopular: plan.isPopular
                  });
                  trackTrialStartClick({
                    source: `plans_card_${plan.id}`,
                    plan: plan.name,
                    promoText: plan.promoHighlightText || undefined,
                    buttonLabel: plan.cta
                  });
                  onSelectPlan(plan.name);
                }}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  plan.hasPromo
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-[#00D9FF] hover:brightness-110 text-[#030817] font-black shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                    : plan.isPopular
                    ? 'bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] hover:brightness-110 text-white shadow-[0_0_25px_rgba(8,124,255,0.4)]'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:border-[#00D9FF]/40'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          ))}
        </div>

        {/* Security guarantee line */}
        <div className="mt-12 text-center flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Shield className="w-4 h-4 text-emerald-400" /> 15 dias de teste grátis em todos os planos
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> Ativação imediata no navegador
          </span>
          <span className="hidden sm:inline">•</span>
          <span>Sem fidelidade obrigatória • Cancele quando quiser</span>
        </div>

      </div>
    </section>
  );
}
