import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  BarChart3, 
  Users, 
  Crown, 
  Check, 
  Smartphone, 
  Cloud, 
  Headphones, 
  Search, 
  Bot, 
  DollarSign, 
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

interface HeroSectionProps {
  onRequestDemo: () => void;
  onOpenHowItWorks: () => void;
}

export function HeroSection({ onRequestDemo, onOpenHowItWorks }: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <section id="inicio" className="relative pt-32 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
      
      {/* Background Cyber Ambient Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-[#087CFF]/15 via-[#8545FF]/10 to-[#E84BFF]/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-10 left-10 w-[400px] h-[400px] bg-[#00D9FF]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#8545FF]/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LADO ESQUERDO — Mensagem Comercial */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Promo Ribbon */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-[#00D9FF]/20 to-[#8545FF]/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(52,211,153,0.25)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OFERTA: De <span className="line-through text-slate-400">R$ 89,90</span> por apenas <strong className="text-white font-black">R$ 29,90 nos primeiros 3 meses</strong> • 15 dias de teste grátis!</span>
            </div>

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,217,255,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-[#00D9FF]" />
              <span>TECNOLOGIA QUE TRANSFORMA BARBEARIAS</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              <span className="text-white">Bella</span>
              <span className="text-[#00D9FF]">PDV</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8545FF] via-[#E84BFF] to-[#00D9FF]">
                Pro
              </span>
            </h1>

            {/* Subtitle */}
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              Sistema ERP & PDV Inteligente para Barbearias e Negócios de Beleza
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#A9BAD5] leading-relaxed max-w-xl">
              Gestão completa, mais vendas e clientes mais fiéis. Da agenda ao caixa, tenha todas as ferramentas necessárias para administrar e expandir sua barbearia em um só lugar.
            </p>

            {/* 4 Feature Badges (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-3 pt-2 max-w-lg">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0B1933]/80 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#E84BFF]/15 border border-[#E84BFF]/30 flex items-center justify-center text-[#E84BFF] shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mais vendas</div>
                  <div className="text-[11px] text-[#A9BAD5]">Mais clientes</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0B1933]/80 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/15 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mais automação</div>
                  <div className="text-[11px] text-[#A9BAD5]">Menos trabalho manual</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0B1933]/80 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#087CFF]/15 border border-[#087CFF]/30 flex items-center justify-center text-[#087CFF] shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mais controle</div>
                  <div className="text-[11px] text-[#A9BAD5]">Gestão completa</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0B1933]/80 border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#8545FF]/15 border border-[#8545FF]/30 flex items-center justify-center text-[#8545FF] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mais fidelização</div>
                  <div className="text-[11px] text-[#A9BAD5]">Relacionamento ativo</div>
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={onRequestDemo}
                className="group px-7 py-4 rounded-full bg-gradient-to-r from-[#00D9FF] via-[#087CFF] to-[#E84BFF] hover:brightness-110 text-white font-extrabold text-sm sm:text-base transition-all duration-300 shadow-[0_0_35px_rgba(8,124,255,0.45)] hover:shadow-[0_0_50px_rgba(0,217,255,0.65)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span>Solicite uma demonstração</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenHowItWorks}
                className="px-6 py-4 rounded-full bg-[#0B1933]/80 hover:bg-[#0B1933] text-white font-bold text-sm sm:text-base border border-white/15 hover:border-[#00D9FF]/50 transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg group"
              >
                <div className="w-6 h-6 rounded-full bg-white/10 group-hover:bg-[#00D9FF]/20 flex items-center justify-center text-[#00D9FF] transition-colors">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
                <span>Ver como funciona</span>
              </button>
            </div>

            {/* Bottom Trust Indicators */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#A9BAD5] font-medium border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>Instalação rápida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>Suporte especializado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>100% na nuvem</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>App Android</span>
              </div>
            </div>

          </div>

          {/* LADO DIREITO — Produto em Destaque (Mockup de Notebook Premium) */}
          <div className="lg:col-span-6 relative flex flex-col items-center">
            
            {/* Ambient Lighting & Barber Atmosphere Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00D9FF]/20 via-[#087CFF]/20 to-[#8545FF]/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />
            
            {/* Floating Top Script Slogan */}
            <div className="self-end mb-2 pr-4 hidden sm:block">
              <span className="text-sm font-medium italic text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] to-[#E84BFF] tracking-wide drop-shadow-[0_0_10px_rgba(0,217,255,0.4)]">
                Tecnologia que impulsiona sua barbearia
              </span>
            </div>

            {/* Notebook Outer Chassis */}
            <div className="w-full max-w-2xl bg-[#030817] p-2.5 sm:p-3.5 rounded-t-2xl sm:rounded-t-3xl border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(0,217,255,0.15)] relative z-10 transition-transform duration-500 hover:scale-[1.01]">
              
              {/* Notebook Top Bezel & Camera */}
              <div className="flex items-center justify-center pb-2 relative">
                <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <div className="w-0.5 h-0.5 rounded-full bg-[#00D9FF]/70" />
                </div>
              </div>

              {/* Notebook Screen Content (True BellaPDV Pro UI) */}
              <div className="bg-[#050C1A] rounded-xl overflow-hidden border border-white/10 text-white select-none">
                
                {/* Screen Top Header Bar */}
                <div className="h-10 bg-[#071329] px-3 border-b border-white/10 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#00D9FF]/20 border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] font-black text-[10px]">
                      B
                    </div>
                    <span className="font-bold text-[11px] text-white hidden sm:inline">BellaPDV</span>
                  </div>

                  {/* Search Bar */}
                  <div className="flex-1 max-w-[200px] sm:max-w-xs relative hidden sm:block">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      readOnly 
                      placeholder="Buscar clientes, serviços, vendas..."
                      className="w-full pl-7 pr-2 py-1 bg-[#0B1933] border border-white/10 rounded-md text-[10px] text-slate-300 placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Right Header Badges */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-[#A9BAD5] hidden sm:inline">
                      App Android
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#00D9FF]/20 border border-[#00D9FF]/40 text-[9px] font-bold text-[#00D9FF] flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Gerar ação com IA
                    </span>
                    <div className="w-5 h-5 rounded-full bg-[#087CFF]/30 border border-[#087CFF] text-[9px] font-bold flex items-center justify-center text-white">
                      A
                    </div>
                  </div>
                </div>

                {/* Screen Main Body: Sidebar + Dashboard Content */}
                <div className="flex h-[320px] sm:h-[360px] text-[10px]">
                  
                  {/* Left Sidebar */}
                  <div className="w-24 sm:w-32 bg-[#030817] border-r border-white/5 p-2 space-y-1 overflow-y-auto hide-scrollbar hidden xs:block">
                    <div className="px-2 py-1.5 rounded-md bg-[#00D9FF]/15 text-[#00D9FF] font-bold flex items-center gap-1.5 border border-[#00D9FF]/30">
                      <BarChart3 className="w-3 h-3 shrink-0" />
                      <span className="truncate">Dashboard</span>
                    </div>
                    {[
                      'Frente de Caixa',
                      'Agenda',
                      'Clientes',
                      'CRM / Funil',
                      'Barbeiros',
                      'Serviços',
                      'Caixa / Fin.',
                      'Relatórios',
                      'Fidelidade',
                      'Configurações'
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className="px-2 py-1 rounded text-slate-400 hover:text-white flex items-center gap-1.5 truncate"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Dashboard Workspace */}
                  <div className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-[#071329]/50">
                    
                    {/* Welcome Row */}
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1">
                        Olá, barbeiro! <span>👋</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Acompanhe em tempo real o desempenho da sua barbearia.
                      </div>
                    </div>

                    {/* 4 Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-slate-400 uppercase">Faturamento</div>
                        <div className="text-xs sm:text-sm font-extrabold text-white">R$ 2.450,00</div>
                        <div className="text-[8px] text-emerald-400 font-medium">+12% vs ontem</div>
                      </div>
                      <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-slate-400 uppercase">Agendamentos</div>
                        <div className="text-xs sm:text-sm font-extrabold text-white">18</div>
                        <div className="text-[8px] text-[#00D9FF] font-medium">3 hoje pendentes</div>
                      </div>
                      <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-slate-400 uppercase">Clientes Ativos</div>
                        <div className="text-xs sm:text-sm font-extrabold text-white">142</div>
                        <div className="text-[8px] text-emerald-400 font-medium">+8% este mês</div>
                      </div>
                      <div className="bg-[#0B1933] p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-slate-400 uppercase">Ticket Médio</div>
                        <div className="text-xs sm:text-sm font-extrabold text-white">R$ 48,90</div>
                        <div className="text-[8px] text-indigo-400 font-medium">+5% vs mês anterior</div>
                      </div>
                    </div>

                    {/* Chart & Service Table Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      
                      {/* Left: Revenue Trend Mini-Chart */}
                      <div className="sm:col-span-7 bg-[#0B1933] p-2.5 rounded-lg border border-white/5 flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-1 text-[9px] text-slate-300">
                          <span className="font-semibold text-white">Receita</span>
                          <span className="text-slate-400 text-[8px]">Últimos 7 dias</span>
                        </div>
                        {/* Neon line chart illustration */}
                        <div className="h-20 w-full relative pt-2">
                          <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#8545FF" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <path 
                              d="M 0,45 Q 30,50 60,30 T 120,20 T 160,25 T 200,8 L 200,60 L 0,60 Z" 
                              fill="url(#chartGradient)" 
                            />
                            <path 
                              d="M 0,45 Q 30,50 60,30 T 120,20 T 160,25 T 200,8" 
                              fill="none" 
                              stroke="#00D9FF" 
                              strokeWidth="2.5" 
                            />
                            <circle cx="200" cy="8" r="3" fill="#E84BFF" />
                          </svg>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-500 pt-1 border-t border-white/5">
                          <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                        </div>
                      </div>

                      {/* Right: Top Services */}
                      <div className="sm:col-span-5 bg-[#0B1933] p-2.5 rounded-lg border border-white/5 space-y-1.5">
                        <div className="font-semibold text-white text-[9px]">Serviços Mais Realizados</div>
                        {[
                          { name: 'Corte de Cabelo', count: 48, pct: '85%' },
                          { name: 'Barboterapia', count: 32, pct: '60%' },
                          { name: 'Corte + Barba', count: 24, pct: '45%' },
                          { name: 'Sobrancelha', count: 18, pct: '30%' }
                        ].map((srv, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[8px] text-slate-300">
                              <span className="truncate">{srv.name}</span>
                              <span className="font-bold text-[#00D9FF]">{srv.count}</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#00D9FF] to-[#8545FF] rounded-full" 
                                style={{ width: srv.pct }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                  </div>
                </div>

              </div>

              {/* Notebook Base / Trackpad Chin */}
              <div className="h-3 sm:h-4 bg-[#0a1224] rounded-b-xl border-t border-white/10 flex items-center justify-center">
                <div className="w-16 h-1 rounded-full bg-slate-700/60" />
              </div>
            </div>

            {/* Notebook Stand reflection shadow */}
            <div className="w-3/4 h-3 bg-gradient-to-r from-transparent via-[#00D9FF]/20 to-transparent blur-md -mt-1 rounded-full" />

          </div>

        </div>
      </div>
    </section>
  );
}
