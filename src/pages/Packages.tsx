import { useState } from 'react';
import { Package, Plus, Search, Scissors, Calendar, Shield, CreditCard, ChevronDown } from 'lucide-react';
import { useNicheStore } from '../store/niche';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/auth';

const mockPackages = [
  { id: '1', name: 'Pacote 10 Sessões Drenagem', price: 950.00, servicesCount: 10, sold: 15, isActive: true },
  { id: '2', name: 'Combo Corte + Barba (Trimestral)', price: 350.00, servicesCount: 6, sold: 42, isActive: true },
  { id: '3', name: 'Protocolo Seca Barriga', price: 1200.00, servicesCount: 12, sold: 8, isActive: false },
];

const mockClubs = [
  { id: 'c1', name: 'Clube VIP Mensal', price: 199.90, subscribers: 34, isActive: true },
  { id: 'c2', name: 'Assinatura Premium', price: 349.90, subscribers: 12, isActive: true },
];

export default function Packages() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const isDemo = useAuthStore(state => state.user?.isDemo === true);

  const [packages, setPackages] = useState(isDemo ? mockPackages : []);
  const [clubs, setClubs] = useState(isDemo ? mockClubs : []);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'packages' | 'clubs'>('packages');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full">
      <div className="flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-2">Pacotes & Assinaturas</h1>
            <p className="text-slate-400">Gerencie pacotes pré-pagos e clubes de assinatura recorrentes.</p>
         </div>
         <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center gap-2"
         >
           <Plus className="w-5 h-5" />
           {activeTab === 'packages' ? 'Novo Pacote' : 'Novo Clube'}
         </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-card flex items-center gap-4 border border-purple-500/20">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
               <Package className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-400">Receita Recorrente (MRR)</p>
               <p className="text-2xl font-bold text-white">{isDemo ? "R$ 10.995,40" : "Não apurado"}</p>
            </div>
         </div>
         <div className="glass-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
               <CreditCard className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-400">Assinantes Ativos</p>
               <p className="text-2xl font-bold text-white">{isDemo ? "46" : "0"}</p>
            </div>
         </div>
         <div className="glass-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
               <Calendar className="w-6 h-6" />
            </div>
            <div>
               <p className="text-sm text-slate-400">Pacotes Vendidos</p>
               <p className="text-2xl font-bold text-white">{isDemo ? "65" : "0"}</p>
            </div>
         </div>
      </div>

      {/* Search & List */}
      <div className="glass-card p-6 flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6 justify-between">
            <div className="flex bg-[#050B14] p-1 rounded-xl border border-[#1A2C47]">
              <button 
                onClick={() => setActiveTab('packages')}
                className={`py-2 px-6 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'packages' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Pacotes Avulsos
              </button>
              <button 
                onClick={() => setActiveTab('clubs')}
                className={`py-2 px-6 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'clubs' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Clube VIP <span className="px-1.5 py-0.5 bg-yellow-400 text-black text-[10px] rounded-full uppercase tracking-wider font-bold">Novo</span>
              </button>
            </div>
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar ${activeTab === 'packages' ? 'pacotes' : 'clubes'}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {activeTab === 'packages' && packages.map(pkg => (
                <div key={pkg.id} className="bg-[#09111D] border border-[#1A2C47] rounded-2xl p-5 hover:border-[#253B5C] transition-all relative overflow-hidden group">
                   {!pkg.isActive && <div className="absolute top-3 right-3 bg-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Inativo</div>}
                   <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20">
                     <Package className="w-5 h-5" />
                   </div>
                   <h3 className="font-semibold text-lg text-white mb-1">{pkg.name}</h3>
                   <p className="text-2xl font-bold text-emerald-400 mb-4">R$ {pkg.price.toFixed(2)}</p>
                   
                   <div className="space-y-2 mb-6">
                      <div className="flex items-center justify-between text-sm">
                         <span className="text-slate-400">Quantidade:</span>
                         <span className="font-medium text-white">{pkg.servicesCount} sessões</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                         <span className="text-slate-400">Vendas:</span>
                         <span className="font-medium text-white">{pkg.sold} vendidos</span>
                      </div>
                   </div>

                   <button className="w-full py-2 bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 rounded-xl font-semibold transition-colors text-sm border border-purple-500/20">
                     Editar / Ver Vendas
                   </button>
                </div>
             ))}

             {activeTab === 'clubs' && clubs.map(club => (
                <div key={club.id} className="bg-gradient-to-br from-[#0C1627] to-[#09111D] border border-yellow-500/30 rounded-2xl p-5 hover:border-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.05)] transition-all relative overflow-hidden group">
                   {!club.isActive && <div className="absolute top-3 right-3 bg-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Inativo</div>}
                   <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-500/10 blur-2xl rounded-full"></div>
                   <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 mb-4 border border-yellow-500/20 relative z-10">
                     <Shield className="w-5 h-5" />
                   </div>
                   <h3 className="font-semibold text-lg text-white mb-1 relative z-10">{club.name}</h3>
                   <p className="text-2xl font-bold text-yellow-400 mb-4 flex items-end gap-1 relative z-10">R$ {club.price.toFixed(2)} <span className="text-xs text-slate-400 mb-1 font-normal">/mês</span></p>
                   
                   <div className="space-y-2 mb-6 relative z-10">
                      <div className="flex items-center justify-between text-sm">
                         <span className="text-slate-400">Assinantes Ativos:</span>
                         <span className="font-bold text-white flex items-center gap-1"><CreditCard className="w-3 h-3 text-emerald-400" /> {club.subscribers}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                         <span className="text-slate-400">Receita Estimada:</span>
                         <span className="font-medium text-emerald-400">R$ {(club.price * club.subscribers).toFixed(2)} /mês</span>
                      </div>
                   </div>

                   <button className="w-full py-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-xl font-semibold transition-colors text-sm border border-yellow-500/30 relative z-10">
                     Gerenciar Clube
                   </button>
                </div>
             ))}
          </div>
      </div>
    </div>
  );
}
