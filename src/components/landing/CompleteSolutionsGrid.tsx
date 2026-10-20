import React from 'react';
import { 
  ShoppingCart, 
  Calendar, 
  Users, 
  BarChart3, 
  Star, 
  Smartphone, 
  Monitor, 
  Megaphone, 
  Link2, 
  SlidersHorizontal 
} from 'lucide-react';

export function CompleteSolutionsGrid() {
  const solutions = [
    {
      icon: ShoppingCart,
      color: '#00D9FF',
      title: 'PDV Inteligente',
      desc: 'Venda rápida, controle de caixa e múltiplas formas de pagamento.'
    },
    {
      icon: Calendar,
      color: '#8545FF',
      title: 'Agenda Online',
      desc: 'Agendamentos com confirmação automática via WhatsApp.'
    },
    {
      icon: Users,
      color: '#E84BFF',
      title: 'CRM & Funil',
      desc: 'Atraia, converta e fidelize mais clientes com automação inteligente.'
    },
    {
      icon: BarChart3,
      color: '#087CFF',
      title: 'Relatórios Avançados',
      desc: 'Acompanhe seu crescimento com dados em tempo real.'
    },
    {
      icon: Star,
      color: '#00D9FF',
      title: 'Fidelidade',
      desc: 'Programa de pontos e recompensas para clientes fiéis.'
    },
    {
      icon: Smartphone,
      color: '#00D9FF',
      title: 'Catálogo & App',
      desc: 'Seu próprio app com serviços, preços e agendamentos.'
    },
    {
      icon: Monitor,
      color: '#087CFF',
      title: 'Totem de Autoatendimento',
      desc: 'Atendimento moderno e sem filas na sua barbearia.'
    },
    {
      icon: Megaphone,
      color: '#E84BFF',
      title: 'Marketing IA',
      desc: 'Campanhas automáticas, lembretes, reativação e muito mais.'
    },
    {
      icon: Link2,
      color: '#00D9FF',
      title: 'Integrações',
      desc: 'Conecte com WhatsApp, pagamentos, APIs e muito mais.'
    },
    {
      icon: SlidersHorizontal,
      color: '#8545FF',
      title: 'Marketplace & Ajustes',
      desc: 'Expanda seu negócio com recursos extras e personalização.'
    }
  ];

  return (
    <section id="solucoes" className="py-20 relative z-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#00D9FF] block mb-2">
              SOLUÇÕES COMPLETAS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Tudo o que sua barbearia precisa, em um só sistema.
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#A9BAD5] max-w-md leading-relaxed">
            Da venda ao pós-venda, o BellaPDV Pro integra todas as áreas da sua operação com automação, inteligência e foco em resultados.
          </p>
        </div>

        {/* 10 Cards Responsive Grid: 5 cols on lg, 3 cols on md, 2 on sm, 1 on xs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {solutions.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-[#0B1933]/70 hover:bg-[#0E2042] border border-white/10 hover:border-[#00D9FF]/40 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              >
                <div>
                  {/* Icon with glow background */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `${item.color}15`,
                      border: `1px solid ${item.color}35`,
                      color: item.color
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00D9FF] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#A9BAD5] leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div 
                  className="h-0.5 w-0 group-hover:w-full mt-4 transition-all duration-300 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
