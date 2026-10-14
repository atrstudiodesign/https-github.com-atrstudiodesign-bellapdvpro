import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, HTMLMotionProps } from 'motion/react';
import { Sparkles, Calendar, Zap, BarChart3, Check, ArrowRight, MessageSquare, Bot, CreditCard, ShieldAlert, Clock, TrendingUp, X, Play } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { AtrStudioBadge } from '../components/ui/AtrStudioBadge';

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
}

const FadeIn = ({ children, delay = 0, className = "", ...props }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98], delay }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0B0F1A] text-white min-h-screen font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#0B0F1A] to-[#0B0F1A] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0B0F1A]/80 backdrop-blur-md">
         <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Logo size="lg" />
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
               <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
               <a href="#comparativo" className="hover:text-white transition-colors">Comparativo</a>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/login')} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors hidden sm:block">
                 Fazer Login
               </button>
               <button onClick={() => navigate('/login?signup=true')} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                 TESTE GRÁTIS
               </button>
            </div>
         </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
        
        {/* HERO SECTION */}
        <div className="flex flex-col items-center text-center mt-12 md:mt-20 max-w-4xl mx-auto">
           <FadeIn>
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-[13px] font-semibold mb-8 shadow-inner hover:bg-white/10 transition-colors cursor-default">
               🚀 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">IA + Gestão + Automação para Barbearias e Salões</span>
             </div>
           </FadeIn>
           
           <FadeIn delay={0.1}>
             <h1 className="text-5xl md:text-7xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-white">
               Pare de perder clientes e <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">aumente seu faturamento todos os meses</span>
             </h1>
           </FadeIn>

           <FadeIn delay={0.2}>
             <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
               Agenda, PDV, financeiro, CRM, fidelidade e Inteligência Artificial em uma única plataforma para administrar sua barbearia sem planilhas, papel ou retrabalho.
             </p>
           </FadeIn>

           <FadeIn delay={0.3} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
             <button onClick={() => navigate('/login?signup=true')} className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] hover:-translate-y-1 flex items-center justify-center gap-2">
               🚀 COMEÇAR TESTE GRATUITO DE 14 DIAS
             </button>
             <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-full border border-white/10 transition-all flex items-center justify-center gap-2">
               <Play className="w-5 h-5 fill-current" /> Ver Demonstração
             </button>
           </FadeIn>

           <FadeIn delay={0.4} className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 justify-center text-sm font-medium text-slate-400">
             <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Sem cartão de crédito</div>
             <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Configuração em menos de 2 minutos</div>
             <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Cancele quando quiser</div>
           </FadeIn>
        </div>

        {/* HERO IMAGE APP PREVIEW */}
        <FadeIn delay={0.5} className="mt-24 relative max-w-5xl mx-auto hidden md:block">
           <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-50"></div>
           <div className="bg-[#050B14] border border-white/10 rounded-2xl p-2 relative shadow-2xl">
              <div className="absolute top-4 left-4 flex gap-1.5">
                 <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="h-8 border-b border-white/5 mb-4"></div>
              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#0A0F1C] border border-white/5 flex items-center justify-center relative">
                 <img src="https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=2000&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" alt="App Screenshot" />
                 
                 {/* Mock UI Elements rendered cleanly */}
                 <div className="absolute inset-0 p-8 grid grid-cols-3 gap-6 opacity-90">
                    <div className="col-span-2 space-y-6">
                       <div className="flex gap-4">
                          {[
                            { title: 'Faturamento', value: 'R$ 12.450', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.15)]' },
                            { title: 'Agendamentos', value: '142', glow: '' },
                            { title: 'Ticket Médio', value: 'R$ 85,00', glow: '' }
                          ].map(stat => (
                             <div key={stat.title} className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 flex-1 ${stat.glow}`}>
                                <div className="text-xs text-slate-400 mb-1">{stat.title}</div>
                                <div className="text-2xl font-bold text-white">{stat.value}</div>
                             </div>
                          ))}
                       </div>
                       <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-64">
                           <div className="flex justify-between items-center mb-6">
                              <div className="h-4 w-32 bg-white/10 rounded"></div>
                              <div className="h-4 w-16 bg-white/10 rounded"></div>
                           </div>
                           <div className="space-y-4">
                              {[1,2,3].map(i => (
                                 <div key={i} className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-full bg-white/5"></div>
                                    <div className="space-y-2 flex-1">
                                       <div className="h-3 w-1/3 bg-white/10 rounded"></div>
                                       <div className="h-2 w-1/4 bg-white/5 rounded"></div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                       </div>
                    </div>
                    <div className="col-span-1 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl p-6 h-full shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-purple-500/20 rounded-lg">
                                 <Bot className="w-6 h-6 text-purple-400" />
                              </div>
                              <div className="font-semibold text-white">IA Assistente</div>
                           </div>
                           <div className="space-y-3">
                              <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-xs text-slate-300">Analisei seus dados: 15% das reservas falham na terça-feira.</div>
                              <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-200">Ação: Enviar promoção de 10% para lista de espera hoje?</div>
                              <div className="h-8 w-24 bg-purple-500 rounded-lg shrink-0 mt-4"></div>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </FadeIn>

        {/* BLOCO DE DOR */}
        <FadeIn delay={0.2} className="mt-40 mb-20 max-w-4xl mx-auto">
           <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                 Sua barbearia sofre com isso?
              </h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { text: "Clientes esquecem horários" },
                { text: "Agendamentos pelo WhatsApp ficam perdidos" },
                { text: "Falta controle financeiro" },
                { text: "Difícil saber quanto realmente lucrou" },
                { text: "Marketing sem resultado" },
                { text: "Falta tempo para administrar tudo" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
                   <div className="bg-red-500/10 p-1.5 rounded-full shrink-0 mt-0.5">
                      <X className="w-5 h-5 text-red-500" />
                   </div>
                   <p className="text-lg text-slate-300 font-medium">{item.text}</p>
                </div>
              ))}
           </div>
        </FadeIn>

        {/* BLOCO DE SOLUÇÃO (Features) */}
        <div id="recursos" className="pt-32 pb-16 border-t border-white/5">
           <FadeIn className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                O BellaPDV resolve tudo em um único sistema
              </h2>
           </FadeIn>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                   icon: Calendar,
                   color: "text-blue-400",
                   bg: "bg-blue-400/10",
                   border: "border-blue-400/20",
                   title: "🗓 Agenda Inteligente",
                   desc: "Controle horários, profissionais e atendimentos em tempo real."
                },
                {
                   icon: CreditCard,
                   color: "text-emerald-400",
                   bg: "bg-emerald-400/10",
                   border: "border-emerald-400/20",
                   title: "💰 PDV e Financeiro",
                   desc: "Acompanhe entradas, saídas, faturamento e lucro real."
                },
                {
                   icon: MessageSquare,
                   color: "text-indigo-400",
                   bg: "bg-indigo-400/10",
                   border: "border-indigo-400/20",
                   title: "👥 CRM de Clientes",
                   desc: "Histórico completo de cada cliente e campanhas automáticas."
                },
                {
                   icon: Zap,
                   color: "text-yellow-400",
                   bg: "bg-yellow-400/10",
                   border: "border-yellow-400/20",
                   title: "🎯 Marketing Inteligente",
                   desc: "Recupere clientes inativos e aumente o retorno dos atendimentos."
                },
                {
                   icon: Bot,
                   color: "text-purple-400",
                   bg: "bg-purple-400/10",
                   border: "border-purple-400/20",
                   title: "🤖 Assistente com IA",
                   desc: "Receba sugestões automáticas para aumentar vendas e reduzir faltas."
                },
                {
                   icon: BarChart3,
                   color: "text-cyan-400",
                   bg: "bg-cyan-400/10",
                   border: "border-cyan-400/20",
                   title: "📊 Dashboard em Tempo Real",
                   desc: "Veja os números do seu negócio acontecendo ao vivo."
                }
              ].map((feat, i) => (
                 <FadeIn key={i} delay={i * 0.1} className="h-full">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] transition-colors relative overflow-hidden group h-full">
                       <div className={`absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity ${feat.color}`}>
                          <feat.icon className="w-24 h-24" />
                       </div>
                       <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${feat.bg} ${feat.border} border mb-6`}>
                          <feat.icon className={`w-6 h-6 ${feat.color}`} />
                       </div>
                       <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                       <p className="text-slate-400 leading-relaxed text-sm">{feat.desc}</p>
                    </div>
                 </FadeIn>
              ))}
           </div>
        </div>

        {/* PROVA DE VALOR */}
        <FadeIn className="py-24 text-center max-w-4xl mx-auto border-y border-white/10 my-10">
           <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">
              Mais controle. Mais organização. Mais lucro.
           </h2>
           <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              O BellaPDV foi criado para transformar a rotina de barbearias, salões de beleza e clínicas estéticas através da automação e inteligência de dados.
           </p>
        </FadeIn>

        {/* CTA INTERMEDIÁRIO */}
        <FadeIn className="my-32 relative max-w-5xl mx-auto rounded-3xl overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-purple-600/20"></div>
           <div className="absolute inset-0 bg-[#0B0F1A]/50 backdrop-blur-sm"></div>
           <div className="relative z-10 p-12 md:p-20 text-center border border-white/10 rounded-3xl">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white">Quanto sua empresa está deixando de faturar hoje?</h2>
              <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                Comece gratuitamente e descubra oportunidades de crescimento em poucos minutos.
              </p>
              <button onClick={() => navigate('/login?signup=true')} className="px-10 py-5 bg-white text-black hover:bg-slate-200 font-bold rounded-full transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1 text-lg">
                 🚀 ATIVAR TESTE GRATUITO AGORA
              </button>
           </div>
        </FadeIn>

        {/* COMPARATIVO */}
        <FadeIn id="comparativo" className="pt-20 pb-32 max-w-5xl mx-auto">
           <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Por que migrar para o BellaPDV?
              </h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#111] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldAlert className="w-32 h-32 text-red-500" /></div>
                 <h3 className="text-2xl font-bold text-red-400 mb-8 pb-4 border-b border-white/5">Sem BellaPDV</h3>
                 <ul className="space-y-6 relative z-10">
                    {[
                      "Agenda no papel",
                      "Clientes esquecidos",
                      "Controle manual",
                      "Decisões no achismo",
                      "Processos lentos"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-lg text-slate-400">
                         <div className="bg-red-500/10 p-1.5 rounded-full"><X className="w-4 h-4 text-red-400" /></div>
                         {item}
                      </li>
                    ))}
                 </ul>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-900/40 to-[#0A1628] border border-cyan-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles className="w-32 h-32 text-cyan-400" /></div>
                 <h3 className="text-2xl font-bold text-cyan-400 mb-8 pb-4 border-b border-cyan-500/20">Com BellaPDV</h3>
                 <ul className="space-y-6 relative z-10">
                    {[
                      "Agenda online",
                      "CRM inteligente",
                      "Dashboard em tempo real",
                      "IA baseada em dados",
                      "Automações inteligentes"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-4 text-lg text-white font-medium">
                         <div className="bg-cyan-500/20 p-1.5 rounded-full"><Check className="w-4 h-4 text-cyan-400" /></div>
                         {item}
                      </li>
                    ))}
                 </ul>
              </div>
           </div>
        </FadeIn>

        {/* CTA FINAL FORTE */}
        <FadeIn className="py-32 text-center border-t border-white/5">
           <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8 text-balance">
             Sua concorrência está usando tecnologia para crescer. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">E você?</span>
           </h2>
           <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
             Comece agora seu teste gratuito de 14 dias e descubra como administrar sua operação com mais eficiência, organização e lucro.
           </p>
           
           <div className="flex flex-col items-center gap-6">
             <button onClick={() => navigate('/login?signup=true')} className="px-12 py-6 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] hover:-translate-y-1 flex items-center justify-center gap-3 text-lg">
               🚀 COMEÇAR TESTE GRATUITO
             </button>
             <p className="text-sm text-slate-500 font-medium tracking-wide">
               Sem compromisso • Sem fidelidade • Cancele quando quiser
             </p>
           </div>
        </FadeIn>

        {/* FOOTER */}
        <footer className="border-t border-white/5 py-12 px-6 flex flex-col items-center justify-center text-slate-400 text-sm z-10 relative bg-[#0B0F1A]">
           <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div>
                 <Logo size="md" />
                 <p className="mt-4 text-xs leading-relaxed text-slate-500">
                    O sistema de gestão definitivo para o seu negócio crescer, oferecendo controle total do seu financeiro, da sua agenda e do seu marketing.
                 </p>
              </div>
              <div>
                 <h4 className="text-white font-semibold mb-4">Empresa</h4>
                 <ul className="space-y-2 text-xs">
                    <li><a href="/legal/quem-somos" className="hover:text-blue-400 transition-colors">Quem Somos</a></li>
                    <li><a href="/legal/contato" className="hover:text-blue-400 transition-colors">Contato</a></li>
                    <li><a href="/legal/suporte" className="hover:text-blue-400 transition-colors">Suporte</a></li>
                 </ul>
              </div>
              <div>
                 <h4 className="text-white font-semibold mb-4">Jurídico</h4>
                 <ul className="space-y-2 text-xs">
                    <li><a href="/legal/termos-de-uso" className="hover:text-blue-400 transition-colors">Termos de Uso</a></li>
                    <li><a href="/legal/aviso-legal" className="hover:text-blue-400 transition-colors">Aviso Legal</a></li>
                    <li><a href="/legal/lgpd" className="hover:text-blue-400 transition-colors">Lei LGPD</a></li>
                 </ul>
              </div>
              <div>
                 <h4 className="text-white font-semibold mb-4">Políticas</h4>
                 <ul className="space-y-2 text-xs">
                    <li><a href="/legal/politica-de-privacidade" className="hover:text-blue-400 transition-colors">Política de Privacidade</a></li>
                    <li><a href="/legal/cookies" className="hover:text-blue-400 transition-colors">Política de Cookies</a></li>
                    <li><a href="/legal/reembolso" className="hover:text-blue-400 transition-colors">Política de Reembolso</a></li>
                 </ul>
              </div>
           </div>
           <div className="w-full max-w-6xl border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between">
               <p>© {new Date().getFullYear()} BellaPDV. Todos os direitos reservados.</p>
               <div className="mt-6 md:mt-0">
                  <AtrStudioBadge size="md" />
               </div>
           </div>
        </footer>

      </main>
    </div>
  );
}
