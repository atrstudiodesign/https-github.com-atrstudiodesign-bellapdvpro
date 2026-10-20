import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, MessageSquare, Play, Shield, Laptop } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPlan?: string;
}

export function DemoModal({ isOpen, onClose, preselectedPlan }: DemoModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleWhatsAppContact = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Olá! Tenho interesse em uma demonstração do BellaPDV Pro.\n\n` +
      `Nome: ${name || 'Não informado'}\n` +
      `Barbearia/Negócio: ${businessName || 'Minha Barbearia'}\n` +
      `WhatsApp: ${cleanPhone || 'Não informado'}` +
      (preselectedPlan ? `\nPlano de interesse: ${preselectedPlan}` : '')
    );
    // WhatsApp comercial oficial ATR Studio / BellaPDV
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank');
    setSubmitted(true);
  };

  const handleStartDemoNow = () => {
    onClose();
    navigate('/login?demo=true');
  };

  const handleCreateAccount = () => {
    onClose();
    navigate(`/login?signup=true${preselectedPlan ? `&plan=${encodeURIComponent(preselectedPlan)}` : ''}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-[#071329] border border-[#00D9FF]/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,217,255,0.15)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cyber background glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#087CFF]/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8545FF]/15 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors z-20"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#087CFF]/10 border border-[#087CFF]/30 text-[#00D9FF] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ATENDIMENTO PERSONALIZADO</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Solicite uma demonstração do <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF]">BellaPDV Pro</span>
          </h3>
          <p className="text-sm text-[#A9BAD5] mt-2">
            Descubra em detalhes como organizar agendamentos, acelerar suas vendas no caixa e fidelizar seus clientes.
          </p>
        </div>

        {/* Quick Instant Demo Option */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#087CFF]/20 to-[#8545FF]/20 border border-[#00D9FF]/40 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/20 border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#00D9FF] font-bold">Acesso Imediato</div>
              <div className="text-sm font-bold text-white">Explorar o Sistema Agora</div>
            </div>
          </div>
          <button
            onClick={handleStartDemoNow}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#00D9FF] to-[#087CFF] hover:brightness-110 text-[#030817] font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(0,217,255,0.3)] flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Entrar em Demonstração
          </button>
        </div>

        {/* Form to request personalized consultation */}
        {!submitted ? (
          <form onSubmit={handleWhatsAppContact} className="space-y-4 relative z-10">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Ou receba um contato no WhatsApp da sua barbearia:
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A9BAD5] mb-1">Seu Nome</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="w-full px-4 py-3 bg-[#0B1933] border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00D9FF] transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#A9BAD5] mb-1">Nome da Barbearia</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Barbearia Vip Club"
                  className="w-full px-4 py-3 bg-[#0B1933] border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00D9FF] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#A9BAD5] mb-1">WhatsApp com DDD</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 bg-[#0B1933] border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00D9FF] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] hover:opacity-95 text-white font-bold text-sm transition-all shadow-[0_0_25px_rgba(8,124,255,0.4)] flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Conversar pelo WhatsApp
              </button>
              <button
                type="button"
                onClick={handleCreateAccount}
                className="py-3.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                Criar Conta Grátis
                <ArrowRight className="w-4 h-4 text-[#00D9FF]" />
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center relative z-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Solicitação Encaminhada!</h4>
            <p className="text-xs text-[#A9BAD5]">
              Nossa equipe especializada entrará em contato em instantes para apresentar todos os recursos do BellaPDV Pro.
            </p>
            <button
              onClick={handleStartDemoNow}
              className="mt-3 px-5 py-2.5 bg-[#00D9FF] text-[#030817] font-bold text-xs rounded-xl"
            >
              Enquanto isso, testar a demonstração ao vivo
            </button>
          </div>
        )}

        {/* Security & Guarantee Note */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-6 text-[11px] text-slate-400 relative z-10">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Sem fidelidade</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Ativação em minutos</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Suporte dedicado</span>
        </div>
      </div>
    </div>
  );
}
