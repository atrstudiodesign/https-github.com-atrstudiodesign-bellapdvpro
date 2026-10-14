import { useState } from 'react';
import { useNicheStore } from '../store/niche';
import { Plus, Search, Edit, Trash2, Package, Tag, Filter, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const initialServices: CatalogItem[] = [
  { id: '1', name: 'Corte Degradê', category: 'Cabelo', price: 45.00, duration: '45 min', type: 'service' },
  { id: '2', name: 'Barba Tradicional', category: 'Barba', price: 35.00, duration: '30 min', type: 'service' },
  { id: '3', name: 'Combo Corte + Barba', category: 'Combo', price: 70.00, duration: '1h 15min', type: 'service' },
];

const initialProducts: CatalogItem[] = [
  { id: 'P1', name: 'Pomada Modeladora Efeito Matte', category: 'Finalizadores', price: 55.00, stock: 12, type: 'product' },
  { id: 'P2', name: 'Óleo para Barba', category: 'Cuidados', price: 40.00, stock: 5, type: 'product' },
  { id: 'P3', name: 'Shampoo Anticaspa', category: 'Lavatório', price: 35.00, stock: 0, type: 'product' },
];

const initialCategories = ['Cabelo', 'Barba', 'Combo', 'Finalizadores', 'Cuidados', 'Lavatório'];

import { useCatalogStore, CatalogItem } from '../store/catalog';

export default function Services() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');

  const { items, addItem, updateItem, deleteItem, seedCatalog } = useCatalogStore();
  
  // Drived sets
  const services = items.filter(i => i.type === 'service');
  const products = items.filter(i => i.type === 'product');

  const [categories, setCategories] = useState<string[]>(initialCategories);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentItem, setCurrentItem] = useState<Partial<CatalogItem>>({});
  
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  const handleOpenModal = (mode: 'add' | 'edit', item: Partial<CatalogItem> = {}) => {
    setModalMode(mode);
    setCurrentItem(mode === 'add' ? { name: '', category: categories[0] || 'Geral', price: 0, type: activeTab === 'services' ? 'service' : 'product', duration: '30 min', stock: 0 } : item);
    setIsModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!currentItem.name) return;

    if (modalMode === 'add') {
      await addItem({ ...currentItem, id: Date.now().toString(), type: activeTab === 'services' ? 'service' : 'product' } as CatalogItem);
    } else {
      await updateItem(currentItem.id!, currentItem);
    }
    setIsModalOpen(false);
  };

  const handleDeleteItem = async (id: string, type: 'service' | 'product') => {
    if (confirm(`Tem certeza que deseja excluir?`)) {
      await deleteItem(id);
    }
  };

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`Excluir a categoria "${cat}"?`)) {
      setCategories(categories.filter(c => c !== cat));
    }
  };

  const data = activeTab === 'services' ? services : products;
  let filteredData = data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  if (sortOrder === 'asc') {
    filteredData.sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'desc') {
    filteredData.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full relative">
      
      {/* Item Modal (Service/Product) */}
      <AnimatePresence>
        {isModalOpen && (
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
              className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                <h3 className="text-xl font-semibold text-white">
                  {modalMode === 'add' ? `Novo ${activeTab === 'services' ? 'Serviço' : 'Produto'}` : `Editar ${activeTab === 'services' ? 'Serviço' : 'Produto'}`}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Nome</label>
                    <input 
                      type="text" 
                      value={currentItem.name || ''}
                      onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                      placeholder="Nome do item"
                      className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Categoria</label>
                       <select 
                         value={currentItem.category || ''}
                         onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500 transition-colors"
                       >
                          {categories.map((cat, i) => <option key={`cat-${i}`} value={cat}>{cat}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Preço (R$)</label>
                       <input 
                         type="number" 
                         value={currentItem.price ?? 0}
                         onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                         step="0.01"
                         className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    {activeTab === 'services' ? (
                       <div>
                          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Duração Estimada</label>
                          <input 
                            type="text" 
                            value={currentItem.duration || ''}
                            onChange={(e) => setCurrentItem({ ...currentItem, duration: e.target.value })}
                            placeholder="30 min"
                            className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                          />
                       </div>
                    ) : (
                       <div>
                          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">Estoque Atual</label>
                          <input 
                            type="number" 
                            value={currentItem.stock ?? 0}
                            onChange={(e) => setCurrentItem({ ...currentItem, stock: parseInt(e.target.value) || 0 })}
                            className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                          />
                       </div>
                    )}
                 </div>
              </div>

              <div className="p-6 border-t border-[#1A2C47] flex gap-3 bg-[#09111D]">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 py-3 bg-transparent border border-[#1A2C47] text-slate-300 hover:bg-white/5 font-semibold rounded-xl transition-all"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={handleSaveItem}
                   className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                 >
                   Salvar Item
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories Modal */}
      <AnimatePresence>
        {isCategoriesModalOpen && (
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
              className="bg-[#0C1627] border border-[#1A2C47] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-[#1A2C47] flex items-center justify-between bg-[#09111D]">
                <h3 className="text-lg font-semibold text-white">Gerenciar Categorias</h3>
                <button 
                  onClick={() => setIsCategoriesModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nova categoria"
                      className="flex-1 bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl transition-colors font-semibold"
                    >
                      Add
                    </button>
                 </div>
                 <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {categories.map((cat, idx) => (
                      <div key={`cat-list-${idx}`} className="flex items-center justify-between p-3 bg-[#09111D] rounded-xl border border-[#1A2C47]">
                         <span className="text-sm text-slate-300">{cat}</span>
                         <button 
                           onClick={() => handleDeleteCategory(cat)}
                           className="text-red-400 hover:text-red-300 p-1"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Serviços & Produtos
          </h1>
          <p className="text-slate-400 text-sm">Organize seu catálogo, preços e estoque.</p>
        </div>
         <div className="flex gap-3 flex-wrap">
          <button 
            onClick={async () => {
              if (confirm(`Deseja preencher seu catálogo com os melhores serviços e produtos sugeridos para ${config.title}? Isso irá atualizar o Caixa (PDV), Autoatendimento e Agendamentos instantaneamente!`)) {
                const toastId = toast.loading('Populando catálogo da loja...');
                try {
                  await seedCatalog(config.type);
                  toast.success('Catálogo carregado e pronto para uso!', { id: toastId });
                } catch (err: any) {
                  console.error(err);
                  const msg = err instanceof Error ? err.message : String(err);
                  toast.error(`Erro ao popular seu catálogo: ${msg}`, { id: toastId });
                }
              }
            }}
            className="bg-[#1D1E3A]/80 hover:bg-[#2A2B5E] text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            Povoar de Modelo
          </button>
          
          <button 
            onClick={() => setIsCategoriesModalOpen(true)}
            className="bg-[#1A2C47] hover:bg-[#253B5C] text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all cursor-pointer"
          >
            <Package className="w-5 h-5" />
            Categorias
          </button>
          <button 
            onClick={() => handleOpenModal('add')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Novo {activeTab === 'services' ? 'Serviço' : 'Produto'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[#1A2C47]">
        <button 
          onClick={() => setActiveTab('services')}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'services' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Tag className="w-4 h-4" /> Serviços
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'products' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Package className="w-4 h-4" /> Produtos
        </button>
      </div>

      <div className="glass-card flex flex-col flex-1 border-[#1A2C47]">
         <div className="p-4 border-b border-[#1A2C47] flex gap-4 bg-[#09111D]">
            <div className="relative flex-1">
               <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder={`Buscar ${activeTab === 'services' ? 'serviços' : 'produtos'}...`}
                 className="w-full bg-[#0C1627] border border-[#1A2C47] rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-colors"
               />
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-4 bg-[#0C1627] border border-[#1A2C47] text-slate-300 rounded-xl focus:outline-none focus:border-blue-500 hover:bg-[#1A2C47]"
            >
              <option value="none">Ordenar</option>
              <option value="asc">Price Low to High</option>
              <option value="desc">Price High to Low</option>
            </select>
            <button className="px-4 bg-[#0C1627] border border-[#1A2C47] text-slate-300 rounded-xl flex items-center gap-2 hover:bg-[#1A2C47]">
               <Filter className="w-4 h-4" /> Filtrar
            </button>
         </div>

         <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
               {filteredData.length === 0 ? (
                  <div className="text-center py-16 px-4 max-w-sm mx-auto">
                     <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-pulse" />
                     <h3 className="text-lg font-bold text-white mb-2">Sem {activeTab === 'services' ? 'Serviços' : 'Produtos'}</h3>
                     <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Sua lista de {activeTab === 'services' ? 'serviços ou procedimentos' : 'produtos em estoque'} está vazia. Importe modelos específicos de {config.title} e tenha todos os recursos 100% integrados hoje mesmo!
                     </p>
                     <button 
                       onClick={async () => {
                         const toastId = toast.loading('Povoando catálogo da loja...');
                         try {
                           await seedCatalog(config.type);
                           toast.success('Catálogo preenchido com sucesso!', { id: toastId });
                         } catch (err) {
                           console.error(err);
                           toast.error('Erro ao preencher catálogo.', { id: toastId });
                         }
                       }}
                       className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl px-5 py-3 cursor-pointer transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] inline-flex items-center gap-2"
                     >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        Povoar Catálogo Padrão
                     </button>
                  </div>
               ) : (
                  filteredData.map((item) => (
                    <div key={`item-${item.id}`} className="flex items-center justify-between p-4 bg-[#0C1627] hover:bg-[#1A2C47]/50 rounded-xl border border-[#1A2C47] transition-colors group">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${item.type === 'service' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                             {item.name.charAt(0)}
                          </div>
                          <div>
                             <h4 className="text-white font-medium">{item.name}</h4>
                             <span className="text-xs text-slate-400 uppercase tracking-wider">{item.category}</span>
                          </div>
                       </div>

                       <div className="flex items-center gap-8">
                          {item.type === 'service' ? (
                             <div className="text-right">
                                <p className="text-sm font-semibold text-slate-300">{item.duration}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Duração</p>
                             </div>
                          ) : (
                             <div className="text-right">
                                <p className={`text-sm font-semibold ${(item.stock || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {(item.stock || 0) > 0 ? `${item.stock} un` : 'Sem estoque'}
                                </p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Estoque</p>
                             </div>
                          )}
                          
                          <div className="text-right w-24">
                             <p className="text-lg font-bold text-blue-400 font-sans">R$ {item.price.toFixed(2)}</p>
                          </div>

                          <div className="flex gap-2">
                             <button 
                               onClick={() => handleOpenModal('edit', item)}
                               className="p-2 bg-[#09111D] text-slate-400 hover:text-white border border-[#1A2C47] rounded-lg transition-colors cursor-pointer"
                             >
                                <Edit className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDeleteItem(item.id, item.type)}
                               className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
