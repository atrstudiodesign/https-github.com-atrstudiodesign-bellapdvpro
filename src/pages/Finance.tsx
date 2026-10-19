import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTransactionStore } from '../store/transactions';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { DollarSign, ArrowUpRight, ArrowDownRight, Activity, Wallet, CreditCard, Banknote, Filter, Layers, Sparkles, AlertTriangle, ShieldCheck, Zap, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Finance() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const methodParam = searchParams.get('method') || 'all';

  const [period, setPeriod] = useState('7-days');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [filterType, setFilterType] = useState('all');
  const [filterMethod, setFilterMethod] = useState(methodParam);
  const [searchTerm, setSearchTerm] = useState(queryParam);

  useEffect(() => {
    if (queryParam) setSearchTerm(queryParam);
    if (methodParam && methodParam !== 'all') setFilterMethod(methodParam);
  }, [queryParam, methodParam]);

  const transactions = useTransactionStore(state => state.transactions);
  const isLoaded = useTransactionStore(state => state.isLoaded);
  const now = new Date();
  const inSelectedPeriod = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime()) || date > now) return false;
    if (period === 'today') return date.toDateString() === now.toDateString();
    if (period === '7-days') return date.getTime() >= now.getTime() - 7 * 86400000;
    if (period === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (period === 'last-month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date.getFullYear() === lastMonth.getFullYear() && date.getMonth() === lastMonth.getMonth();
    }
    return false;
  };
  const completed = transactions.filter(tx => tx.status === 'completed' && inSelectedPeriod(tx.date));
  const revenue = completed.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
  const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const methods: Record<string, string> = { pix: 'PIX', card: 'Credit Card', cash: 'Cash', split: 'Split' };
  const methodPercent = (method: string) => completed.length
    ? Math.round(completed.filter(tx => tx.paymentMethod === method).length / completed.length * 100)
    : 0;
  const filteredTransactions = completed
    .map(tx => ({
      id: tx.id,
      desc: `Venda - Ticket #${tx.id.slice(0, 8)}`,
      type: 'income',
      value: Number(tx.total) || 0,
      method: methods[tx.paymentMethod] || tx.paymentMethod,
      date: new Date(tx.date).toLocaleString('pt-BR')
    }))
    .filter(tx => (filterType === 'all' || tx.type === filterType) &&
      (filterMethod === 'all' || tx.method.toLowerCase().includes(filterMethod.toLowerCase())) &&
      (!searchTerm || tx.desc.toLowerCase().includes(searchTerm.toLowerCase()) || tx.id.toLowerCase().includes(searchTerm.toLowerCase()) || tx.method.toLowerCase().includes(searchTerm.toLowerCase())));
  const flowByDate = new Map<string, number>();
  for (const tx of completed) {
    const key = new Date(tx.date).toLocaleDateString('pt-BR');
    flowByDate.set(key, (flowByDate.get(key) || 0) + (Number(tx.total) || 0));
  }
  const cashFlow = [...flowByDate.entries()].map(([name, income]) => ({ name, income }));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-1">Caixa e Financeiro</h1>
            <p className="text-slate-400 text-sm">Receitas e vendas confirmadas do PDV. Despesas, saldo real e DRE aguardam integração.</p>
         </div>
         <select 
           value={period}
           onChange={(e) => setPeriod(e.target.value)}
           className="bg-[#0C1627] border border-[#1A2C47] rounded-lg px-4 py-2 text-sm text-slate-300 outline-none focus:border-blue-500"
         >
           <option value="today">Hoje</option>
           <option value="7-days">Últimos 7 dias</option>
           <option value="month">Este Mês</option>
           <option value="last-month">Mês Passado</option>
         </select>
      </div>

      <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Receitas abaixo derivam das vendas concluídas carregadas do PDV. Despesas, saldos, lucros, DRE e cobranças ainda não são apurados; não use este painel como contabilidade oficial.
      </div>

      {/* TABS */}
      <div className="flex gap-4 border-b border-[#1A2C47]">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Visão Geral
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'transactions' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Transações
        </button>
        <button 
          onClick={() => setActiveTab('dre')}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'dre' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          Relatório DRE
        </button>
        <button 
          onClick={() => setActiveTab('ai_billing')}
          className={`pb-3 px-2 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'ai_billing' ? 'border-purple-500 text-purple-400' : 'border-transparent text-purple-400/70 hover:text-purple-300'}`}
        >
          <Sparkles className="w-4 h-4" /> Cobrança IA
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-[#0C1627] text-blue-400">
                       <Wallet className="w-5 h-5" />
                    </div>
                 </div>
                 <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Saldo Atual</h3>
                 <p className="text-2xl font-semibold font-sans tracking-tight text-white">Não apurado</p>
              </div>

              <div className="glass-card p-5 relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-[#0C1627] text-emerald-400">
                       <ArrowUpRight className="w-5 h-5" />
                    </div>
                 </div>
                 <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Receitas</h3>
                 <p className="text-2xl font-semibold font-sans tracking-tight text-white">{isLoaded ? money(revenue) : 'Carregando...'}</p>
              </div>

              <div className="glass-card p-5 relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-[#0C1627] text-red-400">
                       <ArrowDownRight className="w-5 h-5" />
                    </div>
                 </div>
                 <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Despesas</h3>
                 <p className="text-2xl font-semibold font-sans tracking-tight text-white">Não apurado</p>
              </div>

              <div className="glass-card p-5 relative overflow-hidden group">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-[#0C1627] text-purple-400">
                       <Activity className="w-5 h-5" />
                    </div>
                 </div>
                 <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Lucro Líquido</h3>
                 <p className="text-2xl font-semibold font-sans tracking-tight text-white">Não apurado</p>
              </div>
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="col-span-2 glass-card p-6 border-[#1A2C47]">
                 <h3 className="text-lg font-semibold tracking-tight text-white mb-6">Fluxo de Caixa</h3>
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlow} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`}/>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#f8fafc' }}
                        />
                        <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
               </div>

               <div className="glass-card p-6 border-[#1A2C47] flex flex-col">
                  <h3 className="text-lg font-semibold tracking-tight text-white mb-2">Métodos de Recebimento</h3>
                  <div className="flex-1 mt-6 space-y-4">
                     <div className="flex items-center justify-between p-3 rounded-lg bg-[#0C1627] border border-[#1A2C47]">
                        <div className="flex items-center gap-3">
                           <Banknote className="w-5 h-5 text-emerald-400" />
                           <span className="text-white font-medium">PIX</span>
                        </div>
                        <span className="text-slate-400 font-medium"> {methodPercent("pix")}%</span>
                     </div>
                     <div className="flex items-center justify-between p-3 rounded-lg bg-[#0C1627] border border-[#1A2C47]">
                        <div className="flex items-center gap-3">
                           <CreditCard className="w-5 h-5 text-blue-400" />
                           <span className="text-white font-medium">Cartão Crédito</span>
                        </div>
                        <span className="text-slate-400 font-medium"> {methodPercent("card")}%</span>
                     </div>
                     <div className="flex items-center justify-between p-3 rounded-lg bg-[#0C1627] border border-[#1A2C47]">
                        <div className="flex items-center gap-3">
                           <DollarSign className="w-5 h-5 text-yellow-400" />
                           <span className="text-white font-medium">Dinheiro</span>
                        </div>
                        <span className="text-slate-400 font-medium"> {methodPercent("cash")}%</span>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div 
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 border-[#1A2C47]"
          >
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg font-semibold tracking-tight text-white mb-1">Histórico de Transações</h3>
                <div className="flex flex-wrap items-center gap-2">
                   <select 
                     value={filterType}
                     onChange={(e) => setFilterType(e.target.value)}
                     className="bg-[#0C1627] border border-[#1A2C47] rounded-lg px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-blue-500"
                   >
                     <option value="all">Todas as Operações</option>
                     <option value="income">Apenas Entradas</option>
                     <option value="expense">Apenas Saídas</option>
                   </select>

                   <select 
                     value={filterMethod}
                     onChange={(e) => setFilterMethod(e.target.value)}
                     className="bg-[#0C1627] border border-[#1A2C47] rounded-lg px-3 py-1.5 text-sm text-slate-300 outline-none focus:border-blue-500"
                   >
                     <option value="all">Qualquer Método</option>
                     <option value="pix">PIX</option>
                     <option value="credit card">Cartão de Crédito</option>
                     <option value="cash">Dinheiro / Cash</option>
                     <option value="bank transfer">Transferência</option>
                     <option value="boleto">Boleto</option>
                   </select>
                </div>
             </div>

             <div className="space-y-3">
                {isLoaded && filteredTransactions.length === 0 && <p className="text-slate-400 text-sm">Nenhuma venda concluída encontrada neste período.</p>}
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0C1627] border border-[#1A2C47] hover:border-[#253B5C] transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-lg ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                           {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                        </div>
                        <div>
                           <p className="text-white font-medium">{tx.desc}</p>
                           <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span>{tx.date}</span>
                              <span>•</span>
                              <span>{tx.method}</span>
                           </div>
                        </div>
                     </div>
                     <div className={`text-lg font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {tx.value.toFixed(2)}
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'dre' && (
          <motion.div 
            key="dre"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 border-[#1A2C47]"
          >
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight text-white">Demonstrativo de Resultado (DRE)</h3>
                <button disabled title="Relatório requer integração financeira." className="text-sm bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-medium cursor-not-allowed">
                   PDF indisponível
                </button>
             </div>
             
             <div className="rounded-xl border border-[#1A2C47] overflow-hidden">
                <div className="grid grid-cols-12 bg-[#09111D] p-4 border-b border-[#1A2C47] text-xs font-semibold uppercase tracking-wider text-slate-400">
                   <div className="col-span-8">Descrição</div>
                   <div className="col-span-4 text-right">Valor</div>
                </div>

                {/* Receitas */}
                <div className="grid grid-cols-12 p-4 border-b border-[#1A2C47] items-center bg-blue-500/5">
                   <div className="col-span-8 font-semibold text-white">1. Receita Operacional Bruta</div>
                   <div className="col-span-4 text-right font-bold text-emerald-400">Não apurado</div>
                </div>
                <div className="grid grid-cols-12 p-3 pl-8 text-sm border-b border-[#1A2C47]/50 items-center bg-[#0C1627]/50">
                   <div className="col-span-8 text-slate-300">Vendas de Serviços</div>
                   <div className="col-span-4 text-right">Não apurado</div>
                </div>
                <div className="grid grid-cols-12 p-3 pl-8 text-sm border-b border-[#1A2C47]/50 items-center bg-[#0C1627]/50">
                   <div className="col-span-8 text-slate-300">Vendas de Produtos</div>
                   <div className="col-span-4 text-right">Não apurado</div>
                </div>

                {/* Despesas Variáveis */}
                <div className="grid grid-cols-12 p-4 border-b border-[#1A2C47] items-center bg-red-500/5 mt-4">
                   <div className="col-span-8 font-semibold text-white">2. Custos e Despesas Variáveis</div>
                   <div className="col-span-4 text-right font-bold text-red-400">- Não apurado</div>
                </div>
                <div className="grid grid-cols-12 p-3 pl-8 text-sm border-b border-[#1A2C47]/50 items-center bg-[#0C1627]/50">
                   <div className="col-span-8 text-slate-300">Comissões</div>
                   <div className="col-span-4 text-right">- Não apurado</div>
                </div>
                <div className="grid grid-cols-12 p-3 pl-8 text-sm border-b border-[#1A2C47]/50 items-center bg-[#0C1627]/50">
                   <div className="col-span-8 text-slate-300">Taxas de Cartão</div>
                   <div className="col-span-4 text-right">- Não apurado</div>
                </div>

                {/* Margem de Contribuição */}
                <div className="grid grid-cols-12 p-4 border-b border-[#1A2C47] items-center bg-cyan-500/10 mt-4">
                   <div className="col-span-8 font-bold text-white uppercase tracking-wider">3. Margem de Contribuição (1 - 2)</div>
                   <div className="col-span-4 text-right font-bold text-cyan-400">Não apurado</div>
                </div>

                 {/* Despesas Fixas */}
                 <div className="grid grid-cols-12 p-4 border-b border-[#1A2C47] items-center bg-orange-500/5 mt-4">
                   <div className="col-span-8 font-semibold text-white">4. Despesas Fixas</div>
                   <div className="col-span-4 text-right font-bold text-orange-400">- Não apurado</div>
                </div>
                <div className="grid grid-cols-12 p-3 pl-8 text-sm border-b border-[#1A2C47]/50 items-center bg-[#0C1627]/50">
                   <div className="col-span-8 text-slate-300">Aluguel</div>
                   <div className="col-span-4 text-right">- Não apurado</div>
                </div>
                <div className="grid grid-cols-12 p-3 pl-8 text-sm border-b border-[#1A2C47]/50 items-center bg-[#0C1627]/50">
                   <div className="col-span-8 text-slate-300">Energia, Água, Internet</div>
                   <div className="col-span-4 text-right">- Não apurado</div>
                </div>
                <div className="grid grid-cols-12 p-3 pl-8 text-sm border-b border-[#1A2C47]/50 items-center bg-[#0C1627]/50">
                   <div className="col-span-8 text-slate-300">Marketing</div>
                   <div className="col-span-4 text-right">- Não apurado</div>
                </div>

                {/* Resultado Líquido */}
                <div className="grid grid-cols-12 p-6 items-center bg-[#1A2C47] mt-4">
                   <div className="col-span-8 font-display text-xl font-bold text-white">5. Resultado Líquido</div>
                   <div className="col-span-4 text-right font-display text-2xl font-bold text-emerald-400">Não apurado</div>
                </div>
             </div>
          </motion.div>
        )}
        
        {activeTab === 'ai_billing' && (
          <motion.div 
            key="ai_billing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-gradient-to-br from-[#0C1627] to-[#110524] rounded-2xl p-6 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                   <Bot className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
                       Bella Recovery AI <Sparkles className="w-4 h-4 text-purple-400" />
                    </h2>
                    <p className="text-purple-300 text-sm">Decisões automatizadas baseadas em Risco de Cliente (Machine Learning).</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-[#050B14]/50 border border-purple-500/20 rounded-xl p-5">
                     <div className="flex items-center gap-2 text-red-400 mb-2 font-bold">
                        <AlertTriangle className="w-5 h-5" /> Alto Risco (71 - 100)
                     </div>
                     <p className="text-slate-400 text-xs mb-4">Clientes com histórico de atraso recorrente. O sistema toma medidas mais rígidas.</p>
                     <ul className="text-xs text-slate-300 space-y-2">
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> Emite cobrança 5 dias antes</li>
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> WhatsApp Diário (Tom: Urgente)</li>
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> Sem opção de parcelamento</li>
                     </ul>
                  </div>

                  <div className="bg-[#050B14]/50 border border-purple-500/20 rounded-xl p-5">
                     <div className="flex items-center gap-2 text-yellow-400 mb-2 font-bold">
                        <AlertTriangle className="w-5 h-5" /> Risco Médio (41 - 70)
                     </div>
                     <p className="text-slate-400 text-xs mb-4">Clientes com atrasos esporádicos. Foco em lembretes amigáveis.</p>
                     <ul className="text-xs text-slate-300 space-y-2">
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> Lembrete 2 dias antes</li>
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> WhatsApp + SMS (Tom: Amigável)</li>
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> Re-tentativa automática (PIX Copia e Cola)</li>
                     </ul>
                  </div>

                  <div className="bg-[#050B14]/50 border border-purple-500/20 rounded-xl p-5">
                     <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold">
                        <ShieldCheck className="w-5 h-5" /> Baixo Risco (0 - 40)
                     </div>
                     <p className="text-slate-400 text-xs mb-4">Ótimos pagadores. Experiência friction-less e automática.</p>
                     <ul className="text-xs text-slate-300 space-y-2">
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> Cobrança silenciosa no vcto.</li>
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> Mensagem de agradecimento (WhatsApp)</li>
                        <li className="flex gap-2 items-center"><Zap className="w-3 h-3 text-purple-400" /> Reward Score ativado</li>
                     </ul>
                  </div>
               </div>
            </div>

            <h3 className="text-lg font-bold text-white mt-4">Decisões Tomadas Hoje pela IA</h3>
            <div className="bg-[#0C1627] rounded-xl border border-[#1A2C47] overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-[#1A2C47]/50 text-xs text-slate-400 uppercase tracking-widest">
                     <tr>
                       <th className="px-6 py-4 font-semibold">Cliente</th>
                       <th className="px-6 py-4 font-semibold">Vencimento</th>
                       <th className="px-6 py-4 font-semibold">Risk Score</th>
                       <th className="px-6 py-4 font-semibold">Estratégia Automática</th>
                       <th className="px-6 py-4 font-semibold text-right">Ação Tomada</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[#1A2C47]">
                     <tr className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 text-white font-medium">Juliana Martins</td>
                       <td className="px-6 py-4 text-slate-400">Hoje</td>
                       <td className="px-6 py-4">
                         <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 font-bold border border-red-500/20">78</span>
                       </td>
                       <td className="px-6 py-4 text-slate-400 text-xs uppercase font-bold tracking-wider">Agressiva</td>
                       <td className="px-6 py-4 text-right">
                         <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded font-bold">Disparou Zap (Urgente)</span>
                       </td>
                     </tr>
                     <tr className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 text-white font-medium">Ana Souza</td>
                       <td className="px-6 py-4 text-slate-400">Em 2 dias</td>
                       <td className="px-6 py-4">
                         <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 font-bold border border-yellow-500/20">45</span>
                       </td>
                       <td className="px-6 py-4 text-slate-400 text-xs uppercase font-bold tracking-wider">Amigável</td>
                       <td className="px-6 py-4 text-right">
                         <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded font-bold">Agendou Lembrete SMS</span>
                       </td>
                     </tr>
                     <tr className="hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 text-white font-medium">Carlos Mendes</td>
                       <td className="px-6 py-4 text-slate-400">Hoje</td>
                       <td className="px-6 py-4">
                         <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">12</span>
                       </td>
                       <td className="px-6 py-4 text-slate-400 text-xs uppercase font-bold tracking-wider">Silenciosa</td>
                       <td className="px-6 py-4 text-right">
                         <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-bold border border-emerald-500/20">Autorizou PIX</span>
                       </td>
                     </tr>
                   </tbody>
                 </table>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
