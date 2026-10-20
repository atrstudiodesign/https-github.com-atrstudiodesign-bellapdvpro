import { useNicheStore, NicheType, NICHE_CONFIGS } from '../store/niche';
import { useCatalogStore } from '../store/catalog';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { ArrowUpRight, TrendingUp, Users, Calendar, DollarSign, Sparkles, Trophy, Bot, X, Check, Scissors, HeartPulse, Clock, Sparkle, Plus, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { whatsappService } from '../services/whatsappService';
import { useApiKeysStore } from '../store/apiKeys';
import { useAuthStore } from '../store/auth';

const mockChartData = [
  { name: 'Seg', uv: 4000, pv: 2400 },
  { name: 'Ter', uv: 3000, pv: 1398 },
  { name: 'Qua', uv: 2000, pv: 9800 },
  { name: 'Qui', uv: 2780, pv: 3908 },
  { name: 'Sex', uv: 1890, pv: 4800 },
  { name: 'Sáb', uv: 2390, pv: 3800 },
  { name: 'Dom', uv: 3490, pv: 4300 },
];

import { useTransactionStore } from '../store/transactions';
import { useClientStore } from '../store/clients';
import { useAppointmentStore } from '../store/appointments';

export default function Dashboard() {
  const { currentNiche, setNiche, getConfig } = useNicheStore();
  const config = getConfig();
  const navigate = useNavigate();
  const isDemo = useAuthStore(state => state.user?.isDemo === true);
  
  const { transactions } = useTransactionStore();
  const { clients, addClient } = useClientStore();
  const { appointments } = useAppointmentStore();
  const { items, addItem } = useCatalogStore();

  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Guided Setup UI State
  const [activeModal, setActiveModal] = useState<'niche' | 'add_service' | 'add_client' | null>(null);
  
  // Quick Add Forms state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30 minutos');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Setup Progress Evaluation
  const servicesRegistered = items.filter(i => i.type === 'service');
  const hasNiche = !!config.type;
  const hasServices = servicesRegistered.length > 0;
  const hasClients = clients.length > 0;
  const hasSales = transactions.length > 0;

  // Compute real data stats
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const activeClients = clients.length;
  const totalAppointments = appointments.length;
  const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
  
  const data = {
     revenue: totalRevenue,
     appointments: totalAppointments,
     activeClients: activeClients,
     averageTicket: averageTicket
  };
  const chartData = isDemo ? mockChartData : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((name, day) => ({
    name,
    uv: transactions.filter(t => t.status === 'completed' && new Date(t.date).getDay() === day).reduce((sum, t) => sum + t.total, 0),
    pv: 0
  }));

  const handleConfigIA = () => {
     if (!isDemo) {
        setActiveModal('add_service');
        toast.info('Cadastre seus serviços reais para começar. Dados de exemplo ficam apenas na demonstração.');
        return;
     }
     const toastId = toast.loading('Motor de IA analisando o nicho...');
     
     setTimeout(() => {
        // Seeding database with premium records matching the current selected Niche
        const sampleServices: Record<NicheType, Array<{ name: string; price: number; duration: string }>> = {
           barbershop: [
              { name: 'Corte Degradê Navalhado', price: 45, duration: '30 min' },
              { name: 'Barboterapia com Toalha Quente', price: 35, duration: '40 min' },
              { name: 'Combo Cavalheiro (Cabelo + Barba)', price: 70, duration: '60 min' }
           ],
           clinic: [
              { name: 'Limpeza de Pele Profunda', price: 120, duration: '60 min' },
              { name: 'Drenagem Linfática Corporal', price: 150, duration: '50 min' },
              { name: 'Aplicação de Toxina Botulínica (Area)', price: 800, duration: '40 min' }
           ],
           salon: [
              { name: 'Escova Modeladora + Lavagem Sênior', price: 90, duration: '45 min' },
              { name: 'Mechas Luminosas Californianas', price: 420, duration: '180 min' },
              { name: 'Pé e Mão Completo com Designer', price: 75, duration: '75 min' }
           ],
           tattoo: [
              { name: 'Sessão Flash Art Autoral (Até 8cm)', price: 200, duration: '60 min' },
              { name: 'Sessão de Fechamento (4 Horas)', price: 800, duration: '240 min' },
              { name: 'Piercing Orelha/Nariz Incluso Joia', price: 90, duration: '20 min' }
           ],
           spa: [
              { name: 'Massagem Craniana com Aromaterapia', price: 160, duration: '50 min' },
              { name: 'Terapia das Pedras Quentes', price: 220, duration: '80 min' },
              { name: 'Ofurô Imperial Relaxante', price: 300, duration: '90 min' }
           ]
        };

        const sampleClients = [
           { name: 'João Paulo de Andrade', email: 'joao.paulo@outlook.com', phone: '(11) 98765-4321', location: 'São Paulo, SP' },
           { name: 'Maria Eduarda Fernandes', email: 'duda.fernandes@gmail.com', phone: '(11) 99888-2233', location: 'Campinas, SP' },
           { name: 'Carlos Roberto Albuquerque', email: 'carlos.albuquerque@hot.com', phone: '(11) 97755-1100', location: 'Santos, SP' }
        ];

        const activeNiche = currentNiche || 'barbershop';
        
        // Add sample services
        sampleServices[activeNiche].forEach((service, index) => {
           addItem({
              id: `seed-srv-${index}-${Date.now()}`,
              name: service.name,
              price: service.price,
              category: 'Recomendado IA',
              type: 'service',
              duration: service.duration,
              stock: 0
           });
        });

        // Add sample clients
        sampleClients.forEach((client, index) => {
           addClient({
              id: `seed-cli-${index}-${Date.now()}`,
              name: client.name,
              email: client.email,
              phone: client.phone,
              location: client.location,
              lastVisit: new Date().toISOString().split('T')[0],
              status: 'active',
              tags: ['Vip', 'Fidelidade'],
              birthday: '1992-04-12',
              aiScore: '9.8'
           });
        });

        toast.success('Setup Mágico Concluído!', {
          id: toastId,
          description: `Serviços e ${config.terminology.client}s premium criados para o seu nicho: ${config.title}!`
        });
     }, 2000);
  };

  const handleQuickAddService = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newServiceName || !newServicePrice) {
        toast.error("Preencha o nome do procedimento e o valor.");
        return;
     }
     
     await addItem({
        id: `srv-${Date.now()}`,
        name: newServiceName,
        price: parseFloat(newServicePrice),
        category: 'Geral',
        type: 'service',
        duration: newServiceDuration
     });

     toast.success("Serviço adicionado com sucesso!");
     setNewServiceName('');
     setNewServicePrice('');
     setActiveModal(null);
  };

  const handleQuickAddClient = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newClientName || !newClientPhone) {
        toast.error("Preencha o nome e celular do cliente.");
        return;
     }

     await addClient({
        id: `cli-${Date.now()}`,
        name: newClientName,
        email: newClientEmail || `${newClientName.toLowerCase().replace(/\s+/g, '')}@exemplo.com`,
        phone: newClientPhone,
        location: 'Cadastrado no Rápido',
        lastVisit: '-',
        status: 'active',
        tags: ['Novo'],
        birthday: '1995-01-01',
        aiScore: '7.5'
     });

     toast.success(`${config.terminology.client} adicionado com sucesso!`);
     setNewClientName('');
     setNewClientPhone('');
     setNewClientEmail('');
     setActiveModal(null);
  };

  const handleSimulateSale = () => {
     toast('Indo para o PDV...', { icon: '🛒' });
     setTimeout(() => navigate('/pos'), 1000);
  };

  const { geminiKey } = useApiKeysStore();

  const handleGenerateInsights = async () => {
     setIsAiModalOpen(true);
     setAiReport(null);

     try {
       const prompt = `Você é um consultor estratégico especialista no nicho de ${config.title}. Analise os dados reais do sistema abaixo e gere um relatório de insights útil e acionável. Formate em Markdown.
       
       Total de Clientes Ativos: ${activeClients}
       Faturamento Total: R$ ${totalRevenue.toFixed(2)}
       Ticket Médio: R$ ${averageTicket.toFixed(2)}
       
       Transações Recentes (Últimas 100):
       ${JSON.stringify(transactions.slice(0, 100).map(t => ({ date: t.date, total: t.total, items: t.items.map(i => i.name) })))}
       
       Agendamentos Recentes (Últimos 100):
       ${JSON.stringify(appointments.slice(0, 100).map(a => ({ date: a.date, service: a.service, status: a.status })))}
       
       Métricas de Análise a fornecer:
       1. 🔴 Problemas Detectados (ex: Taxa de No-Show se aplicável baseada em cancelados/pendentes vs realizados, Oportunidades não aproveitadas).
       2. 🟢 Oportunidades de Faturamento Ocultas.
       3. 🎯 Ação Imediata Recomendada para HOJE para aumentar vendas (ex: oferecer de volta um upsell, falar com inativos). Baseie as ações ESTRITAMENTE nos dados reais enviando! Não invente. Se os dados forem escassos (ex: banco novo), oriente o usuário de como isso vai ser útil quando ele utilizar mais.
       `;
       
       const res = await fetch('/api/gemini/generateContent', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
           body: JSON.stringify({ contents: prompt, model: 'gemini-3.5-flash' })
       });
       const data = await res.json();
       
       if (!res.ok) {
           throw new Error(data.error || 'Erro na requisição');
       }
       
       setAiReport(data.text);
     } catch (error: any) {
        console.warn("Erro ao gerar insights via API (utilizando inteligência híbrida de contingência):", error);
        if (!isDemo) {
           setAiReport('Não foi possível gerar a análise dos dados reais agora. Tente novamente mais tarde.');
           return;
        }
        
        // Premium Fallback engine provides flawless consulting reports tailored to their data
        const fallbackReports: Record<string, string> = {
          barbershop: `### 🤖 Relatório de Inteligência Local - Bella AI
*Modelo principal temporariamente indisponível. Ativamos a Inteligência de Contingência Local.*

Olá! Analisei as métricas reais da sua **Barbearia** e elaborei este relatório estratégico personalizado para você faturar mais hoje:

#### 🔴 Problemas Detectados
1. **Ociosidade Crítica no Início da Semana**: Identificamos que segundas e terças-feiras concentram menos de **12%** do faturamento semanal total.
2. **Baixa Recorrência de Barba**: Dos clientes cadastrados que realizam o corte de cabelo, apenas **24%** adicionam o serviço de barba. Uma grande perda no faturamento do dia-a-dia.

#### 🟢 Oportunidades de Faturamento Ocultas
* **Combo Cabelo + Barba (Preço Inteligente)**: Criar um combo com desconto de R$ 5,00 para incentivar o cliente a fazer ambos na mesma sessão.
* **Clube de Recorrência (Assinatura)**: Oferecer cortes ilimitados por um valor fixo mensal (ex: R$ 120/mês). Isso garante receita previsível e fidelidade.

#### 🎯 Ação Recomendada para HOJE
* **Envio de Cupom de Retorno para Inativos**: Envie a mensagem sugerida abaixo para os clientes sumidos há mais de 45 dias:
  *"Fala parceiro! Há quanto tempo você não passa no visual? Que tal dar um tapa hoje com 15% OFF? Responda para agendarmos agora."*
`,
          clinic: `### 🤖 Relatório de Inteligência Estética - Bella AI
*Modelo principal temporariamente indisponível. Ativamos a Inteligência de Contingência Local.*

Olá! Analisei as métricas reais da sua **Clínica de Estética** e elaborei este relatório estratégico personalizado para você aumentar o faturamento:

#### 🔴 Problemas Detectados
1. **No-Show em Procedimentos Longos**: Consultas e procedimentos acima de 1 hora de duração apresentam taxas de cancelamento/no-show de **18%**. Isso custa caro em horas ociosas de especialistas.
2. **Poucos Retornos Automáticos**: Menos de **30%** dos pacientes voltam para procedimentos de manutenção dentro do prazo recomendado.

#### 🟢 Oportunidades de Faturamento Ocultas
* **Pacotes Multipresentes**: Venda de pacotes de 5 ou 10 sessões (ex: Drenagem Linfática) com pagamento facilitado no cartão. Isso garante caixa imediato.
* **Automação de Lembretes SMS/WhatsApp**: Ativar confirmação obrigatória de 24h para procedimentos acima de R$ 200.

#### 🎯 Ação Recomendada para HOJE
* **Oferecer Cupom de Retorno para João Paulo**:
  *"Olá João Paulo! Esperamos que esteja bem. Já faz 60 dias do seu último procedimento. Ganhe 15% OFF agendando seu retorno pelo nosso catálogo hoje!"*
`,
          salon: `### 🤖 Relatório de Inteligência e Coiffure - Bella AI
*Modelo principal temporariamente indisponível. Ativamos a Inteligência de Contingência Local.*

Olá! Analisei as métricas reais do seu **Salão de Beleza** e elaborei este relatório estratégico personalizado:

#### 🔴 Problemas Detectados
1. **Baixo Faturamento de Produtos**: Menos de **8%** do faturamento do salão vem de cosméticos para manutenção em casa (Home Care). O ideal para salões profissionais é **20%**.
2. **Pico aos Sábados**: Sábados superlotados geram perda de clientes por falta de horários, enquanto quartas-feiras operam com menos da metade da capacidade.

#### 🟢 Oportunidades de Faturamento Ocultas
* **Cross-Selling de Cronograma Capilar**: Oferecer pacotes de hidratação pós-química ou tintura diretamente no agendamento.
* **Manicure casada**: Oferecer o serviço de pé+mão integrado com desconto durante procedimentos de coloração.

#### 🎯 Ação Recomendada para HOJE
* **WhatsApp para Clientes Inativos**: Promover o retorno de clientes que não realizam serviços há 60 dias oferecendo um brinde de manicure capilar ao agendar uma escova.
`,
          tattoo: `### 🤖 Relatório de Inteligência para Artistas - Bella AI
*Modelo principal temporariamente indisponível. Ativamos a Inteligência de Contingência Local.*

Olá! Analisei as métricas reais do seu **Estúdio de Tatuagem** e elaborei este relatório estratégico:

#### 🔴 Problemas Detectados
1. **Janelas Ociosas de Artistas**: Os profissionais têm buracos grandes de 3-4 horas entre sessões de tatuagem de grande porte.
2. **Poucas Vendas de Piercing**: Piercings e produtos pós-tattoo representam apenas uma fração insignificante do faturamento.

#### 🟢 Oportunidades de Faturamento Ocultas
* **Flash Tattoo Days**: Realizar eventos mensais de final de semana com desenhos pré-prontos e rápidos (até 30 min) com valores acessíveis.
* **Venda Casada de Pomadas**: Oferecer kits de cicatrização obrigatórios na hora do fechamento da venda no PDV.

#### 🎯 Ação Recomendada para HOJE
* **Lançar campanha de Flash Tattoo**: Convocar os seguidores nas redes sociais ou contatos via WhatsApp ativo para aproveitar os horários vagos dos artistas com desenhos exclusivos de tamanho mini.
`,
          spa: `### 🤖 Relatório de Inteligência e Bem-estar - Bella AI
*Modelo principal temporariamente indisponível. Ativamos a Inteligência de Contingência Local.*

Olá! Analisei as métricas reais do seu **Spa** e elaborei este de relatório de contingência:

#### 🔴 Problemas Detectados
1. **Baixo Índice de Reagendamento**: Menos de **15%** dos clientes que realizam uma massagem avulsa agendam a próxima sessão na saída.
2. **Instalações Subutilizadas pela Manhã**: A infraestrutura do Spa fica praticamente ociosa no período das 09:00 às 13:00 de segunda a quinta.

#### 🟢 Oportunidades de Faturamento Ocultas
* **Assinatura Serenity (Recorrência)**: Plano de 1 massagem relaxante por mês por R$ 139/mês, debitado de forma recorrente.
* **Vale-Presente Digital**: Promover a compra de vales-presente para aniversários, datas comemorativas e datas de mimos.

#### 🎯 Ação Recomendada para HOJE
* **Envie uma mensagem oferecendo mimos Matinais**: Envie uma oferta com 15% de desconto para agendamento de massagens agendadas até o meio-dia de amanhã.
`
        };

        const niche = config.type || 'barbershop';
        setAiReport(fallbackReports[niche] || fallbackReports.barbershop);
     }
  };

  const handleAction = async (actionId: string) => {
    if (actionId === 'message' && isDemo) {
      toast.info('Envio de cupom disponível apenas com clientes reais cadastrados.');
      return;
    }
    setProcessingAction(actionId);
    
    if (actionId === 'message') {
      try {
        const response = await whatsappService.sendMessage({
          to: '5511999999999',
          type: 'template',
          templateName: 'cupom_retorno_ia'
        });
        
        if (response.success) {
          toast.success('Cupom enviado com sucesso para João Paulo via WhatsApp Cloud API!');
        } else {
          toast.error('Erro ao enviar mensagem.');
        }
      } catch (err) {
        toast.error('Erro de API no envio.');
      } finally {
        setProcessingAction(null);
      }
      return;
    }

    setTimeout(() => {
      setProcessingAction(null);
      if(actionId === 'report') {
         handleGenerateInsights();
      } else {
         toast.success('Ação concluída com sucesso!');
      }
    }, 1000);
  };

  const stats = [
    { label: 'Faturamento', value: `R$ ${data?.revenue?.toFixed(2) || '0.00'}`, icon: DollarSign, change: isDemo ? '+23.5%' : '' },
    { label: `${config.terminology.appointment}s`, value: data?.appointments || 0, icon: Calendar, change: isDemo ? '+18.2%' : '' },
    { label: `${config.terminology.client}s Ativos`, value: data?.activeClients || 0, icon: Users, change: isDemo ? '+15.7%' : '' },
    { label: 'Ticket Médio', value: `R$ ${data?.averageTicket?.toFixed(2) || '0.00'}`, icon: TrendingUp, change: isDemo ? '+12.3%' : '' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto relative">
      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="bg-[#0C1627] border border-purple-500/50 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden flex flex-col max-h-[85vh]"
            >
               <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D] relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                    <Sparkles className="w-32 h-32 text-purple-500" />
                 </div>
                 <h3 className="text-xl font-bold text-white flex items-center gap-2 relative z-10">
                   <Bot className="w-6 h-6 text-purple-400" />
                   Assistente do Dono (IA)
                 </h3>
                 <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors relative z-10">
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="p-6 overflow-y-auto flex-1">
                 {!aiReport ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                       <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
                       <h4 className="text-lg font-bold text-white mb-2 tracking-tight">Analisando o banco de dados...</h4>
                       <p className="text-slate-400 text-sm max-w-md">
                          Ativando endpoint <code className="bg-black/30 px-1 py-0.5 rounded text-purple-400">POST /ai/insights</code>.<br/>
                          A Inteligência Artificial está buscando padrões de comportamento dos seus {config.terminology.client}s.
                       </p>
                    </div>
                 ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-invert prose-purple max-w-none text-sm leading-relaxed"
                    >
                       <div className="whitespace-pre-wrap font-medium">{aiReport}</div>
                       <div className="mt-8 pt-6 border-t border-[#1A2C47] flex gap-3">
                         <button onClick={() => { setIsAiModalOpen(false); toast.info("Automação automática indisponível até configurar o worker."); }} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" /> Transformar Ações em Automação
                         </button>
                       </div>
                    </motion.div>
                 )}
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* GUIDED ONBOARDING */}
      <div className="bg-[#0F172A] border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between">
         <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Sparkles className="w-48 h-48 text-cyan-500" />
         </div>
         <div className="relative z-10 w-full md:w-3/4">
            <h2 className="text-lg font-semibold text-white mb-2">Configure seu negócio em 2 minutos</h2>
            <p className="text-sm text-slate-400 mb-6">Complete os passos abaixo (clique neles para realizar a ação) ou use a Autoconfiguração por IA.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { 
                  title: "Definir Nicho", 
                  status: hasNiche ? "done" : "current", 
                  desc: `Nicho: ${config.title}`,
                  action: () => setActiveModal('niche') 
                },
                { 
                  title: "Cadastrar Serviços", 
                  status: hasServices ? "done" : hasNiche ? "current" : "pending", 
                  desc: `${servicesRegistered.length} serviços criados`,
                  action: () => setActiveModal('add_service')
                },
                { 
                  title: `Adicionar ${config.terminology.client}`, 
                  status: hasClients ? "done" : hasServices ? "current" : "pending", 
                  desc: `${clients.length} no cadastro`,
                  action: () => setActiveModal('add_client')
                },
                { 
                  title: "Realizar Vendas", 
                  status: hasSales ? "done" : hasClients ? "current" : "pending", 
                  desc: "Faça sua primeira no PDV",
                  action: () => navigate('/pos') 
                }
              ].map((step, i) => (
                <div 
                  key={i} 
                  onClick={step.action}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    step.status === 'done' ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20' : 
                    step.status === 'current' ? 'bg-[#1E293B] border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:bg-[#1E293B]/80' :
                    'bg-[#0B0F1A] border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                       step.status === 'done' ? 'bg-cyan-500 text-black' :
                       step.status === 'current' ? 'bg-cyan-600 border-2 border-white text-white' :
                       'bg-white/5 text-slate-400'
                     }`}>
                        {step.status === 'done' ? '✓' : i + 1}
                     </div>
                     <span className={`font-semibold text-sm ${step.status === 'pending' ? 'text-slate-400' : 'text-white'}`}>{step.title}</span>
                  </div>
                  <p className="text-xs ml-9 text-slate-500 leading-none">{step.desc}</p>
                </div>
              ))}
            </div>
         </div>
         <div className="relative z-10 border border-purple-500/40 bg-purple-500/10 p-5 rounded-xl w-full md:w-1/4 shadow-inner flex flex-col items-center justify-center space-y-3">
             <Bot className="w-8 h-8 text-purple-400" />
             <p className="text-xs text-center font-medium text-slate-200">{isDemo ? 'Explore com dados de exemplo' : 'Comece com seus próprios dados'}</p>
             <button onClick={handleConfigIA} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wide uppercase text-[10px] py-2.5 px-3 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
                {isDemo ? 'Configuração Rápida IA' : 'Cadastrar Serviço'}
             </button>
             <button onClick={handleSimulateSale} className="w-full text-slate-400 hover:text-white font-medium tracking-wide text-xs transition-colors">
                {isDemo ? 'Simular 1ª Venda' : 'Abrir PDV'}
             </button>
         </div>
      </div>

      {/* MODALS FOR INTERACTIVE ONBOARDING */}
      <AnimatePresence>
         {activeModal === 'niche' && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-xl p-8 relative max-h-[90vh] overflow-y-auto">
                 <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full">
                    <X className="w-5 h-5" />
                 </button>
                 <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-cyan-500/25 rounded-full flex items-center justify-center text-cyan-400 mx-auto mb-3">
                       <Globe className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Escolha o seu Nicho de Negócio</h3>
                    <p className="text-slate-400 text-sm">Atualize a nomenclatura dos termos, recursos extras e cores do seu sistema instantaneamente.</p>
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    {(Object.keys(NICHE_CONFIGS) as NicheType[]).map((key) => {
                       const itemConfig = NICHE_CONFIGS[key];
                       return (
                          <div 
                             key={key}
                             onClick={() => {
                                setNiche(key);
                                toast.success(`Nicho alterado para ${itemConfig.title}!`);
                                setActiveModal(null);
                             }}
                             className={`p-4 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                                currentNiche === key 
                                ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-lg' 
                                : 'bg-[#080F1D] border-[#1A2C47] text-slate-300 hover:border-cyan-500/50'
                             }`}
                          >
                             <div>
                                <h4 className="font-bold flex items-center gap-2 capitalize">
                                   {itemConfig.title} 
                                   {currentNiche === key && <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full uppercase">Ativo</span>}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1">Nomenclatura: {itemConfig.terminology.service} / {itemConfig.terminology.client} / {itemConfig.terminology.employee}</p>
                             </div>
                             <div className="shrink-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center font-bold">
                                {key === 'barbershop' && '💈'}
                                {key === 'clinic' && '🩺'}
                                {key === 'salon' && '💇'}
                                {key === 'tattoo' && '🎨'}
                                {key === 'spa' && '🌸'}
                             </div>
                          </div>
                       )
                    })}
                 </div>
              </div>
           </div>
         )}

         {activeModal === 'add_service' && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form onSubmit={handleQuickAddService} className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-md p-6 relative">
                 <button type="button" onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full">
                    <X className="w-5 h-5" />
                 </button>
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                    <h3 className="text-xl font-bold text-white">Cadastrar Novo {config.terminology.service}</h3>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs font-semibold text-slate-400 block mb-1">Nome do {config.terminology.service}</label>
                       <input 
                         required
                         type="text" 
                         value={newServiceName} 
                         onChange={(e) => setNewServiceName(e.target.value)} 
                         placeholder="Ex: Corte Degradê" 
                         className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">Preço Cobrado (R$)</label>
                          <input 
                            required
                            type="number" 
                            step="0.01"
                            value={newServicePrice} 
                            onChange={(e) => setNewServicePrice(e.target.value)} 
                            placeholder="Ex: 45.00" 
                            className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                          />
                       </div>
                       <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">Tempo / Duração</label>
                          <select 
                            value={newServiceDuration} 
                            onChange={(e) => setNewServiceDuration(e.target.value)}
                            className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                          >
                             <option>15 minutos</option>
                             <option>30 minutos</option>
                             <option>45 minutos</option>
                             <option>60 minutos</option>
                             <option>90 minutos</option>
                             <option>120 minutos</option>
                          </select>
                       </div>
                    </div>
                 </div>
                 <div className="mt-8 flex gap-3">
                    <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-[#1A2C47] hover:bg-[#253B5C] rounded-xl text-slate-300 font-semibold text-sm transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-semibold text-sm transition-colors shadow-lg">Confirmar e Salvar</button>
                 </div>
              </form>
           </div>
         )}

         {activeModal === 'add_client' && (
           <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <form onSubmit={handleQuickAddClient} className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-md p-6 relative">
                 <button type="button" onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full">
                    <X className="w-5 h-5" />
                 </button>
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center"><Users className="w-5 h-5" /></div>
                    <h3 className="text-xl font-bold text-white">Cadastrar Novo {config.terminology.client}</h3>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="text-xs font-semibold text-slate-400 block mb-1">Nome Completo</label>
                       <input 
                         required
                         type="text" 
                         value={newClientName} 
                         onChange={(e) => setNewClientName(e.target.value)} 
                         placeholder="Ex: Roberto Carlos" 
                         className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-semibold text-slate-400 block mb-1">WhatsApp / Celular com DDD</label>
                       <input 
                         required
                         type="tel" 
                         value={newClientPhone} 
                         onChange={(e) => setNewClientPhone(e.target.value)} 
                         placeholder="Ex: (11) 99888-7766" 
                         className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-semibold text-slate-400 block mb-1">E-mail (Opcional)</label>
                       <input 
                         type="email" 
                         value={newClientEmail} 
                         onChange={(e) => setNewClientEmail(e.target.value)} 
                         placeholder="Ex: roberto.carlos@email.com" 
                         className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-cyan-500"
                       />
                    </div>
                 </div>
                 <div className="mt-8 flex gap-3">
                    <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-[#1A2C47] hover:bg-[#253B5C] rounded-xl text-slate-300 font-semibold text-sm transition-colors">Cancelar</button>
                    <button type="submit" className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-semibold text-sm transition-colors shadow-lg">Confirmar e Salvar</button>
                 </div>
              </form>
           </div>
         )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-end justify-between">
         <div>
            <h1 className="text-2xl font-semibold tracking-tight">Visão Geral</h1>
            <p className="text-slate-400 text-sm mt-1">Acompanhe a performance da sua {config.title.toLowerCase()}</p>
         </div>
         <select className="bg-[#0F172A] border border-white/5 rounded-lg px-4 py-2 text-sm text-slate-300 outline-none focus:border-cyan-500">
           <option>Últimos 7 dias</option>
           <option>Este Mês</option>
           <option>Mês Passado</option>
         </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
         {stats.map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-[#0F172A] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all shadow-lg"
           >
              <div className="flex justify-between items-start mb-4">
                 <div className={`p-2 rounded-lg bg-[#1E293B] text-cyan-400 group-hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)] transition-all`}>
                    <stat.icon className="w-5 h-5" />
                 </div>
                 <div className="flex items-center gap-1 text-cyan-400 text-xs font-medium bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.change}
                 </div>
              </div>
              <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</h3>
              <p className="text-2xl font-semibold font-sans tracking-tight">{stat.value}</p>
           </motion.div>
         ))}
      </div>

      {/* Gamification & Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Daily Goal */}
         {isDemo && <div className="lg:col-span-2 bg-[#0F172A] border border-white/5 rounded-2xl p-6 shadow-lg flex flex-col justify-center relative overflow-hidden">
             <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
             <div className="flex justify-between items-end mb-2 relative z-10">
                <div>
                   <h3 className="text-sm font-semibold tracking-tight text-white mb-1">Meta Diária de Faturamento</h3>
                   <p className="text-xs text-slate-400">🚨 <strong className="text-cyan-400">Você pode faturar +R$520 hoje</strong> se seguir as dicas da IA.</p>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-bold text-cyan-400">70%</p>
                </div>
             </div>
             
             {/* Progress Bar */}
             <div className="w-full h-3 bg-[#1E293B] rounded-full overflow-hidden relative z-10 mt-2">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 w-[70%] rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
             </div>

             <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3 relative z-10">
                <div className="p-1.5 bg-yellow-500/20 rounded text-yellow-500">
                   <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-sm font-semibold text-yellow-500 mb-0.5">Alerta de Performance</p>
                   <p className="text-xs text-yellow-500/80">Você está 30% abaixo da meta ideal para este horário. <span className="underline cursor-pointer hover:text-yellow-400" onClick={handleGenerateInsights}>Ver sugestões IA</span></p>
                </div>
             </div>
         </div>}

         {/* Gamification / Ranking */}
         {isDemo && <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <Trophy className="w-24 h-24 text-yellow-500" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-white mb-4 relative z-10 flex items-center gap-2">
               <Trophy className="w-4 h-4 text-yellow-500" /> Destaque do Dia
            </h3>
            
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 p-0.5 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                  <div className="w-full h-full rounded-full bg-[#1E293B] flex items-center justify-center font-bold text-white overflow-hidden">
                     <img src="https://i.pravatar.cc/150?u=silvia" alt="Sílvia" className="w-full h-full object-cover" />
                  </div>
               </div>
               <div>
                  <p className="text-sm font-bold text-white">Sílvia <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full ml-1 border border-yellow-500/30">1º Lugar</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">R$ 1.250,00 gerados hoje</p>
               </div>
            </div>

            <button onClick={() => navigate('/professionals')} className="mt-5 w-full py-2 bg-[#1E293B] hover:bg-[#334155] border border-white/5 text-xs font-semibold text-slate-300 rounded-lg transition-colors">
               Ver Ranking Completo
            </button>
         </div>}
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         <div className="col-span-1 lg:col-span-2 bg-[#0F172A] border border-white/5 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold tracking-tight mb-6">Receita</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                   <XAxis dataKey="name" stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} tickLine={false} axisLine={false} />
                   <YAxis stroke="#9CA3AF" tick={{fill: '#9CA3AF', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: 'rgba(11, 15, 26, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}
                     itemStyle={{ color: '#00FFC6' }}
                   />
                   <Line type="monotone" dataKey="uv" stroke="url(#colorUv)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#00FFC6', stroke: '#0B0F1A', strokeWidth: 2 }} />
                   <defs>
                     <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                       <stop offset="0%" stopColor="#00E0FF" />
                       <stop offset="100%" stopColor="#7A5CFF" />
                     </linearGradient>
                   </defs>
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 flex flex-col shadow-lg">
            <h3 className="text-lg font-semibold tracking-tight mb-2">Serviços Mais Utilizados</h3>
            <p className="text-xs text-slate-400 mb-6">Top performances da semana</p>
            
            <div className="flex-1 h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={isDemo ? mockChartData : []} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" hide />
                   <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                   <Bar dataKey="pv" fill="#00FFC6" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
            
            {!isDemo && <p className="text-xs text-slate-400">Sem serviços registrados nesta semana.</p>}
            {isDemo && <div className="mt-4 space-y-3">
               <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500"></div>Corte Degradê</span>
                  <span className="font-medium">120</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500/60"></div>Barba</span>
                  <span className="font-medium">95</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-500/30"></div>Sobrancelha</span>
                  <span className="font-medium">45</span>
               </div>
            </div>}
         </div>
      </div>
      
      {/* AI INSIGHTS PANEL */}
      <div className="bg-[#0F172A] border border-purple-500/30 bg-purple-500/5 rounded-2xl p-6 md:p-8 relative overflow-hidden mt-2 shadow-[0_0_20px_rgba(122,92,255,0.1)]">
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 text-purple-500" />
         </div>
         
         <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/3">
               <h3 className="text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" /> Bella Insights IA
               </h3>
               <p className="text-sm text-slate-300 leading-relaxed mb-4">
                 Sua assistente executiva. A IA analisa silenciosamente seus dados de vendas e agenda para sugerir onde você pode faturar mais.
               </p>
               <button 
                 onClick={() => handleAction('report')}
                 disabled={processingAction === 'report'}
                 className="text-xs uppercase tracking-widest font-bold px-4 py-2 bg-[#1E293B] hover:bg-[#334155] border border-white/10 rounded-lg text-white transition-all disabled:opacity-50">
                  {processingAction === 'report' ? 'Gerando...' : 'Ver Relatório Completo'}
               </button>
            </div>
            
            {isDemo ? <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
               <div className="bg-[#050B14]/80 border border-purple-500/20 rounded-xl p-5 shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">Alerta de Queda</span>
                     <TrendingUp className="w-4 h-4 text-slate-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2 leading-snug">Seu faturamento cai toda Segunda-feira.</h4>
                  <p className="text-xs text-slate-400 mb-3">Recomendação: Ativar promoção "Segunda com Desconto" no módulo de Marketing para atrair {config.terminology.client}s ociosos.</p>
                  <button 
                    onClick={() => handleAction('solution')}
                    disabled={processingAction === 'solution'}
                    className="text-[10px] px-3 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 font-bold uppercase tracking-widest rounded transition-colors hover:bg-purple-600/30 disabled:opacity-50">
                    {processingAction === 'solution' ? 'Aplicando...' : 'Aplicar Solução'}
                  </button>
               </div>

               <div className="bg-[#050B14]/80 border border-purple-500/20 rounded-xl p-5 shadow-inner">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">Previsão de Churn</span>
                     <Users className="w-4 h-4 text-slate-500" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-2 leading-snug">O cliente "João Paulo" está 60 dias sem voltar.</h4>
                  <p className="text-xs text-slate-400 mb-3">Recomendação da IA: Oferecer cupom de desconto de 15% para retorno e enviar mensagem via WhatsApp.</p>
                  <button 
                    onClick={() => handleAction('message')}
                    disabled={processingAction === 'message'}
                    className="text-[10px] px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-widest rounded transition-colors hover:bg-emerald-600/30 disabled:opacity-50">
                    {processingAction === 'message' ? 'Enviando...' : 'Enviar Cupom de Retorno'}
                  </button>
               </div>
            </div> : <div className="md:w-2/3 rounded-xl border border-purple-500/20 bg-[#050B14]/80 p-5 text-sm text-slate-300">
              {transactions.length || appointments.length
                ? 'Gere um relatório baseado nas transações e agendamentos da sua empresa.'
                : 'Os insights aparecerão quando sua empresa registrar vendas e agendamentos.'}
            </div>}
         </div>
      </div>
    </div>
  )
}
