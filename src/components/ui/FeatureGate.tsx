import React, { ReactNode } from 'react';
import { useFeature } from '../../hooks/useFeature';
import { Lock, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
}

export function FeatureGate({ 
  featureKey, 
  children, 
  fallback,
  title,
  description 
}: FeatureGateProps) {
  const { isAllowed, loading, plan, status } = useFeature(featureKey);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <p className="text-xs font-mono tracking-wider">Verificando credenciais no Cérebro Comercial...</p>
      </div>
    );
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Get descriptive words for feature
  const getFeatureDetails = () => {
    const key = featureKey.toLowerCase();
    if (key.includes('whatsapp')) {
      return {
        name: 'Disparos Direct WhatsApp API',
        iconColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/20',
        bgGlow: 'shadow-[0_0_50px_rgba(16,185,129,0.1)]',
        cta: 'Ativar Módulo WhatsApp',
        desc: 'Automatize mensagens em lote, lembretes de agendamento automáticos e disparos de retorno de clientes retidos diretamente pelo número do seu salão.'
      };
    }
    if (key.includes('ia') || key.includes('ai') || key.includes('assistant')) {
      return {
        name: 'Cérebro de Inteligência Artificial Estética',
        iconColor: 'text-purple-400',
        borderColor: 'border-purple-500/20',
        bgGlow: 'shadow-[0_0_50px_rgba(168,85,247,0.1)]',
        cta: 'Ativar Bella IA',
        desc: 'Deixe o Autopilot operando: IA analisa a taxa de ociosidade, cria campanhas de resgate automática, e interage por comandos de voz em tempo real.'
      };
    }
    if (key.includes('crm')) {
      return {
        name: 'CRM Avançado & Funil de Conversão',
        iconColor: 'text-blue-400',
        borderColor: 'border-blue-500/20',
        bgGlow: 'shadow-[0_0_50px_rgba(59,130,246,0.1)]',
        cta: 'Contratar Módulo CRM',
        desc: 'Gerencie pipeline de fidelização, mude status de leads, controle anamnese de pacientes e tags exclusivas de forma visual em kanban.'
      };
    }
    if (key.includes('cash') || key.includes('fidelidade')) {
      return {
        name: 'Motor de Cashback & Fidelidade',
        iconColor: 'text-amber-400',
        borderColor: 'border-amber-500/20',
        bgGlow: 'shadow-[0_0_50px_rgba(245,158,11,0.1)]',
        cta: 'Ativar Fidelidade',
        desc: 'Recompense seus clientes vips com saldos de cashback convertidos por pontos, promovendo recorrência garantida para o seu estabelecimento.'
      };
    }
    if (key.includes('white')) {
      return {
        name: 'Plataforma Completa White Label',
        iconColor: 'text-pink-400',
        borderColor: 'border-pink-500/20',
        bgGlow: 'shadow-[0_0_50px_rgba(236,72,153,0.1)]',
        cta: 'Solicitar White Label',
        desc: 'Remova toda e qualquer menção ao nosso SaaS, configure seu próprio subdomínio exclusivo, logotipo e paleta de cores para seus clientes.'
      };
    }
    if (key.includes('market')) {
      return {
        name: 'Marketplace de Fornecedores Nacionais',
        iconColor: 'text-orange-400',
        borderColor: 'border-orange-500/20',
        bgGlow: 'shadow-[0_0_50px_rgba(249,115,22,0.1)]',
        cta: 'Entrar no Marketplace',
        desc: 'Acesse catálogo de marcas com descontos exclusivos de atacado para profissionais credenciados da nossa rede.'
      };
    }
    if (key.includes('mobile') || key.includes('app')) {
      return {
        name: 'Aplicativo Mobile Nativo para Android / iOS',
        iconColor: 'text-indigo-400',
        borderColor: 'border-indigo-500/20',
        bgGlow: 'shadow-[0_0_50px_rgba(99,102,241,0.1)]',
        cta: 'Contratar App Próprio',
        desc: 'Publique seu aplicativo próprio na Apple Store e Google Play com agendamento direto e push-notifications integradas para seus clientes.'
      };
    }

    return {
      name: title || 'Módulo Comercial Adicional',
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/20',
      bgGlow: 'shadow-[0_0_50px_rgba(6,182,212,0.1)]',
      cta: 'Ver Planos Disponíveis',
      desc: description || 'Esta funcionalidade faz parte de pacotes adicionais ou módulos sob demanda desbloqueados através da central de licenciamento comercial.'
    };
  };

  const details = getFeatureDetails();

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${details.borderColor} bg-[#0A0F1D]/80 backdrop-blur-md p-8 text-center max-w-xl mx-auto my-6 ${details.bgGlow}`}>
      {/* Light highlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-[#22D3EE]/30 to-transparent"></div>
      
      <div className="space-y-6">
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-white/5 shadow-inner">
          <Lock className="w-6 h-6 text-slate-500" />
          <div className={`absolute inset-full w-2.5 h-2.5 rounded-full bg-cyan-400 border border-black animate-pulse bottom-0 right-0`} />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] tracking-widest text-[#22D3EE] uppercase font-mono font-black flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> RECURSO INTEGRADO PREMIUM
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">{details.name}</h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">{details.desc}</p>
        </div>

        {status === 'expired' ? (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Sua licença comercial geral expirou em <strong>(Fatura Pendente)</strong>. Regularize para reativar todos os módulos.</span>
          </div>
        ) : (
          <div className="bg-[#111827] border border-white/5 p-3 rounded-lg text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Seu Plano Atual: <strong className="text-white uppercase">{plan}</strong></span>
            <span>Status: <strong className="text-emerald-400 uppercase">Habilitado a Upgrades</strong></span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Link
            to="/marketplace"
            className="px-5 py-2.5 bg-[#22D3EE] text-black text-xs font-black rounded-xl hover:bg-cyan-300 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] focus:outline-none"
          >
            {details.cta}
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-white/5 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all font-mono"
          >
            Sincronizar Licença
          </button>
        </div>
      </div>
    </div>
  );
}
