import React from 'react';
import { X, ArrowRight, CheckCircle2, ShoppingCart, Calendar, Users, Megaphone, Laptop } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ZoomCardData {
  id: 'pdv' | 'agenda' | 'crm' | 'marketing';
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  description: string;
  features: string[];
}

interface CardZoomModalProps {
  card: ZoomCardData | null;
  onClose: () => void;
}

export function CardZoomModal({ card, onClose }: CardZoomModalProps) {
  const navigate = useNavigate();
  if (!card) return null;

  const handleTestNow = () => {
    onClose();
    navigate('/login?demo=true');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#071329] border border-[#00D9FF]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(8,124,255,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#8545FF]/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00D9FF]/15 blur-3xl pointer-events-none rounded-full" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors z-20"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 relative z-10">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{ 
              backgroundColor: `${card.color}15`,
              borderColor: `${card.color}40`,
              color: card.color
            }}
          >
            {card.id === 'pdv' && <ShoppingCart className="w-7 h-7" />}
            {card.id === 'agenda' && <Calendar className="w-7 h-7" />}
            {card.id === 'crm' && <Users className="w-7 h-7" />}
            {card.id === 'marketing' && <Megaphone className="w-7 h-7" />}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider font-bold" style={{ color: card.color }}>
              {card.badge}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {card.title}
            </h3>
            <p className="text-sm text-[#A9BAD5]">{card.subtitle}</p>
          </div>
        </div>

        {/* Description & Feature list */}
        <div className="space-y-4 mb-8 relative z-10">
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed bg-[#0B1933] p-4 rounded-2xl border border-white/5">
            {card.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {card.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: card.color }} />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Mock Preview Box */}
        <div className="bg-[#030817] p-5 rounded-2xl border border-white/10 mb-6 relative z-10">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Módulo Ativo em Tempo Real
            </span>
            <span className="font-mono text-[#00D9FF]">BellaPDV Pro OS</span>
          </div>

          {card.id === 'pdv' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#0B1933] p-3 rounded-xl border border-white/5">
                <div>
                  <div className="text-sm font-bold text-white">Corte Degradê + Barboterapia</div>
                  <div className="text-xs text-slate-400">Barbeiro: Carlos Santos</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#00D9FF]">R$ 65,00</div>
                  <div className="text-[10px] text-emerald-400">Pix Instantâneo</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Comissão calculada automaticamente</span>
                <span className="text-white font-bold">Total: R$ 65,00</span>
              </div>
            </div>
          )}

          {card.id === 'agenda' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1933] border border-[#8545FF]/30">
                <span className="font-mono text-xs font-bold text-[#8545FF]">14:00</span>
                <span className="text-xs font-semibold text-white">Ana Paula — Corte + Escova</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Confirmado WhatsApp</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1933] border border-white/5">
                <span className="font-mono text-xs font-bold text-slate-400">16:00</span>
                <span className="text-xs font-semibold text-white">Carlos Santos — Corte de Cabelo</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Agendado</span>
              </div>
            </div>
          )}

          {card.id === 'crm' && (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Leads</div>
                <div className="text-base font-bold text-white">12</div>
              </div>
              <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Interessados</div>
                <div className="text-base font-bold text-[#00D9FF]">8</div>
              </div>
              <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Agendados</div>
                <div className="text-base font-bold text-[#8545FF]">6</div>
              </div>
              <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase">Atendidos</div>
                <div className="text-base font-bold text-[#E84BFF]">24</div>
              </div>
            </div>
          )}

          {card.id === 'marketing' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B1933] border border-white/5 text-xs">
                <span className="text-slate-300">Confirmação de Lembretes via WhatsApp</span>
                <span className="text-emerald-400 font-bold">ATIVO</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0B1933] border border-white/5 text-xs">
                <span className="text-slate-300">Campanha de Reativação (Clientes 30+ dias)</span>
                <span className="text-[#E84BFF] font-bold">PROGRAMADA</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          <button
            onClick={handleTestNow}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] hover:opacity-95 text-white font-bold text-sm transition-all shadow-[0_0_25px_rgba(8,124,255,0.4)] flex items-center justify-center gap-2"
          >
            <Laptop className="w-4 h-4" />
            Testar Este Módulo no Modo Demonstração
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-sm transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
