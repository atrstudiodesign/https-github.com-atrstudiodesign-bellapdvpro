import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Keyboard, 
  X, 
  Search, 
  ShoppingCart, 
  Compass, 
  Sliders, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { useShortcutsStore } from '../../store/shortcuts';
import { SHORTCUTS_REGISTRY, ShortcutDefinition } from '../../hooks/useGlobalShortcuts';

export function ShortcutsModal() {
  const { isModalOpen, closeModal, isMac } = useShortcutsStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pos' | 'navigation' | 'system'>('all');

  const filteredShortcuts = useMemo(() => {
    return SHORTCUTS_REGISTRY.filter((s) => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchSearch = 
        !q || 
        s.title.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) ||
        s.keys.join(' ').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  const handleShortcutClick = (shortcut: ShortcutDefinition) => {
    closeModal();
    if (shortcut.id === 'pos-open' || shortcut.id === 'pos-search') {
      navigate('/pos');
    } else if (shortcut.id === 'pos-new-sale') {
      window.dispatchEvent(new CustomEvent('pos-clear-cart'));
      navigate('/pos?action=new');
    } else if (shortcut.id === 'nav-schedule') {
      navigate('/schedule');
    } else if (shortcut.id === 'nav-clients') {
      navigate('/clients');
    } else if (shortcut.id === 'nav-finance') {
      navigate('/finance');
    } else if (shortcut.id === 'nav-dashboard') {
      navigate('/');
    }
  };

  const renderKey = (key: string) => {
    let display = key;
    if (isMac && key === 'Ctrl') display = '⌘';
    if (isMac && key === 'Alt') display = '⌥';
    if (isMac && key === 'Shift') display = '⇧';

    return (
      <kbd 
        key={key} 
        className="inline-flex items-center justify-center min-w-[26px] h-7 px-2 text-[11px] font-mono font-bold text-cyan-300 bg-[#0F172A] border border-white/15 rounded shadow-[0_2px_0_0_rgba(15,23,42,0.9),0_1px_3px_rgba(0,0,0,0.4)] transition-all select-none"
      >
        {display}
      </kbd>
    );
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,217,255,0.1)] flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-transparent to-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.2)]">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Atalhos de Teclado
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Modo Desktop
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acelere o atendimento e a navegação no sistema com combinações rápidas.
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter and Category Pills */}
            <div className="p-4 border-b border-white/5 bg-[#0B0F1A]/60 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar atalho por nome ou tecla..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0F172A] border border-white/10 focus:border-cyan-500/50 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'pos', label: 'Frente de Caixa (PDV)' },
                  { id: 'navigation', label: 'Navegação' },
                  { id: 'system', label: 'Sistema' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shortcuts List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-2 max-h-[50vh] divide-y divide-white/5">
              {filteredShortcuts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  Nenhum atalho encontrado para "<span className="text-slate-300">{search}</span>".
                </div>
              ) : (
                filteredShortcuts.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleShortcutClick(s)}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                          {s.title}
                        </span>
                        {s.category === 'pos' && (
                          <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                            PDV
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {s.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        {s.keys.map((k) => renderKey(k))}
                      </div>

                      {s.altKeys && (
                        <>
                          <span className="text-[11px] text-slate-500 font-mono">ou</span>
                          <div className="flex items-center gap-1">
                            {s.altKeys.map((k) => renderKey(k))}
                          </div>
                        </>
                      )}

                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all -ml-1 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with Pro Tip */}
            <div className="p-3.5 sm:p-4 bg-[#0B0F1A] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Dica: Pressione <kbd className="px-1 py-0.5 text-[10px] bg-white/10 rounded border border-white/15 text-slate-200">?</kbd> em qualquer tela para abrir este guia.
                </span>
              </div>
              <button
                onClick={closeModal}
                className="w-full sm:w-auto px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Entendido (Esc)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
