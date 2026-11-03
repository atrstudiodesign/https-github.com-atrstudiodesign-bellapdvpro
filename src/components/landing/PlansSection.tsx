import React from 'react';
import { Check, ArrowRight, Shield, Zap } from 'lucide-react';
import { trackPlanSelection, trackTrialStartClick } from '../../services/analyticsService';

interface PlansSectionProps {
  onSelectPlan: (planName: string) => void;
}

const includedFeatures = [
  'Frente de Caixa (PDV), vendas e fechamento de caixa',
  'Agenda online, agendamentos e lembretes',
  'Cadastro de clientes, CRM e histórico de serviços',
  'Gestão de profissionais e comissões',
  'Relatórios gerenciais e fluxo financeiro',
  'Marketing com Inteligência Artificial',
  'Integração WhatsApp para lembretes e pós-venda',
  'Fidelidade, recompensas, catálogo e totem',
  'Acesso em múltiplos dispositivos',
  'Suporte e atendimento'
];

const offers = [
  {
    id: 'completo-fidelidade-12m',
    name: 'Bella PDV Pro Completo — Fidelidade 12 meses',
    price: '39,90',
    badge: 'OFERTA FIDELIDADE',
    description: 'Todas as funcionalidades por um valor reduzido com compromisso mínimo de 12 meses.',
    terms: '12 mensalidades de R$ 39,90 (total de R$ 478,80). Condições de cancelamento antecipado informadas antes do aceite.',
    cta: 'Garantir oferta de R$ 39,90',
    featured: true
  },
  {
    id: 'completo-mensal',
    name: 'Bella PDV Pro Completo — Sem fidelidade',
    price: '89,90',
    badge: 'LIBERDADE TOTAL',
    description: 'Todos os mesmos recursos, sem compromisso de permanência.',
    terms: 'Cobrança mensal. Cancele quando quiser, conforme condições de faturamento apresentadas na contratação.',
    cta: 'Escolher plano sem fidelidade',
    featured: false
  }
];

export function PlansSection({ onSelectPlan }: PlansSectionProps) {
  return (
    <section id="planos" className="py-24 relative z-10 border-t border-white/5 bg-[#030817]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex rounded-full px-4 py-2 bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">Uma plataforma completa. Duas formas de contratar.</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-5">Seu negócio completo por R$ 39,90/mês</h2>
          <p className="text-[#A9BAD5] mt-4">Escolha a economia do compromisso de 12 meses ou a flexibilidade do plano mensal. As funcionalidades são as mesmas.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {offers.map((offer) => (
            <article key={offer.id} className={`rounded-3xl p-7 sm:p-9 flex flex-col bg-[#0B1933] ${offer.featured ? 'border-2 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.15)]' : 'border border-white/20'}`}>
              <span className={`text-xs font-extrabold tracking-wider ${offer.featured ? 'text-emerald-300' : 'text-cyan-300'}`}>{offer.badge}</span>
              <h3 className="text-2xl font-bold text-white mt-3">{offer.name}</h3>
              <p className="text-sm text-[#A9BAD5] mt-3 min-h-[44px]">{offer.description}</p>
              <div className="flex items-baseline gap-2 mt-6">
                <span className="text-sm text-slate-300">R$</span>
                <strong className="text-5xl font-black text-white">{offer.price}</strong>
                <span className="text-sm text-slate-400">/mês</span>
              </div>
              <p className="text-xs text-slate-300 mt-3 min-h-[52px]">{offer.terms}</p>
              <div className="border-t border-white/10 mt-6 pt-6 flex-1">
                <p className="text-xs font-bold text-slate-300 mb-4 uppercase">Todos os recursos incluídos</p>
                <div className="space-y-3">
                  {includedFeatures.map(feature => (
                    <div key={feature} className="flex gap-2 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  trackPlanSelection({planId: offer.id, planName: offer.name, price: offer.price, promoPrice: null, isPopular: offer.featured});
                  trackTrialStartClick({source: `plans_card_${offer.id}`, plan: offer.name, buttonLabel: offer.cta});
                  onSelectPlan(offer.name);
                }}
                className={`w-full py-4 rounded-xl font-extrabold text-sm mt-8 flex items-center justify-center gap-2 ${offer.featured ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-[#030817]' : 'bg-gradient-to-r from-[#087CFF] to-[#8545FF] text-white'}`}
              >
                {offer.cta}<ArrowRight className="w-4 h-4" />
              </button>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-400" /> Pagamento seguro</span>
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Ativação após confirmação do pagamento</span>
          <span>Valores e condições exibidos antes da contratação</span>
        </div>
      </div>
    </section>
  );
}
