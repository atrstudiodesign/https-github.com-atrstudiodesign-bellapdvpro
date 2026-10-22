import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight, Sparkles } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { trackTrialStartClick, trackDemoRequestClick, trackEvent } from '../../services/analyticsService';

interface LandingHeaderProps {
  onRequestDemo: () => void;
}

export function LandingHeader({ onRequestDemo }: LandingHeaderProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('inicio');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['inicio', 'recursos', 'solucoes', 'automacao', 'depoimentos', 'planos'];
      const scrollPosition = window.scrollY + 120;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'inicio', label: 'Início', href: '#inicio' },
    { id: 'recursos', label: 'Recursos', href: '#recursos' },
    { id: 'planos', label: 'Planos', href: '#planos' },
    { id: 'depoimentos', label: 'Depoimentos', href: '#depoimentos' },
    { id: 'marketplace', label: 'Marketplace', href: '/marketplace', isRoute: true },
    { id: 'instalar', label: 'Instalar', href: '#baixar-android' },
    { id: 'ajuda', label: 'Ajuda', href: '/ajuda', isRoute: true },
  ];

  const handleNavClick = (link: typeof navLinks[0], e: React.MouseEvent) => {
    if (link.isRoute) {
      e.preventDefault();
      setMobileMenuOpen(false);
      navigate(link.href);
      return;
    }

    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveSection(link.id);
    const target = document.getElementById(link.id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#030817]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-[#030817]/80 backdrop-blur-md border-b border-transparent'
      }`}
    >
      {/* Top Promotional Announcement Bar */}
      <div className="bg-gradient-to-r from-[#030817] via-[#071329] to-[#030817] border-b border-[#00D9FF]/25 py-1.5 px-3 text-center text-[11px] sm:text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            15 DIAS DE TESTE GRÁTIS
          </span>
          <span>Oferta exclusiva: De <span className="line-through text-slate-400">R$ 89,90</span> por apenas <strong className="text-white font-extrabold text-[#00D9FF]">R$ 29,90 nos primeiros 3 meses</strong></span>
          <a 
            href="#planos" 
            onClick={() => {
              trackTrialStartClick({
                source: 'header_announcement_bar',
                promoText: 'De R$ 89,90 por R$ 29,90 nos primeiros 3 meses',
                buttonLabel: 'Aproveitar oferta'
              });
            }}
            className="text-[#00D9FF] hover:text-white underline font-bold inline-flex items-center gap-0.5"
          >
            Aproveitar oferta <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
        
        {/* Left: BellaPDV Pro Logo */}
        <div 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setActiveSection('inicio');
          }}
          className="cursor-pointer flex items-center gap-2 group"
        >
          <Logo size="md" />
          <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-[#00D9FF]/20 to-[#E84BFF]/20 text-[#00D9FF] border border-[#00D9FF]/30 ml-0.5 shadow-[0_0_10px_rgba(0,217,255,0.2)]">
            PRO
          </span>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id && !link.isRoute;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(link, e)}
                className={`relative py-2 text-sm transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'text-white font-semibold' 
                    : 'text-[#A9BAD5] hover:text-white'
                }`}
              >
                {link.label}
                {/* Luminous underline on active */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#8545FF] shadow-[0_0_12px_rgba(0,217,255,0.8)]" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-3.5">
          <button
            onClick={() => {
              trackEvent('login_click', { source: 'header_desktop' });
              navigate('/login');
            }}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          >
            Entrar
          </button>
          
          <button
            onClick={() => {
              trackDemoRequestClick({
                source: 'header_desktop_cta',
                buttonLabel: 'Solicite uma demonstração'
              });
              onRequestDemo();
            }}
            className="relative group overflow-hidden px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white transition-all duration-300 shadow-[0_0_20px_rgba(8,124,255,0.4)] hover:shadow-[0_0_30px_rgba(0,217,255,0.6)] hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF]"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Solicite uma demonstração
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#071329] border-b border-white/10 px-6 py-6 space-y-4 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(link, e)}
                className="text-base font-medium text-slate-300 hover:text-white py-1 flex items-center justify-between border-b border-white/5 pb-2"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </a>
            ))}
          </nav>
          
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => {
                trackEvent('login_click', { source: 'header_mobile' });
                setMobileMenuOpen(false);
                navigate('/login');
              }}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm"
            >
              Entrar no Sistema
            </button>
            <button
              onClick={() => {
                trackDemoRequestClick({
                  source: 'header_mobile_cta',
                  buttonLabel: 'Solicite uma demonstração'
                });
                setMobileMenuOpen(false);
                onRequestDemo();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] text-white font-bold text-sm shadow-[0_0_20px_rgba(8,124,255,0.4)] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Solicite uma demonstração
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
