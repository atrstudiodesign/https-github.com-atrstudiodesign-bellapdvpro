// Vite cache bust
import { useState } from 'react';
import { useNicheStore } from '../store/niche';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, CalendarDays, ArrowUpRight, Trophy, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const mockPerformanceData = [
  { name: 'Corte Degradê', uv: 4000, pv: 2400 },
  { name: 'Barba Terapia', uv: 3000, pv: 1398 },
  { name: 'Sobrancelha', uv: 2000, pv: 9800 },
  { name: 'Coloração', uv: 2780, pv: 3908 },
  { name: 'Alisamento', uv: 1890, pv: 4800 },
];

const mockPieData = [
  { name: 'Serviços', value: 70 },
  { name: 'Produtos', value: 30 },
];
const COLORS = ['#3b82f6', '#10b981'];

export default function Reports() {
  const { getConfig } = useNicheStore();
  const config = getConfig();

  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('"Analisando os últimos 7 dias, notei que a <strong>Sobrancelha</strong> teve um aumento de 15% na demanda durante o período da tarde. Sugiro alocar mais ' + config.terminology.employee + 's disponíveis entre 14h e 17h."');

  const askAI = () => {
     if (!aiInput.trim()) return;
     const id = toast.loading('Analisando dados...');
     setTimeout(() => {
        setAiResponse(`"Com base nos seus dados atuais, ${aiInput.toLowerCase().includes('lucro') ? 'o seu dia mais lucrativo está sendo a sexta-feira, recomendo investir em promoções na terça-feira' : 'os clientes estão com uma recorrência média de 15 dias. Continuem com as automações de WhatsApp ativas.'}"`);
        setAiInput('');
        toast.success('Resposta gerada!', { id });
     }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-1">Relatórios Avançados</h1>
            <p className="text-slate-400 text-sm">Métricas e performance da sua {config.title.toLowerCase()}.</p>
         </div>
         <select className="bg-[#0C1627] border border-[#1A2C47] rounded-lg px-4 py-2 text-sm text-slate-300 outline-none focus:border-blue-500">
           <option>Este Mês</option>
           <option>Mês Passado</option>
           <option>Últimos 3 meses</option>
         </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Top Services */}
         <div className="col-span-2 glass-card p-6 border-[#1A2C47]">
            <h3 className="text-lg font-semibold tracking-tight text-white mb-6">Top {config.terminology.service}s</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={mockPerformanceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                   <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                   <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                   <Tooltip 
                     cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                     contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                     itemStyle={{ color: '#f8fafc' }}
                   />
                   <Bar dataKey="uv" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Distribution */}
         <div className="glass-card p-6 border-[#1A2C47] flex flex-col">
            <h3 className="text-lg font-semibold tracking-tight text-white mb-2">Composição de Receita</h3>
            <div className="flex-1 min-h-[250px] relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={mockPieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {mockPieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                 <span className="text-2xl font-bold text-white">100%</span>
               </div>
            </div>
            <div className="mt-4 flex gap-4 justify-center">
               <div className="flex gap-2 items-center text-sm">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-slate-300">Serviços</span>
               </div>
               <div className="flex gap-2 items-center text-sm">
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 <span className="text-slate-300">Produtos</span>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-gradient-to-br from-[#0C1627] to-[#110524] rounded-2xl p-6 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)] mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mt-1 border border-purple-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex-1">
             <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
               Analista de Dados IA <Sparkles className="w-4 h-4 text-purple-400" />
             </h2>
             <div className="bg-[#050B14] border border-purple-500/20 rounded-xl p-4 text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiResponse }} />
             <div className="mt-4 flex gap-2">
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askAI()}
                  placeholder="Pergunte algo sobre seus dados..." 
                  className="flex-1 bg-[#050B14] border border-[#1A2C47] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-purple-500 transition-colors" 
                />
                <button onClick={askAI} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-semibold transition-colors text-sm">
                   Perguntar
                </button>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Profitable Hours */}
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 shadow-lg">
           <h3 className="text-lg font-semibold tracking-tight text-white mb-6 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-cyan-400" /> Horários Mais Lucrativos
           </h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-white/5">
                 <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white w-20">18:00</span>
                    <div className="flex-1">
                      <div className="w-full bg-[#0B0F1A] rounded-full h-2 overflow-hidden">
                         <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                 </div>
                 <span className="text-cyan-400 font-semibold ml-4">R$ 4.2k</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-white/5">
                 <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white w-20">10:00</span>
                    <div className="flex-1">
                      <div className="w-full bg-[#0B0F1A] rounded-full h-2 overflow-hidden">
                         <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                 </div>
                 <span className="text-cyan-400 font-semibold ml-4">R$ 3.5k</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] border border-white/5">
                 <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white w-20">14:00</span>
                    <div className="flex-1">
                      <div className="w-full bg-[#0B0F1A] rounded-full h-2 overflow-hidden">
                         <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                 </div>
                 <span className="text-cyan-400 font-semibold ml-4">R$ 2.1k</span>
              </div>
           </div>
        </div>

        <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold tracking-tight text-white mb-6 flex items-center gap-2">
             <Trophy className="w-5 h-5 text-yellow-500" /> Ranking de {config.terminology.employee}s
          </h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 rounded-xl bg-[#0C1627] border border-[#1A2C47]">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">J</div>
                   <div>
                     <p className="text-white font-medium">João Silva</p>
                     <p className="text-xs text-slate-500">Barbeiro Sênior</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-400 font-semibold tracking-wide">R$ 5.430,00</p>
                  <p className="text-xs text-emerald-400 flex items-center justify-end gap-1"><ArrowUpRight className="w-3 h-3"/> 12%</p>
                </div>
             </div>
             <div className="flex items-center justify-between p-3 rounded-xl bg-[#0C1627] border border-[#1A2C47]">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">M</div>
                   <div>
                     <p className="text-white font-medium">Marcos Paulo</p>
                     <p className="text-xs text-slate-500">Barbeiro</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-400 font-semibold tracking-wide">R$ 3.210,00</p>
                  <p className="text-xs text-emerald-400 flex items-center justify-end gap-1"><ArrowUpRight className="w-3 h-3"/> 5%</p>
                </div>
             </div>
          </div>
        </div>

        <div className="glass-card p-6 border-[#1A2C47]">
          <h3 className="text-lg font-semibold tracking-tight text-white mb-6">Retenção de {config.terminology.client}s</h3>
          <div className="flex items-center justify-between h-full pb-4">
             <div className="flex-1 flex flex-col items-center justify-center border-r border-[#1A2C47]">
               <Users className="w-8 h-8 text-blue-400 mb-2"/>
               <p className="text-3xl font-bold text-white">45</p>
               <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Novos</p>
             </div>
             <div className="flex-1 flex flex-col items-center justify-center">
               <TrendingUp className="w-8 h-8 text-emerald-400 mb-2"/>
               <p className="text-3xl font-bold text-white">82%</p>
               <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Taxa de Retorno</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
