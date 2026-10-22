import React from 'react';
import { MessageCircle, Mail } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { AtrStudioBadge } from '../ui/AtrStudioBadge';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#030817] text-[#A9BAD5] py-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Logo size="md" />
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-gradient-to-r from-[#00D9FF]/20 to-[#E84BFF]/20 text-[#00D9FF] border border-[#00D9FF]/30">
                PRO
              </span>
            </div>
            
            <p className="text-sm text-slate-300 font-semibold">
              Sistema ERP & PDV Inteligente para Barbearias e Negócios de Beleza.
            </p>
            
            <p className="text-xs text-[#A9BAD5] leading-relaxed max-w-sm">
              Gestão completa de agenda, frente de caixa, CRM, marketing com inteligência artificial e relatórios estratégicos para o crescimento da sua empresa.
            </p>
          </div>

          {/* Navigation Column 1: Navegação */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#inicio" className="hover:text-white transition-colors">Início</a>
              </li>
              <li>
                <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
              </li>
              <li>
                <a href="#solucoes" className="hover:text-white transition-colors">Soluções Completas</a>
              </li>
              <li>
                <a href="#planos" className="hover:text-white transition-colors">Planos & Preços</a>
              </li>
              <li>
                <a href="/marketplace" className="hover:text-white transition-colors">Marketplace</a>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2: Suporte & Legal */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Suporte & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/ajuda" className="hover:text-white transition-colors">Central de Ajuda e Tutoriais</a>
              </li>
              <li>
                <a href="https://wa.me/5511939026928?text=Ol%C3%A1%21%20Quero%20falar%20com%20o%20suporte%20do%20Bella%20PDV%20Pro." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-[#25D366] transition-colors"><MessageCircle className="h-4 w-4" /> Suporte via WhatsApp ATR Studio</a>
              </li>
              <li>
                <a href="mailto:atrstudiodesign@gmail.com" className="inline-flex items-center gap-2 hover:text-white transition-colors"><Mail className="h-4 w-4" /> atrstudiodesign@gmail.com</a>
              </li>
              <li><a href="/instalar/android" className="hover:text-white transition-colors">Como instalar Android</a></li>
              <li><a href="/instalar/windows" className="hover:text-white transition-colors">Como instalar Windows</a></li>
              <li><a href="/como-usar" className="hover:text-white transition-colors">Como usar o Bella PDV</a></li>
              <li>
                <a href="/legal/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</a>
              </li>
              <li>
                <a href="/legal/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</a>
              </li>
              <li>
                <a href="/legal/lgpd" className="hover:text-white transition-colors">Proteção de Dados (LGPD)</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {currentYear} BellaPDV Pro. Todos os direitos reservados.
          </div>

          <div className="flex items-center">
            <AtrStudioBadge size="md" />
          </div>
        </div>

      </div>
    </footer>
  );
}
