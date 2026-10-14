import React, { useState } from 'react';
import { Gift, Award, Star, Search, Plus, Users, X, Minus, Share2, Settings, PiggyBank, BadgeCheck, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNicheStore } from '../store/niche';
import { toast } from 'sonner';

const initialClients = [
  { id: '1', name: 'João Silva', phone: '(11) 99999-9999', points: 450, tier: 'Gold', badges: ['🚀 VIP', '⭐ 1º do Ranking'], lastVisit: 'Última: 15 dias', churnRisk: 'Baixo' },
  { id: '2', name: 'Maria Santos', phone: '(11) 98888-8888', points: 120, tier: 'Silver', badges: ['💎 Cashback Ativo'], lastVisit: 'Última: 45 dias', churnRisk: 'Alto' },
  { id: '3', name: 'Carlos Oliveira', phone: '(11) 97777-7777', points: 850, tier: 'Platinum', badges: ['👑 Lenda', '🔥 Combo Semanal'], lastVisit: 'Última: 5 dias', churnRisk: 'Minimo' },
  { id: '4', name: 'Ana Costa', phone: '(11) 96666-6666', points: 30, tier: 'Bronze', badges: ['🎯 Entusiasta'], lastVisit: 'Última: 25 dias', churnRisk: 'Médio' },
];

