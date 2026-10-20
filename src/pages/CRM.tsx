import React, { useState } from 'react';
import { useNicheStore } from '../store/niche';
import { 
  Filter, Search, Plus, MoreHorizontal, User, DollarSign, Calendar, X, Sparkles, 
  AlertTriangle, TrendingUp, Gift, Bot, RefreshCw, BarChart2, Star, Percent, 
  MessageSquare, UserCheck, ArrowRight, ShieldCheck, Mail, Phone, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { whatsappService } from '../services/whatsappService';

import { useApiKeysStore } from '../store/apiKeys';
import { useAuthStore } from '../store/auth';

interface ClientCRM {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday: string;
  lastVisit: string;
  lastService: string;
  lastProfessional: string;
  totalSpent: number;
  frequency: number;
  avgTicket: number;
  classification: 'NOVO CLIENTE' | 'ATIVO' | 'VIP' | 'RISCO DE PERDA' | 'INATIVO';
  score: number; // 0-100
  referralCount: number;
}

const INITIAL_CRM_CLIENTS: ClientCRM[] = [
  {
    id: 'c1',
    name: 'Paula Torres',
    phone: '5511984210492',
    email: 'paula.torres@gmail.com',
    birthday: '1995-10-14',
    lastVisit: '2026-06-12',
    lastService: 'Loiro Supremo + Reconstrução',
    lastProfessional: 'Amanda Costa',
    totalSpent: 1850,
    frequency: 14,
    avgTicket: 132.14,
    classification: 'VIP',
    score: 95,
    referralCount: 3
  },
  {
    id: 'c2',
    name: 'Beto Vasconcelos',
    phone: '5511971285023',
    email: 'beto.vascon@outlook.com',
    birthday: '1988-04-22',
    lastVisit: '2026-06-15',
    lastService: 'Design Barbaterapia',
    lastProfessional: 'Marcos Lima',
    totalSpent: 420,
    frequency: 8,
    avgTicket: 52.50,
    classification: 'ATIVO',
    score: 84,
    referralCount: 1
  },
  {
    id: 'c3',
    name: 'Clara Siqueira',
    phone: '5511993412351',
    email: 'clara.siqueira@gmail.com',
    birthday: '2001-07-09',
    lastVisit: '2026-05-18',
    lastService: 'Tratamento Hidratação Wella',
    lastProfessional: 'Sarah Mendes',
    totalSpent: 280,
    frequency: 2,
    avgTicket: 140.00,
    classification: 'ATIVO',
    score: 55,
    referralCount: 0
  },
  {
    id: 'c4',
    name: 'Tatiana Guedes',
    phone: '5511964201948',
    email: 'tatiana.guedes@gmail.com',
    birthday: '1992-12-05',
    lastVisit: '2026-04-10',
    lastService: 'Coloração Completa',
    lastProfessional: 'Amanda Costa',
    totalSpent: 620,
    frequency: 4,
    avgTicket: 155.00,
    classification: 'RISCO DE PERDA',
    score: 38,
    referralCount: 2
  },
  {
    id: 'c5',
    name: 'Gilberto Mendes',
    phone: '5511991048271',
    email: 'gilmendes@hotmail.com',
    birthday: '1979-01-30',
    lastVisit: '2025-11-20',
    lastService: 'Corte Degradê Clássico',
    lastProfessional: 'Marcos Lima',
    totalSpent: 160,
    frequency: 4,
    avgTicket: 40.00,
    classification: 'INATIVO',
    score: 12,
    referralCount: 0
  },
  {
    id: 'c6',
    name: 'Vitória Rocha',
    phone: '5511985392019',
    email: 'vitoria.rocha@gmail.com',
    birthday: '1998-09-02',
    lastVisit: '2026-06-18',
    lastService: 'Alongamento de Unha Gel',
    lastProfessional: 'Lara Silva',
    totalSpent: 180,
    frequency: 1,
    avgTicket: 180.00,
    classification: 'NOVO CLIENTE',
    score: 72,
    referralCount: 0
  }
];

const INITIAL_PIPELINE_LEADS = [
  { id: 'l1', name: 'Karina Lopes', value: 350, service: 'Mechas + Tratamento', status: 'lead', date: 'Hoje', avatar: 'K' },
  { id: 'l2', name: 'Gabriela Ramos', value: 120, service: 'Progressiva', status: 'interessado', date: 'Ontem', avatar: 'G' },
  { id: 'l3', name: 'Vitor Hugo', value: 80, service: 'Corte + Selagem', status: 'agendado', date: 'Há 2 dias', avatar: 'V' },
  { id: 'l4', name: 'Camila Fernandes', value: 240, service: 'Design Cílios + Sobrancelha', status: 'atendido', date: 'Hoje', avatar: 'C' },
  { id: 'l5', name: 'Rodrigo Santoro', value: 95, service: 'Corte + Barbaterapia', status: 'recorrente', date: 'Há 5 dias', avatar: 'R' },
  { id: 'l6', name: 'Marina Neves', value: 190, service: 'Coloração Vegana', status: 'interessado', date: 'Hoje', avatar: 'M' }
];

export default function CRM() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const isDemo = useAuthStore(state => state.user?.isDemo === true);
  const { geminiKey } = useApiKeysStore();

  const [activeTab, setActiveTab] = useState<'funil' | 'database' | 'upsell' | 'assistant'>('funil');
  const [pipelineLeads, setPipelineLeads] = useState(isDemo ? INITIAL_PIPELINE_LEADS : []);
  const [clients, setClients] = useState<ClientCRM[]>(isDemo ? INITIAL_CRM_CLIENTS : []);

  // Módulo 10 — Upsell Inteligente states
  const [upsells, setUpsells] = useState(isDemo ? [
    { id: 'u1', service: 'Mechas + Tratamento', target: 'Home Care Kit de Tratamento Wella', delayDays: 0, active: true },
    { id: 'u2', service: 'Corte + Selagem', target: 'Pomada Modeladora Homem Premium', delayDays: 0, active: true },
    { id: 'u3', service: 'Design Cílios + Sobrancelha', target: 'Sérum Ativador de Crescimento', delayDays: 14, active: true }
  ] : []);
  const [newUpsellService, setNewUpsellService] = useState('Mechas + Tratamento');
  const [newUpsellTarget, setNewUpsellTarget] = useState('');
  const [newUpsellDays, setNewUpsellDays] = useState('0');

  // Módulo 12 — IA Assistente do Dono (Insights CRM) states
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: isDemo ? 'Olá! Sou seu conselheiro SaaS Enterprise de Growth. Analisei o faturamento recente e a base de dados. Como posso te apoiar com recomendações de promoção, retenção ou marketing de relacionamento hoje?' : 'Olá! Cadastre clientes e vendas reais para gerar recomendações.' },
  ]);
  const [isAsking, setIsAsking] = useState(false);

  const handleAskAssistant = async (customPrompt?: string) => {
    const textToSend = customPrompt || assistantPrompt;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', text: textToSend };
    setChatHistory(prev => [...prev, userMsg]);
    setAssistantPrompt('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/gemini/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey || '' },
        body: JSON.stringify({
          model: 'gemini-3.5-flash',
          contents: `Você é um assessor sênior e arquiteto de SaaS de Beleza e Estética no CRM Bella PDV.
          Existem ${clients.length} clientes nesta visualização. Não atribua faturamento, frequência, cashback ou classificação sem dados reais disponíveis.
          Dê conselhos pragmáticos, focados em retenção, fidelidade, aumento de ticket médio e marketing com WhatsApp.
          Responda em formato markdown, de forma direta, sem larping de terminal nem cabeçalhos corporativos vazios.

          Mensagem do dono: ${textToSend}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na resposta do assistente');

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: data.text || 'Processamento concluído com sucesso. Gostaria de revisar as campanhas ou ajustar outro gatilho de retorno?'
      }]);
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        text: `Conselho Técnico: ${err.message || 'Houve uma instabilidade momentânea na conexão com nosso serviço cognitivo. Por favor, tente de novo em instantes.'}`
      }]);
    } finally {
      setIsAsking(false);
    }
  };
  
  // Modals / Detail sidesheet
  const [selectedClient, setSelectedClient] = useState<ClientCRM | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // New Lead state
  const [newLead, setNewLead] = useState({ name: '', value: '', service: '', status: 'lead' });
  
  // New Client state
  const [newClient, setNewClient] = useState({
    name: '', phone: '', email: '', birthday: '', lastService: '', 
    lastProfessional: '', totalSpent: '', frequency: '', score: '80', classification: 'ATIVO' as any
  });

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('ALL');

  // Kanban Columns
  const columns = [
    { id: 'lead', title: 'LEAD', color: 'border-[#3B82F6]/30', headerBg: 'bg-[#3B82F6]/5', text: 'text-[#3B82F6]' },
    { id: 'interessado', title: 'INTERESSADO', color: 'border-[#F59E0B]/30', headerBg: 'bg-[#F59E0B]/5', text: 'text-[#F59E0B]' },
    { id: 'agendado', title: 'AGENDADO', color: 'border-[#10B981]/30', headerBg: 'bg-[#10B981]/5', text: 'text-[#10B981]' },
    { id: 'atendido', title: 'ATENDIDO', color: 'border-[#8B5CF6]/30', headerBg: 'bg-[#8B5CF6]/5', text: 'text-[#8B5CF6]' },
    { id: 'recorrente', title: 'RECORRENTE', color: 'border-[#EC4899]/30', headerBg: 'bg-[#EC4899]/5', text: 'text-[#EC4899]' }
  ];

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    if (draggedLeadId) {
      setPipelineLeads(pipelineLeads.map(lead => lead.id === draggedLeadId ? { ...lead, status: statusId } : lead));
      toast.success('Fase de negócio atualizada', { 
         description: `Oportunidade movida para ${statusId.toUpperCase()}` 
      });
    }
    setDraggedLeadId(null);
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newLead.name || !newLead.value || !newLead.service) return;

    setPipelineLeads([...pipelineLeads, {
      id: `l-${Date.now()}`,
      name: newLead.name,
      value: Number(newLead.value),
      service: newLead.service,
      status: newLead.status,
      date: 'Agora',
      avatar: newLead.name.charAt(0).toUpperCase()
    }]);

    setIsNewLeadModalOpen(false);
    setNewLead({ name: '', value: '', service: '', status: 'lead' });
    toast.success('Oportunidade adicionada ao pipeline growth!');
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newClient.name || !newClient.phone) {
      toast.error('Nome e celular são obrigatórios.');
      return;
    }

    const tSpent = Number(newClient.totalSpent) || 0;
    const freq = Number(newClient.frequency) || 1;
    const computedAvg = freq > 0 ? (tSpent / freq) : tSpent;
    const scoreVal = Number(newClient.score) || 75;

    let computedClass: any = 'ATIVO';
    if (scoreVal >= 90) computedClass = 'VIP';
    else if (scoreVal >= 54) computedClass = 'ATIVO';
    else if (scoreVal >= 35) computedClass = 'RISCO DE PERDA';
    else computedClass = 'INATIVO';

    const clientObj: ClientCRM = {
      id: `c-${Date.now()}`,
      name: newClient.name,
      phone: newClient.phone.replace(/\D/g, ''),
      email: newClient.email || `${newClient.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      birthday: newClient.birthday || '1990-01-01',
      lastVisit: new Date().toISOString().split('T')[0],
      lastService: newClient.lastService || 'Serviço Padrão',
      lastProfessional: newClient.lastProfessional || 'Profissional da Casa',
      totalSpent: tSpent,
      frequency: freq,
      avgTicket: Number(computedAvg.toFixed(2)),
      classification: computedClass,
      score: scoreVal,
      referralCount: 0
    };

    setClients([clientObj, ...clients]);
    setIsNewClientModalOpen(false);
    setNewClient({
      name: '', phone: '', email: '', birthday: '', lastService: '', 
      lastProfessional: '', totalSpent: '', frequency: '', score: '75', classification: 'ATIVO'
    });
    toast.success('Novo cliente registrado com score e classificação!');
  };

  const triggerRetentionAction = async (clientName: string, phone: string, actionType: string) => {
    const toastId = toast.loading(`Iniciando IA de Retenção para ${clientName}...`);
    try {
      const msgText = actionType === 'campanha' 
        ? `Olá ${clientName}, faz tempo que não nos vemos! Preparamos um presente especial para sua próxima visita. Que tal agendar agora?`
        : actionType === 'desconto'
        ? `Olá ${clientName}! Ganhe 20% de cashback exclusivo para retornar esta semana no seu serviço habitual.`
        : `Olá ${clientName}! Observamos que seu aniversário ou retorno está próximo. Deseja agendar um horário com nossa equipe?`;

      const response = await whatsappService.sendMessage({
        to: phone,
        type: 'text',
        text: msgText
      });

      if (response.success) {
        toast.success(`Ação de Retenção Concluída`, { 
          id: toastId, 
          description: `Mensagem de WhatsApp de resgate enviada com sucesso para ${phone}.` 
        });
      } else {
        toast.error('Falha ao enviar mensagem pelo WhatsApp.', { id: toastId });
      }
    } catch(e) {
      toast.error('Falha de conexão com a API de Integração.', { id: toastId });
    }
  };

  // Calculations for Conversions and stats
  const totalLeadsCount = pipelineLeads.length;
  const pipelineFinancialTotal = pipelineLeads.reduce((acc, curr) => acc + curr.value, 0);

  // Conversion calculations: (atendidos + recorrentes) / total in pipeline percentage
  const successfulDeals = pipelineLeads.filter(l => l.status === 'atendido' || l.status === 'recorrente').length;
  const conversionRate = totalLeadsCount > 0 ? (successfulDeals / totalLeadsCount) * 100 : 0;

  // Filter clients
  const filteredClientsList = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery) ||
                          c.lastService.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classificationFilter === 'ALL' || c.classification === classificationFilter;
    return matchesSearch && matchesClass;
  });

  // Risk Clients (Módulo 3)
  const riskClients = clients.filter(c => c.classification === 'RISCO DE PERDA' || c.classification === 'INATIVO' || c.score < 50);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050B14] relative text-slate-300">
      {/* HEADER */}
      <div className="flex-none border-b border-[#1A2C47] px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between bg-[#0C1627] gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              SaaS Growth Suite
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mt-1">Growth Engine & CRM</h1>
          <p className="text-xs text-slate-400">Automatize funis de vendas, impulsione indicações e execute inteligência de retenção integrada.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="bg-[#15233A] p-1 rounded-xl flex border border-[#1A2C47] text-xs">
            <button 
              onClick={() => setActiveTab('funil')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'funil' ? 'bg-[#050B14] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Funil (Kanban)
            </button>
            <button 
              onClick={() => setActiveTab('database')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'database' ? 'bg-[#050B14] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Clientes Inteligentes
            </button>
            <button 
              onClick={() => setActiveTab('upsell')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'upsell' ? 'bg-[#050B14] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Upsell Automático
            </button>
            <button 
              onClick={() => setActiveTab('assistant')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'assistant' ? 'bg-[#050B14] text-[#E0F2FE] shadow-md border border-cyan-400/20' : 'text-slate-400 hover:text-white'}`}
            >
              ✨ Assistente do Dono
            </button>
          </div>

          <button 
            onClick={() => setShowInsights(!showInsights)}
            className={`p-2.5 rounded-xl border transition-all ${showInsights ? 'bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/30 shadow-sm' : 'border-[#1A2C47] text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Mostrar Insights de IA"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* VIEW 1: FUNIL DE VENDAS KANBAN */}
        {activeTab === 'funil' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* KPI STRIP */}
            <div className="p-6 bg-[#09111D] border-b border-[#1A2C47] grid grid-cols-1 md:grid-cols-4 gap-4 flex-none">
              <div className="bg-[#0C1627] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total no Funil</span>
                  <p className="text-xl font-bold text-white mt-1">{totalLeadsCount} Oportunidades</p>
                </div>
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#0C1627] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Projetado</span>
                  <p className="text-xl font-bold text-[#10B981] mt-1">R$ {pipelineFinancialTotal.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-[#10B981]/10 text-[#10B981] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#0C1627] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxa de Conversão</span>
                  <p className="text-xl font-bold text-cyan-400 mt-1">{conversionRate.toFixed(1)}%</p>
                </div>
                <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#0C1627] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fase Campeã</span>
                  <p className="text-xl font-bold text-white mt-1">Interessado</p>
                </div>
                <div className="w-10 h-10 bg-pink-500/10 text-pink-400 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* PIPELINE KANBAN GRID */}
            <div className="flex-1 overflow-x-auto p-6 flex gap-4 items-start h-full">
              {columns.map(col => {
                const colLeads = pipelineLeads.filter(l => l.status === col.id);
                const colValue = colLeads.reduce((su, cu) => su + cu.value, 0);
                
                return (
                  <div 
                    key={col.id}
                    className="min-w-[270px] w-[270px] bg-[#0C1627] rounded-xl border border-[#1A2C47] flex flex-col max-h-full overflow-hidden"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    <div className={`px-4 py-3 border-b border-[#1A2C47] flex items-center justify-between ${col.headerBg}`}>
                      <div>
                        <h4 className={`text-xs font-bold tracking-wider ${col.text}`}>{col.title}</h4>
                        <span className="text-[9px] text-slate-400">R$ {colValue.toFixed(2)}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white/5 text-slate-300 px-2 py-0.5 rounded-full">
                        {colLeads.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 hide-scrollbar">
                      {colLeads.map(lead => (
                        <div 
                          key={lead.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedLeadId(lead.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="bg-[#15233A] border border-white/5 hover:border-white/20 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold uppercase">
                                {lead.avatar}
                              </div>
                              <span className="text-slate-100 text-xs font-medium truncate max-w-[130px]">{lead.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{lead.date}</span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">{lead.service}</p>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-xs font-medium text-[#10B981]">R$ {lead.value.toFixed(2)}</span>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  toast.info(`Contatando ${lead.name}`, { description: 'Simulando abertura do chat...' });
                                }}
                                className="p-1 rounded bg-white/5 text-slate-400 hover:text-white transition"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {colLeads.length === 0 && (
                        <div className="border border-dashed border-[#1A2C47] rounded-lg p-6 text-center text-slate-600 text-xs py-10">
                          Nenhum lead aqui
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => {
                        setNewLead({ ...newLead, status: col.id });
                        setIsNewLeadModalOpen(true);
                      }} 
                      className="px-4 py-2 border-t border-[#1A2C47] text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Lead
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: CLIENTES INTELIGENTES */}
        {activeTab === 'database' && (
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              {/* Search + Filter */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar cliente, celular..."
                    className="w-full md:w-64 bg-[#0C1627] border border-[#1A2C47] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="flex gap-1 bg-[#0C1627] p-1 rounded-xl border border-[#1A2C47] text-xs">
                  {['ALL', 'VIP', 'ATIVO', 'RISCO DE PERDA', 'INATIVO', 'NOVO CLIENTE'].map(statusOpt => (
                    <button
                      key={statusOpt}
                      onClick={() => setClassificationFilter(statusOpt)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${classificationFilter === statusOpt ? 'bg-cyan-500 text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
                    >
                      {statusOpt === 'ALL' ? 'Todos' : statusOpt}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setIsNewClientModalOpen(true)}
                className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                <Plus className="w-4 h-4" /> Registrar Cliente
              </button>
            </div>

            {/* MASTER CLIENTS GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* DATA TABLE (Span 2) */}
              <div className="xl:col-span-2 bg-[#0C1627] rounded-xl border border-[#1A2C47] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1A2C47] flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-400" /> Clientes Classificados ({filteredClientsList.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#09111D] text-slate-400 border-b border-[#1A2C47] text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">Cliente</th>
                        <th className="px-6 py-3.5">Último Atendimento / Profissional</th>
                        <th className="px-6 py-3.5">Score Recorrência</th>
                        <th className="px-6 py-3.5">Frequência / Gasto / Ticket</th>
                        <th className="px-6 py-3.5">Classificação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredClientsList.map(c => {
                        // Badge color for classification
                        const classColor = c.classification === 'VIP' ? 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/20' :
                                           c.classification === 'ATIVO' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                                           c.classification === 'RISCO DE PERDA' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
                                           c.classification === 'INATIVO' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                           'bg-blue-500/10 text-blue-500 border-blue-500/20';

                        // Score progress color
                        const scoreColorClass = c.score >= 90 ? 'text-[#10B981]' : c.score >= 50 ? 'text-cyan-400' : 'text-red-400';

                        return (
                          <tr 
                            key={c.id}
                            onClick={() => setSelectedClient(c)}
                            className="hover:bg-white/5 cursor-pointer transition-all duration-150"
                          >
                            <td className="px-6 py-4 font-medium text-white">
                              <span className="block font-semibold">{c.name}</span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">{c.phone}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="block text-slate-300">{c.lastService}</span>
                              <span className="block text-[10px] text-slate-500 mt-0.5">Prof: {c.lastProfessional} | <Clock className="inline w-3 h-3 -mt-0.5" /> {c.lastVisit}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold ${scoreColorClass}`}>{c.score}</span>
                                <div className="w-16 h-1.5 bg-[#09111D] rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${c.score >= 90 ? 'bg-[#10B981]' : c.score >= 50 ? 'bg-cyan-400' : 'bg-red-500'}`}
                                    style={{ width: `${c.score}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono">
                              <div className="text-slate-300">
                                Total: <b className="text-white">R$ {c.totalSpent}</b>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Freq: {c.frequency}x | Ticket Médio: R$ {c.avgTicket}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${classColor}`}>
                                {c.classification}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredClientsList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center p-12 text-slate-500 text-xs uppercase">
                            Nenhum cliente correspondente encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RETAINER ENGINE COLUMN (Span 1) */}
              <div className="bg-[#0C1627] rounded-xl border border-[#1A2C47] p-6 flex flex-col h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white tracking-tight">IA de Retenção Ativa</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Identificação automática de anomalias no comportamento de compra e gatilhos de churn recomendados.
                </p>

                <div className="space-y-4">
                  {riskClients.map(c => {
                    const hasHighSpends = c.totalSpent > 500;
                    const alertText = c.classification === 'INATIVO' 
                      ? 'Inativo há +180 dias' 
                      : c.score < 30 
                      ? 'Redução severa de frequência' 
                      : 'Em dunas de evasão';
                      
                    return (
                      <div 
                        key={c.id}
                        className="bg-[#15233A] border border-red-500/20 rounded-xl p-4 flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="block text-xs font-semibold text-white">{c.name}</span>
                            <span className="block text-[10px] text-red-400 font-mono mt-0.5">{alertText}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${hasHighSpends ? 'bg-[#9333EA]/20 text-[#C084FC] border border-[#9333EA]/30' : 'bg-[#09111D] text-slate-400'}`}>
                            {hasHighSpends ? 'Perda Alto Gasto' : 'Médio Impacto'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/20 p-2 rounded-lg font-mono">
                          <div>Último: <span className="text-slate-300">{c.lastVisit}</span></div>
                          <div>Gasto: <span className="text-slate-300">R$ {c.totalSpent}</span></div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => triggerRetentionAction(c.name, c.phone, 'campanha')}
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition text-center"
                          >
                            Enviar Campanha
                          </button>
                          <button 
                            onClick={() => triggerRetentionAction(c.name, c.phone, 'desconto')}
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-cyan-400/10 text-[#22D3EE] border border-cyan-400/20 hover:bg-cyan-400/20 transition text-center"
                          >
                            Oferecer Cupom
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {riskClients.length === 0 && (
                    <div className="text-center p-8 border border-dashed border-white/5 rounded-xl text-slate-500 text-xs">
                      Excelente! Nenhum cliente no status de churn ou aviso de evasão hoje.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 3: UPSELL AUTOMÁTICO (MÓDULO 10) */}
        {activeTab === 'upsell' && (
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 animate-pulse" />
                  Mecanismo de Upsell Automático (Cross-Sell)
                </h2>
                <p className="text-xs text-slate-400 mt-1">Configure ofertas e sugestões de produtos complementares oferecidas automaticamente aos clientes com base no histórico de compras.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to create cross-sell trigger */}
              <div className="glass-card p-6 border-[#1A2C47]">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-[#1A2C47] pb-3">
                  <Plus className="w-4 h-4 text-emerald-400" /> Cadastrar Regra de Recomendação
                </h3>
                <div className="space-y-4">
                  <div>
                     <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Se o cliente comprar/fizer o serviço:</label>
                     <select 
                        value={newUpsellService}
                        onChange={(e) => setNewUpsellService(e.target.value)}
                        className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                     >
                        <option value="Mechas + Tratamento">Mechas + Tratamento</option>
                        <option value="Corte + Selagem">Corte + Selagem</option>
                        <option value="Design Cílios + Sobrancelha">Design Cílios + Sobrancelha</option>
                        <option value="Limpeza de Pele Profunda">Limpeza de Pele Profunda</option>
                        <option value="Manicure + Pedicure">Manicure + Pedicure</option>
                     </select>
                  </div>

                  <div>
                     <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Sugerir no pós-venda imediato:</label>
                     <input 
                        type="text"
                        placeholder="Ex: Óleo Iluminador Kerastase, Pomada..."
                        value={newUpsellTarget}
                        onChange={(e) => setNewUpsellTarget(e.target.value)}
                        className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 placeholder-slate-600"
                     />
                  </div>

                  <div>
                     <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Intervalo de dias do Alerta</label>
                     <select 
                        value={newUpsellDays}
                        onChange={(e) => setNewUpsellDays(e.target.value)}
                        className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                     >
                        <option value="0">Enviar imediatamente no checkout</option>
                        <option value="3">Após 3 dias (Via WhatsApp)</option>
                        <option value="7">Após 7 dias (Via WhatsApp)</option>
                        <option value="14">Após 14 dias (Revisão)</option>
                     </select>
                  </div>

                  <button 
                     onClick={() => {
                        if (!newUpsellTarget) {
                           toast.error('Preencha o item sugerido!');
                           return;
                        }
                        const newRule = {
                           id: `u_${Date.now()}`,
                           service: newUpsellService,
                           target: newUpsellTarget,
                           delayDays: Number(newUpsellDays),
                           active: true
                        };
                        setUpsells([...upsells, newRule]);
                        setNewUpsellTarget('');
                        toast.success('Gatilho de Upsell Cadastrado!', {
                           description: `Sugerindo ${newUpsellTarget} para quem consome ${newUpsellService}`
                        });
                     }}
                     className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase rounded-xl transition"
                  >
                     Cadastrar Oferta Cruzada
                  </button>
                </div>
              </div>

              {/* Active Rules List */}
              <div className="lg:col-span-2 glass-card p-6 border-[#1A2C47] flex flex-col h-full">
                 <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center justify-between border-b border-[#1A2C47] pb-3">
                     <span>Regras Ativas do Motor Cognitivo</span>
                     <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded-full">{upsells.length} Ativas</span>
                 </h3>

                 <div className="space-y-3 overflow-y-auto flex-1 max-h-[350px]">
                    {upsells.map(item => (
                       <div key={item.id} className="bg-[#0C1627] border border-[#1A2C47] p-4 rounded-xl flex items-center justify-between group">
                          <div>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-slate-500/10 text-slate-300 border border-white/5 px-2 py-0.5 rounded font-bold">Se comprar: {item.service}</span>
                                <span className="text-slate-500 text-xs">→</span>
                                <span className="text-xs font-bold text-amber-300">Sugerir: {item.target}</span>
                             </div>
                             <div className="text-[10px] text-slate-500 mt-2 font-mono">
                                Gatilho: {item.delayDays === 0 ? 'Imediato no Cupom/Checkout' : `Após ${item.delayDays} dias via WhatsApp Autopilot`}
                             </div>
                          </div>

                          <div className="flex items-center gap-2">
                             <button
                                onClick={() => {
                                   setUpsells(upsells.map(up => up.id === item.id ? { ...up, active: !up.active } : up));
                                   toast.success(`Gatilho ${item.active ? 'desativado' : 'ativado'}`);
                                }}
                                className={`px-2 py-1 rounded text-[9px] font-bold ${item.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}
                             >
                                {item.active ? 'ATIVADO' : 'INATIVO'}
                             </button>

                             <button 
                                onClick={() => {
                                   setUpsells(upsells.filter(up => up.id !== item.id));
                                   toast.error('Gatilho de Upsell deletado!');
                                }}
                                className="p-1 rounded text-red-400 hover:bg-red-500/10 transition"
                             >
                                <X className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: IA ASSISTENTE DO DONO (MÓDULO 12) */}
        {activeTab === 'assistant' && (
          <div className="flex-1 p-8 overflow-y-auto flex flex-col h-full min-h-0 bg-[#060D19]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 flex-none">
              <div>
                <h2 className="text-xl font-semibold text-[#E2E8F0] tracking-tight flex items-center gap-2">
                  <Bot className="w-6 h-6 text-cyan-400 animate-pulse" />
                  IA Assistente do Dono — CRM Insights
                </h2>
                <p className="text-xs text-slate-400 mt-1">Converse com a Inteligência Artificial diretamente conectada à base de dados de faturamento do Bella PDV.</p>
              </div>
              <span className="text-[10px] font-bold uppercase font-mono tracking-wider bg-cyan-400/10 border border-cyan-400/20 rounded px-2.5 py-1 text-cyan-400">
                Modelo: Gemini 3.5 Flash Active
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
              {/* Quick suggestions panel */}
              <div className="lg:col-span-1 bg-[#09111D] border border-[#1A2C47] rounded-xl p-5 h-fit flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">Sugestões Rápidas de Análise</h4>
                <div className="space-y-2.5">
                  <button 
                     onClick={() => handleAskAssistant('O que eu devo melhorar hoje no meu faturamento e conversão de novos clientes?')}
                     className="w-full text-left p-3 rounded-lg bg-[#0C1627] border border-[#1A2C47] text-xs text-slate-300 hover:text-white hover:border-cyan-500/30 transition-all cursor-pointer font-medium"
                  >
                     💡 "O que melhorar hoje no faturamento?"
                  </button>
                  <button 
                     onClick={() => handleAskAssistant('Quais dos meus profissionais de beleza correm maior risco de churn de carteira de clientes de acordo com a base?')}
                     className="w-full text-left p-3 rounded-lg bg-[#0C1627] border border-[#1A2C47] text-xs text-slate-300 hover:text-white hover:border-cyan-500/30 transition-all cursor-pointer font-medium"
                  >
                     🔥 "Quem corre risco de churn de carteira?"
                  </button>
                  <button 
                     onClick={() => handleAskAssistant('Elabore uma campanha assertiva de WhatsApp focada em inativos com ticket médio acima de 120 reais.')}
                     className="w-full text-left p-3 rounded-lg bg-[#0C1627] border border-[#1A2C47] text-xs text-slate-300 hover:text-white hover:border-cyan-500/30 transition-all cursor-pointer font-medium"
                  >
                     ⚡ "Elaborar campanha para inativos Pro"
                  </button>
                </div>

                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg text-[10px] text-yellow-500 leading-normal">
                   <strong>DICA OPERACIONAL:</strong> A IA analisa em tempo real o histórico e perfil dos {clients.length} clientes cadastrados para dar insights contextualizados.
                </div>
              </div>

              {/* Chat Panel */}
              <div className="lg:col-span-3 flex flex-col bg-[#09111D] border border-[#1A2C47] rounded-xl flex-1 h-[450px] relative overflow-hidden">
                 {/* Mensagens list */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatHistory.map((item, index) => (
                       <div 
                          key={index} 
                          className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                       >
                          <div 
                             className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                                item.role === 'user' 
                                   ? 'bg-blue-600 text-white rounded-br-none' 
                                   : 'bg-[#0C1627] border border-[#1A2C47] text-slate-200 rounded-bl-none whitespace-pre-wrap'
                             }`}
                          >
                             {item.text}
                          </div>
                       </div>
                    ))}

                    {isAsking && (
                       <div className="flex justify-start">
                          <div className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl rounded-bl-none p-4 text-xs text-cyan-400 animate-pulse flex items-center gap-2">
                             <RefreshCw className="w-3.5 h-3.5 animate-spin" /> IA processando métricas do negócio...
                          </div>
                       </div>
                    )}
                 </div>

                 {/* Chat input box */}
                 <div className="p-4 border-t border-[#1A2C47] bg-[#0C1627] flex gap-2">
                    <input 
                       type="text"
                       placeholder="Pergunte ao Assessor de Growth inteligente..."
                       value={assistantPrompt}
                       onChange={(e) => setAssistantPrompt(e.target.value)}
                       onKeyDown={(e) => { if (e.key === 'Enter') handleAskAssistant(); }}
                       className="flex-1 bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button 
                       onClick={() => handleAskAssistant()}
                       disabled={isAsking || !assistantPrompt}
                       className="px-5 bg-gradient-to-r from-cyan-500 to-[#2563EB] hover:opacity-90 disabled:opacity-50 text-black font-extrabold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2"
                    >
                       Enviar
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* IA INSIGHTS COLLAPSIBLE PANEL */}
      <AnimatePresence>
        {showInsights && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 bg-[#09111D] border-t border-[#1A2C47] flex flex-col md:flex-row md:items-center justify-between gap-4 flex-none"
          >
            <div className="flex items-start gap-3">
              <Bot className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Fórmula de Visibilidade IA</span>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                  {isDemo ? 'Exemplo de campanha de retenção na demonstração.' : 'Dados insuficientes para calcular receita VIP e risco de inatividade.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                toast.error('Envio em lote indisponível até configurar o worker e o provedor de mensagens.');
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-[#2563EB] text-black font-bold text-xs uppercase rounded-xl hover:opacity-90 shadow-md transition-all shrink-0"
            >
              Executar Retorno Lote (WhatsApp)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW LEAD MODAL */}
      <AnimatePresence>
        {isNewLeadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C1627] border border-[#1A2C47] rounded-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Nova Oportunidade (Funil)</h3>
                <button onClick={() => setIsNewLeadModalOpen(false)} className="text-slate-400 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddLead} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nome do Cliente</label>
                  <input 
                    type="text" required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="Ex: Clara Albuquerque"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Serviço Pretendido</label>
                  <input 
                    type="text" required
                    value={newLead.service}
                    onChange={(e) => setNewLead({ ...newLead, service: e.target.value })}
                    placeholder="Ex: Corte Químico + Selante"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Valor do Negócio (R$)</label>
                  <input 
                    type="number" required
                    value={newLead.value}
                    onChange={(e) => setNewLead({ ...newLead, value: e.target.value })}
                    placeholder="Ex: 250"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div className="pt-4 border-t border-[#1A2C47] flex gap-2">
                  <button type="button" onClick={() => setIsNewLeadModalOpen(false)} className="flex-1 py-2 text-xs font-semibold bg-transparent hover:bg-white/5 border border-[#1A2C47] text-slate-300 rounded-lg transition">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-2 text-xs font-bold uppercase bg-cyan-500 text-black rounded-lg hover:opacity-90 transition">
                    Criar Negócio
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NEW CLIENT MODAL */}
      <AnimatePresence>
        {isNewClientModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0C1627] border border-[#1A2C47] rounded-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-4 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Novo Registro CRM Inteligente</h3>
                <button onClick={() => setIsNewClientModalOpen(false)} className="text-slate-400 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nome Completo</label>
                  <input 
                    type="text" required
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Paula Santos"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">WhatsApp (Celular)</label>
                  <input 
                    type="text" required
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    placeholder="5511999999999"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">E-mail</label>
                  <input 
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    placeholder="paula@gmail.com"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nascimento (Aniversário)</label>
                  <input 
                    type="date"
                    value={newClient.birthday}
                    onChange={(e) => setNewClient({ ...newClient, birthday: e.target.value })}
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Fidelidade Inicial (0-100 Score)</label>
                  <input 
                    type="number" max="100" min="0"
                    value={newClient.score}
                    onChange={(e) => setNewClient({ ...newClient, score: e.target.value })}
                    placeholder="80"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Serviço de Entrada</label>
                  <input 
                    type="text"
                    value={newClient.lastService}
                    onChange={(e) => setNewClient({ ...newClient, lastService: e.target.value })}
                    placeholder="Corte + Escova"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Profissional Desejado</label>
                  <input 
                    type="text"
                    value={newClient.lastProfessional}
                    onChange={(e) => setNewClient({ ...newClient, lastProfessional: e.target.value })}
                    placeholder="Amanda Costa"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Gasto Inicial (R$)</label>
                  <input 
                    type="number"
                    value={newClient.totalSpent}
                    onChange={(e) => setNewClient({ ...newClient, totalSpent: e.target.value })}
                    placeholder="250"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Frequência (Visitas)</label>
                  <input 
                    type="number"
                    value={newClient.frequency}
                    onChange={(e) => setNewClient({ ...newClient, frequency: e.target.value })}
                    placeholder="2"
                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-[#1A2C47] flex gap-2">
                  <button type="button" onClick={() => setIsNewClientModalOpen(false)} className="flex-1 py-2 text-xs font-semibold bg-transparent hover:bg-white/5 border border-[#1A2C47] text-slate-300 rounded-lg transition">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-2 text-xs font-bold uppercase bg-gradient-to-r from-[#2563EB] to-cyan-500 text-white rounded-lg hover:opacity-90 transition">
                    Registrar no CRM
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT DETAILS BOTTOM/SIDE SHEET */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end">
            {/* Click outside backdrop close */}
            <div className="absolute inset-0" onClick={() => setSelectedClient(null)} />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#0C1627] border-l border-[#1A2C47] h-full shadow-2xl p-6 flex flex-col overflow-y-auto hide-scrollbar z-50"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#1A2C47] mb-6">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-bold uppercase tracking-wider text-white">Ficha de CRM</span>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* ID Card */}
                <div className="bg-[#15233A] p-4 rounded-xl border border-white/5 text-center">
                  <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-[#2563EB] text-black font-extrabold text-lg flex items-center justify-center rounded-full mx-auto mb-2 uppercase select-none">
                    {selectedClient.name.substring(0, 2)}
                  </div>
                  <h3 className="font-semibold text-white text-md">{selectedClient.name}</h3>
                  <span className="px-2.5 py-0.5 mt-1 inline-block text-[9px] font-bold uppercase bg-cyan-400/10 text-cyan-400 rounded-full border border-cyan-400/20">
                    {selectedClient.classification}
                  </span>
                </div>

                {/* Growth Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Gasto</span>
                    <span className="text-white font-mono font-bold text-sm block mt-1">R$ {selectedClient.totalSpent.toFixed(2)}</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Frequência</span>
                    <span className="text-white font-mono font-bold text-sm block mt-1">{selectedClient.frequency} visitas</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Ticket Médio</span>
                    <span className="text-white font-mono font-bold text-sm block mt-1">R$ {selectedClient.avgTicket.toFixed(2)}</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Indicações Pró</span>
                    <span className="text-[#EC4899] font-mono font-bold text-sm block mt-1">{selectedClient.referralCount} amigos</span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-3 pb-6 border-b border-[#1A2C47]">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Metadados de CRM</h4>
                  
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Contato Wpp:</span>
                    <span className="text-slate-300 font-mono flex items-center gap-1"><Phone className="w-3 h-3 text-slate-500" /> +{selectedClient.phone}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">E-mail:</span>
                    <span className="text-slate-300 flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> {selectedClient.email}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Aniversário:</span>
                    <span className="text-slate-300 font-mono">{selectedClient.birthday}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Último Serviço:</span>
                    <span className="text-slate-300">{selectedClient.lastService}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Profissional Preferido:</span>
                    <span className="text-slate-300">{selectedClient.lastProfessional}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Última Visita:</span>
                    <span className="text-slate-300 font-mono">{selectedClient.lastVisit}</span>
                  </div>
                </div>

                {/* Customer Score Gauge details */}
                <div className="bg-[#09111D] border border-white/5 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Metas de Retenção Crítica</span>
                    <span className="text-xs text-yellow-400 font-bold">{selectedClient.score}/100</span>
                  </div>
                  
                  <div className="w-full h-2 bg-[#050B14] rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full ${selectedClient.score >= 90 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : selectedClient.score >= 50 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-red-500 to-amber-500'}`}
                      style={{ width: `${selectedClient.score}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    {selectedClient.score >= 90 
                      ? 'Cliente classificado como VIP. Tem alta fidelidade e promove indicações proativamente. Ofereça brindes sazonais.' 
                      : selectedClient.score >= 50
                      ? 'Cliente Ativo. Tem frequência estável, mas requer estímulo de campanhas preventivas para se tornar VIP.'
                      : 'ALERTA DE CHURN: O cliente diminuiu as visitas em 65%. Em alto risco de evasão definitiva. Utilize uma ação de WhatsApp instantânea.'}
                  </p>
                </div>

                {/* Actions Block */}
                <div className="space-y-2 pt-2">
                  <button 
                    onClick={() => {
                      triggerRetentionAction(selectedClient.name, selectedClient.phone, 'campanha');
                      setSelectedClient(null);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold text-xs uppercase rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4" /> Enviar Mensagem de Retorno
                  </button>
                  <button
                    onClick={() => {
                      toast.success(`Cupom de cashback gerado para ${selectedClient.name}`, {
                        description: `Enviando por WhatsApp: R$ 30,00 de crédito.`
                      });
                      setSelectedClient(null);
                    }} 
                    className="w-full py-2.5 bg-transparent text-slate-300 hover:text-white border border-[#1A2C47] hover:bg-white/5 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Percent className="w-4 h-4 text-pink-400" /> Oferecer Cupom de Desconto
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
