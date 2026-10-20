import React from 'react';
import { Star, MessageSquareQuote, Sparkles, HeartHandshake } from 'lucide-react';

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-20 relative z-10 border-t border-white/5 bg-[#030817]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E84BFF]/10 border border-[#E84BFF]/30 text-[#E84BFF] text-xs font-bold tracking-widest uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HISTÓRIAS DE SUCESSO</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Quem usa, recomenda.
          </h2>
          <p className="text-sm sm:text-base text-[#A9BAD5] mt-3 leading-relaxed">
            Nossa plataforma é construída lado a lado com barbeiros e empreendedores da beleza que buscam alta performance, organização e fidelização.
          </p>
        </div>

        {/* Future Testimonials Placeholder Container (Authentic & Ready for real entries) */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0B1933] via-[#071329] to-[#0B1933] border border-white/10 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D9FF]/10 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E84BFF]/10 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D9FF]/20 to-[#8545FF]/20 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] mx-auto">
              <HeartHandshake className="w-7 h-7" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Histórias reais de barbearias em todo o Brasil
            </h3>

            <p className="text-sm text-[#A9BAD5] max-w-xl mx-auto leading-relaxed">
              Valorizamos a transparência. Publicamos exclusivamente relatos autênticos de clientes cadastrados e homologados. Quer compartilhar os resultados da sua barbearia com o BellaPDV Pro?
            </p>

            <div className="pt-2">
              <a
                href="/legal/contato"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-xs sm:text-sm transition-all"
              >
                <MessageSquareQuote className="w-4 h-4 text-[#00D9FF]" />
                Compartilhar a experiência da sua barbearia
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
