import React, { ReactNode } from 'react';
import { useFeature } from '../../hooks/useFeature';
import { ShieldAlert, CreditCard, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteByFeatureProps {
  featureName: string;
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export function ProtectedRouteByFeature({
  featureName,
  children,
  fallbackTitle,
  fallbackDescription
}: ProtectedRouteByFeatureProps) {
  const { isAllowed, loading, plan, status } = useFeature(featureName);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-slate-400 min-h-[300px]">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-mono tracking-wider uppercase text-cyan-500/80">Sincronizando Módulos de Licenciamento...</p>
      </div>
    );
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  // Define details for the upgrade screen based on the requested feature name
  const getUpgradeDetails = (fName: string) => {
    const key = fName.toLowerCase();
    if (key.includes('whatsapp')) {
      return {
        title: fallbackTitle || 'Módulo WhatsApp API Exclusivo',
        description: fallbackDescription || 'Disparos automáticos, confirmações de agendas pelo WhatsApp diretamente integrados ao seu fluxo de caixa e agenda sem custos de setup.',
        cta: 'Ativar WhatsApp na Central',
        badge: 'Suporte Atacado WhatsApp'
      };
    }
    if (key.includes('ia') || key.includes('ai') || key.includes('assistant')) {
      return {
        title: fallbackTitle || 'Autopilot com Bella IA Marketing',
        description: fallbackDescription || 'Permita que o algoritmo avalie e dispare campanhas de cashback, cupons e fidelização com zero esforço manual.',
        cta: 'Ativar Bella IA na Conta',
        badge: 'Cérebro Inteligência Artificial'
      };
    }
    if (key.includes('crm')) {
      return {
        title: fallbackTitle || 'CRM de Pacientes & Anamnesis Pro',
        description: fallbackDescription || 'Desbloqueie o funil Kanban completo de leads, pré-atendimentos de estética avançada e acompanhamentos pós-venda.',
        cta: 'Ativar CRM de Negócios',
        badge: 'Fidelização Avançada'
      };
    }

    return {
      title: fallbackTitle || `Módulo Adicional: ${featureName}`,
      description: fallbackDescription || 'Este módulo faz parte de ofertas integradas do ecossistema do seu plano. Solicite ativação na central ou faça um upgrade imediato.',
      cta: 'Ir para Central de Planos',
      badge: 'Expansão de Funcionalidades'
    };
  };

  const details = getUpgradeDetails(featureName);

  return (
    <div className="w-full max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-gradient-to-b from-[#0D1527] to-[#0A0E1A] border border-white/5 shadow-2xl relative overflow-hidden">
      {/* Visual glowing element */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 space-y-6 text-center">
        {/* Shield Icon Block */}
        <div className="inline-flex p-4 rounded-2xl bg-[#090F1E] border border-white/5 shadow-inner">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3" /> UPGRADE REQUIRED
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{details.title}</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">{details.description}</p>
        </div>

        {/* Current Info Panel */}
        <div className="bg-[#080D1A] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-mono">Contrato Vigente</p>
            <p className="text-xs text-slate-300 font-bold">Plano: {plan.toUpperCase()} ({status === 'active' ? 'Ativo' : status})</p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/5 border border-cyan-400/20 px-2.5 py-1 rounded-md uppercase font-bold">
            {details.badge}
          </span>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/marketplace"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black text-xs font-black rounded-xl transition-all font-sans uppercase tracking-wider shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            {details.cta}
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 bg-white/5 text-slate-300 hover:text-white border border-white/10 hover:bg-white/10 text-xs font-bold rounded-xl transition-all font-mono uppercase"
          >
            Sincronizar
          </button>
        </div>
      </div>
    </div>
  );
}