export default function Loyalty() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const [activeTab, setActiveTab] = useState<'ranking' | 'referrals' | 'settings'>('ranking');
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState(initialClients);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  
  const [actionType, setActionType] = useState<'add' | 'redeem' | null>(null);
  const [amount, setAmount] = useState('');

  // Referral states (Módulo 8)
  const [referrals, setReferrals] = useState([
    { id: 'ref1', referrer: 'João Silva', referee: 'Bruno Castro', date: '18/06/2026', reward: 'R$ 15,00 Saldo', status: 'Recompensado', code: 'JOSI-771' },
    { id: 'ref2', referrer: 'Carlos Oliveira', referee: 'Gabriela M.', date: '14/06/2026', reward: 'Escova Grátis', status: 'Recompensado', code: 'CAOL-885' },
    { id: 'ref3', referrer: 'Maria Santos', referee: 'Kátia Lima', date: '10/06/2026', reward: 'Cupom 15% OFF', status: 'Pendente', code: 'MASA-110' },
  ]);

  // Referral creator states
  const [newReferrer, setNewReferrer] = useState('');
  const [newReferee, setNewReferee] = useState('');
  const [newReward, setNewReward] = useState('R$ 15,00 Saldo');

  // Cashback settings (Módulo 9)
  const [pointsRatio, setPointsRatio] = useState('1'); // R$ 1 = 1 ponto
  const [cashbackPercent, setCashbackPercent] = useState('5'); // 5% cashback
  const [minRedeemPoints, setMinRedeemPoints] = useState('100');
  const [isCashbackActive, setIsCashbackActive] = useState(true);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'Gold': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'Silver': return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
      default: return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Minimo': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Baixo': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'Médio': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'Alto': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const handleAction = () => {
    if (!amount || isNaN(Number(amount))) return;
    const val = Number(amount);
    
    setClients(prev => prev.map(c => {
      if (c.id === selectedClient.id) {
        let newPoints = c.points;
        const previousTier = c.tier;
        if (actionType === 'add') newPoints += val;
        if (actionType === 'redeem') newPoints = Math.max(0, newPoints - val);
        
        let newTier = c.tier;
        if (newPoints >= 800) newTier = 'Platinum';
        else if (newPoints >= 400) newTier = 'Gold';
        else if (newPoints >= 100) newTier = 'Silver';
        else newTier = 'Bronze';

        if (actionType === 'add') {
           toast.success(`${val} pontos adicionados a ${c.name}`);
        } else {
           toast.success(`${val} pontos resgatados com sucesso!`);
        }
        
        if (newTier !== previousTier) {
           toast('Mudança de Nível!', { icon: '🎉', description: `${c.name} agora é um cliente ${newTier}.` });
        }
        
        const updated = { ...c, points: newPoints, tier: newTier };
        setSelectedClient(updated);
        return updated;
      }
      return c;
    }));
    
    setActionType(null);
    setAmount('');
  };

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferrer || !newReferee) {
      toast.error('Preencha quem indicou e quem entrou');
      return;
    }
    const newRefObj = {
      id: `ref_${Date.now()}`,
      referrer: newReferrer,
      referee: newReferee,
      date: new Date().toLocaleDateString('pt-BR'),
      reward: newReward,
      status: 'Recompensado',
      code: `${newReferrer.substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
    };
    setReferrals([newRefObj, ...referrals]);
    toast.success('Indicação cadastrada com sucesso!', {
      description: `Ambos os clientes receberam o benefício: ${newReward}`,
    });
    setNewReferrer('');
    setNewReferee('');
  };

  const handleSaveSettings = () => {
    toast.success('Configurações de fidelidade salvas!', {
      description: `R$ 1,00 = ${pointsRatio} pts • Cashback: ${cashbackPercent}% ativo`,
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto relative h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-1">Fidelidade & Growth Engine</h1>
            <p className="text-slate-400 text-sm">Gere engajamento por meio de pontuação, cashback configurável e programa de indicações.</p>
         </div>

         {/* Tab triggers */}
         <div className="flex bg-[#0C1627] p-1 rounded-xl border border-[#1A2C47]">
            <button 
               onClick={() => setActiveTab('ranking')}
               className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'ranking' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
               }`}
            >
               <Award className="w-3.5 h-3.5" /> Club Fidelidade
            </button>
            <button 
               onClick={() => setActiveTab('referrals')}
               className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'referrals' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
               }`}
            >
               <Share2 className="w-3.5 h-3.5" /> Indique & Ganhe
            </button>
            <button 
               onClick={() => setActiveTab('settings')}
               className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'settings' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
               }`}
            >
               <Settings className="w-3.5 h-3.5" /> Parâmetros CRM
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-[#1A2C47]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Participantes</p>
                <p className="text-2xl font-bold text-white">1,240</p>
             </div>
          </div>
        </div>
        <div className="glass-card p-6 border-[#1A2C47]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pontos Emitidos</p>
                <p className="text-2xl font-bold text-white">45.2K</p>
             </div>
          </div>
        </div>
        <div className="glass-card p-6 border-[#1A2C47]">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <PiggyBank className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cashback Ativo</p>
                <p className="text-2xl font-bold text-white">{cashbackPercent}% da Conta</p>
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
         {activeTab === 'ranking' && (
            <motion.div 
               key="ranking"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               className="flex-1 glass-card border-[#1A2C47] flex flex-col min-h-[400px]"
            >
               <div className="p-6 border-b border-[#1A2C47] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Award className="w-5 h-5 text-purple-400" /> Ranking de {config.terminology.client}s</h2>
                  <div className="relative w-full sm:w-72">
                     <input 
                       type="text" 
                       placeholder="Buscar por nome ou telefone..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full bg-[#0C1627] border border-[#1A2C47] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
                     />
                     <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
               </div>

               <div className="flex-1 overflow-auto p-6">
                  <div className="grid grid-cols-12 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">
                     <div className="col-span-3">Cliente</div>
                     <div className="col-span-3">Telefone</div>
                     <div className="col-span-2 text-center">IA (Risco)</div>
                     <div className="col-span-2 text-right">Pontos</div>
                     <div className="col-span-2 text-right">Nivel</div>
                  </div>

                  <div className="space-y-2">
                     {filteredClients.map(client => (
                       <div key={client.id} className="grid grid-cols-12 items-center p-4 bg-[#0C1627] hover:bg-[#1A2C47]/50 rounded-xl border border-[#1A2C47] transition-colors cursor-pointer" onClick={() => { setSelectedClient(client); setActionType(null); setAmount(''); }}>
                          <div className="col-span-3 font-medium text-white flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {client.name.charAt(0)}
                             </div>
                             <span className="truncate">{client.name}</span>
                          </div>
                          <div className="col-span-3 text-slate-400 text-sm truncate flex flex-col justify-center">
                             {client.phone}
                             <div className="flex items-center gap-1 mt-1">
                                {client.badges?.map((badge: string, i: number) => (
                                    <span key={i} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-400 truncate max-w-[80px]">{badge}</span>
                                ))}
                             </div>
                          </div>
                          <div className="col-span-2 flex justify-center">
                             <div className="flex flex-col items-center gap-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${getRiskColor(client.churnRisk)}`}>
                                  {client.churnRisk}
                                </span>
                                <span className="text-[10px] text-slate-500">{client.lastVisit}</span>
                             </div>
                          </div>
                          <div className="col-span-2 text-right font-bold text-blue-400">{client.points} pts</div>
                          <div className="col-span-2 flex justify-end">
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getTierColor(client.tier)}`}>
                               {client.tier}
                             </span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </motion.div>
         )}

         {activeTab === 'referrals' && (
            <motion.div 
               key="referrals"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
               {/* Register a new referral */}
               <div className="glass-card p-6 border-[#1A2C47]">
                  <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2"><Share2 className="w-4 h-4 text-emerald-400" /> Nova Indicação</h3>
                  <form onSubmit={handleCreateReferral} className="space-y-4">
                     <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Quem Indicou (Cliente Antigo)</label>
                        <select 
                           value={newReferrer}
                           onChange={(e) => setNewReferrer(e.target.value)}
                           className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                        >
                           <option value="">Selecione o Cliente</option>
                           {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Quem Entrou (Novo Amigo)</label>
                        <input 
                           type="text"
                           placeholder="Nome do indicado..."
                           value={newReferee}
                           onChange={(e) => setNewReferee(e.target.value)}
                           className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 placeholder-slate-600"
                        />
                     </div>

                     <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Prêmio de Estímulo</label>
                        <select 
                           value={newReward}
                           onChange={(e) => setNewReward(e.target.value)}
                           className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                        >
                           <option value="R$ 15,00 Saldo">R$ 15,00 Crédito Cashback</option>
                           <option value="Escova Grátis">Escova Grátis (Voucher)</option>
                           <option value="Cupom 15% OFF">Cupom 15% OFF (Código)</option>
                           <option value="100 Pontos">100 Pontos Fidelidade</option>
                        </select>
                     </div>

                     <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase rounded-xl transition shadow-md">
                        Ativar Indicação
                     </button>
                  </form>
               </div>

               {/* Referral list */}
               <div className="lg:col-span-2 glass-card border-[#1A2C47] flex flex-col h-full min-h-[300px]">
                  <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between">
                     <h3 className="text-md font-bold text-white flex items-center gap-1.5"><BadgeCheck className="w-4 h-4 text-emerald-400" /> Histórico de Indicações dadas</h3>
                     <span className="text-xs bg-emerald-400/15 text-emerald-400 px-2 py-0.5 rounded-full font-mono">{referrals.length} Cadastradas</span>
                  </div>

                  <div className="flex-1 overflow-auto p-6 space-y-2">
                     {referrals.map(ref => (
                        <div key={ref.id} className="bg-[#0C1627] border border-[#1A2C47] p-4 rounded-xl flex items-center justify-between hover:border-emerald-500/20 transition-colors">
                           <div>
                              <div className="flex items-center gap-2">
                                 <b className="text-xs text-white">{ref.referrer}</b>
                                 <span className="text-[10px] text-slate-500">→ indicou</span>
                                 <b className="text-xs text-slate-300">{ref.referee}</b>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
                                 <span>Data: <b>{ref.date}</b></span>
                                 <span>Código: <strong className="font-mono text-emerald-400">{ref.code}</strong></span>
                              </div>
                           </div>

                           <div className="text-right">
                              <span className="text-xs font-bold text-purple-400 block">{ref.reward}</span>
                              <span className="text-[9px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-1.5 py-0.5 rounded font-mono uppercase inline-block mt-1">✓ {ref.status}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
         )}

         {activeTab === 'settings' && (
            <motion.div 
               key="settings"
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               className="glass-card p-8 border-[#1A2C47] max-w-2xl mx-auto flex flex-col gap-6"
            >
               <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" /> Parâmetros de Fidelidade & Cashback</h3>
               
               <div className="space-y-4">
                  <div className="bg-black/20 p-4 border border-white/5 rounded-xl flex items-center justify-between">
                     <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest block">Mecanismo Cashback Ativo</h4>
                        <p className="text-xs text-slate-500">Habilita e calcula estorno percentual nas compras no PDV.</p>
                     </div>
                     <button 
                        onClick={() => setIsCashbackActive(!isCashbackActive)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isCashbackActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isCashbackActive ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">Conversão de Pontos</label>
                        <select 
                           value={pointsRatio} 
                           onChange={(e) => setPointsRatio(e.target.value)}
                           className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
                        >
                           <option value="1">R$ 1,00 = 1 Ponto</option>
                           <option value="2">R$ 1,00 = 2 Pontos</option>
                           <option value="5">R$ 1,00 = 5 Pontos</option>
                        </select>
                     </div>

                     <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">% Cashback Retornado</label>
                        <select 
                           value={cashbackPercent} 
                           onChange={(e) => setCashbackPercent(e.target.value)}
                           className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
                        >
                           <option value="2">2% de Cashback</option>
                           <option value="5">5% de Cashback</option>
                           <option value="10">10% de Cashback</option>
                           <option value="15">15% de Cashback</option>
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">Mínimo para Resgate de Pontos</label>
                     <input 
                        type="number"
                        value={minRedeemPoints}
                        onChange={(e) => setMinRedeemPoints(e.target.value)}
                        className="w-full bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none placeholder-slate-600"
                     />
                     <span className="text-[10px] text-slate-500 mt-1 block">O {config.terminology.client} só poderá resgatar descontos extras se superar este limite.</span>
                  </div>

                  <hr className="border-white/5 my-4" />

                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
                     <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Atividade Autopilot</span>
                     <p className="text-xs text-slate-300 leading-relaxed">
                        Ao mudar de nível ou atingir o cashback mínimo para resgate, o assistente pode enviar um WhatsApp de notificação lembrando o cliente de retornar para uma consulta.
                     </p>
                  </div>

                  <button 
                     type="button" 
                     onClick={handleSaveSettings}
                     className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-xl transition shadow-[0_0_15px_rgba(147,51,234,0.3)] mt-2"
                  >
                     Salvar Configurações Growth
                  </button>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* MODAL CLIENTE */}
      <AnimatePresence>
         {selectedClient && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
           >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0C1627] border border-[#1A2C47] p-8 rounded-3xl w-full max-w-md relative shadow-2xl flex flex-col items-center"
              >
                 <button 
                   onClick={() => setSelectedClient(null)}
                   className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                 >
                   <X className="w-5 h-5" />
                 </button>
                 
                 <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                   {selectedClient.name.charAt(0)}
                 </div>
                 
                 <h3 className="text-2xl font-bold text-white tracking-tight">{selectedClient.name}</h3>
                 <p className="text-slate-400 mb-2">{selectedClient.phone}</p>
                 
                 <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    {selectedClient.badges?.map((badge: string, i: number) => (
                       <span key={i} className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full shadow-sm">{badge}</span>
                    ))}
                 </div>

                 <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border mb-8 ${getTierColor(selectedClient.tier)}`}>
                    Status: {selectedClient.tier}
                 </div>

                 <div className="w-full bg-[#1A2C47]/50 rounded-2xl p-6 border border-[#253B5C] text-center mb-6">
                    <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-2">Saldo Atual</p>
                    <p className="text-5xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] neon-text">
                       {selectedClient.points} <span className="text-xl text-blue-500/50">pts</span>
                    </p>
                 </div>

                 {actionType ? (
                    <div className="w-full mb-6 p-4 rounded-xl bg-[#09111D] border border-[#1A2C47] space-y-3">
                       <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block">
                          {actionType === 'add' ? 'Adicionar Pontos' : 'Resgatar Pontos'}
                       </label>
                       <input 
                         type="number" 
                         value={amount}
                         onChange={(e) => setAmount(e.target.value)}
                         placeholder="Qtd de pontos"
                         className="w-full bg-[#0C1627] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                       />
                       <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => setActionType(null)}
                            className="flex-1 py-2 bg-transparent border border-[#1A2C47] text-slate-400 hover:text-white rounded-lg transition-colors text-sm font-medium"
                          >
                             Cancelar
                          </button>
                          <button 
                            onClick={handleAction}
                            className={`flex-1 py-2 text-white rounded-lg transition-all text-sm font-bold shadow-[0_0_15px_rgba(0,0,0,0.3)] ${
                              actionType === 'add' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                            }`}
                          >
                             Confirmar
                          </button>
                       </div>
                    </div>
                 ) : (
                    <div className="flex gap-3 w-full">
                       <button 
                         onClick={() => setActionType('redeem')}
                         className="flex-1 py-3 bg-[#1A2C47] hover:bg-[#253B5C] text-white font-semibold rounded-xl transition-all border border-[#253B5C] flex items-center justify-center gap-2"
                       >
                          <Minus className="w-4 h-4" /> Resgatar
                       </button>
                       <button 
                         onClick={() => setActionType('add')}
                         className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
                       >
                          <Plus className="w-4 h-4" /> + Pontos
                       </button>
                    </div>
                 )}
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
