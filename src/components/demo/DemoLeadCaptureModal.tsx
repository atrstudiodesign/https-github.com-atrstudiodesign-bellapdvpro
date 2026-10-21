import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Check, ArrowRight, ShieldCheck, Flame, Lock } from 'lucide-react';
import { useDemoModalStore } from '../../services/demoService';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { trackLeadGenerated, trackTrialStartClick } from '../../services/analyticsService';

export function DemoLeadCaptureModal() {
  const { isModalOpen, featureAttempted, closeDemoModal } = useDemoModalStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      trackLeadGenerated({
        leadType: 'form',
        source: 'demo_lead_capture_modal',
        plan: 'Plano Básico',
        hasBusinessName: !!company.trim()
      });

      trackTrialStartClick({
        source: 'demo_lead_capture_modal',
        plan: 'Plano Básico',
        buttonLabel: 'Continuar para Testar 15 Dias Grátis'
      });

      // Save lead asynchronously
      try {
        await addDoc(collection(db, 'leads'), {
          name: name.trim(),
          companyName: company.trim(),
          phone: whatsapp.trim(),
          email: email.trim().toLowerCase(),
          source: 'demo_interactive_modal',
          featureAttempted: featureAttempted || 'Geral',
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not save lead to firestore:', err);
      }

      toast.success('Excelente! Redirecionando para seu teste grátis de 15 dias...');
      closeDemoModal();
      
      const params = new URLSearchParams({
        signup: 'true',
        email: email.trim().toLowerCase(),
        company: company.trim(),
        name: name.trim(),
        source: 'demo'
      });
      navigate(`/login?${params.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-[#0B1528] p-6 sm:p-8 shadow-[0_0_60px_rgba(0,217,255,0.25)] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeDemoModal}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Promo Ribbon */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black tracking-wide mb-4">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>PROMO: De R$ 89,90 por R$ 29,90/mês nos 3 primeiros meses</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Desbloqueie o BellaPDV Pro
            </h3>
            <p className="text-xs text-cyan-300 font-medium">
              {featureAttempted ? `Recurso: "${featureAttempted}" em modo degustação` : 'Acesso completo operacional'}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          No modo demonstração, as telas estão liberadas para navegação. Para cadastrar dados reais, emitir notas, gerenciar clientes e operar seu caixa, <strong>efetue seu cadastro para testar 15 dias grátis</strong> sem cartão de crédito!
        </p>

        {/* Benefits List */}
        <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>15 dias de teste 100% grátis</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sem fidelidade nem multas</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Promoção R$ 29,90 garantida</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Suporte de implantação</span>
          </div>
        </div>

        {/* Lead Capture Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Seu Nome
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Barbeiro"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nome da Barbearia / Salão
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Barbearia Imperial"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                WhatsApp / Celular
              </label>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Seu E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-[#087CFF] to-[#8545FF] hover:opacity-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,217,255,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
          >
            <span>Continuar para Testar 15 Dias Grátis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-500 mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Seus dados estão protegidos. Teste sem compromisso.</span>
        </p>
      </div>
    </div>
  );
}
