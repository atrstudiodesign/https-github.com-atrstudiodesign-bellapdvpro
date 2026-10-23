import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useShortcutsStore } from '../store/shortcuts';

export interface ShortcutDefinition {
  id: string;
  title: string;
  description: string;
  category: 'navigation' | 'pos' | 'system';
  keys: string[]; // e.g. ['Ctrl', 'P'] or ['F2']
  altKeys?: string[]; // alternative key combination
  scope?: 'global' | 'pos';
}

export const SHORTCUTS_REGISTRY: ShortcutDefinition[] = [
  {
    id: 'pos-open',
    title: 'Frente de Caixa (PDV)',
    description: 'Abre o caixa imediatamente ou foca a busca se já estiver no PDV',
    category: 'navigation',
    keys: ['Ctrl', 'P'],
    altKeys: ['F2'],
    scope: 'global',
  },
  {
    id: 'pos-new-sale',
    title: 'Nova Venda',
    description: 'Inicia uma nova venda, limpando o carrinho e preparando o leitor/busca',
    category: 'pos',
    keys: ['Ctrl', 'N'],
    scope: 'global',
  },
  {
    id: 'pos-checkout',
    title: 'Finalizar Venda / Pagamento',
    description: 'Abre o painel de pagamento ou confirma a venda atual',
    category: 'pos',
    keys: ['Ctrl', 'Enter'],
    scope: 'pos',
  },
  {
    id: 'pos-search',
    title: 'Focar Busca no PDV',
    description: 'Direciona o cursor para o catálogo de serviços e produtos',
    category: 'pos',
    keys: ['Ctrl', 'F'],
    altKeys: ['F2'],
    scope: 'pos',
  },
  {
    id: 'nav-schedule',
    title: 'Ir para Agenda',
    description: 'Acessa a grade de horários e agendamentos',
    category: 'navigation',
    keys: ['Alt', 'A'],
    altKeys: ['Ctrl', 'Shift', 'A'],
    scope: 'global',
  },
  {
    id: 'nav-clients',
    title: 'Ir para Clientes',
    description: 'Abre a listagem e cadastro de clientes',
    category: 'navigation',
    keys: ['Alt', 'C'],
    altKeys: ['Ctrl', 'Shift', 'C'],
    scope: 'global',
  },
  {
    id: 'nav-finance',
    title: 'Ir para Financeiro',
    description: 'Acessa fluxo de caixa, DRE e contas',
    category: 'navigation',
    keys: ['Alt', 'F'],
    altKeys: ['Ctrl', 'Shift', 'F'],
    scope: 'global',
  },
  {
    id: 'nav-dashboard',
    title: 'Ir para Dashboard',
    description: 'Retorna para o painel principal com métricas',
    category: 'navigation',
    keys: ['Alt', 'D'],
    altKeys: ['Ctrl', 'Shift', 'D'],
    scope: 'global',
  },
  {
    id: 'global-search',
    title: 'Busca Global Rápida',
    description: 'Localiza clientes, serviços, agendamentos e vendas em toda a plataforma',
    category: 'system',
    keys: ['Ctrl', 'K'],
    scope: 'global',
  },
  {
    id: 'shortcuts-help',
    title: 'Guia de Atalhos de Teclado',
    description: 'Exibe esta central com todos os atalhos disponíveis no sistema',
    category: 'system',
    keys: ['Ctrl', '/'],
    altKeys: ['?'],
    scope: 'global',
  },
  {
    id: 'system-escape',
    title: 'Fechar / Voltar',
    description: 'Fecha modais ativos, buscas ou cancela operações em andamento',
    category: 'system',
    keys: ['Esc'],
    scope: 'global',
  },
];

export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isModalOpen, closeModal, toggleModal } = useShortcutsStore();

  useEffect(() => {
    const isTyping = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toUpperCase();
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const modifier = e.ctrlKey || e.metaKey;
      const key = e.key;
      const keyLower = key.toLowerCase();
      const typing = isTyping(e.target);

      // 1. ESCAPE: Close shortcuts modal if open
      if (key === 'Escape') {
        if (isModalOpen) {
          e.preventDefault();
          closeModal();
          return;
        }
      }

      // 2. SHORTCUTS MODAL TOGGLE: Ctrl + / or Cmd + /
      if (modifier && (key === '/' || key === '?')) {
        e.preventDefault();
        toggleModal();
        return;
      }

      // 3. SHORTCUTS MODAL TOGGLE: Plain "?" when not typing in text field
      if (!modifier && !e.altKey && key === '?' && !typing) {
        e.preventDefault();
        toggleModal();
        return;
      }

      // 4. PDV SHORTCUT: Ctrl + P / Cmd + P (Override browser print dialog) or F2
      if ((modifier && keyLower === 'p') || key === 'F2') {
        e.preventDefault();
        if (location.pathname === '/pos') {
          const searchInput = document.getElementById('pos-search-input');
          if (searchInput) {
            searchInput.focus();
            (searchInput as HTMLInputElement).select();
            toast.info('🔍 Caixa pronto: digite para buscar item');
          }
        } else {
          navigate('/pos');
          toast.success('⚡ Frente de Caixa (PDV) aberta');
        }
        return;
      }

      // 5. NOVA VENDA: Ctrl + N / Cmd + N (Override browser new window)
      if (modifier && !e.shiftKey && keyLower === 'n') {
        e.preventDefault();
        if (location.pathname === '/pos') {
          window.dispatchEvent(new CustomEvent('pos-clear-cart'));
          setTimeout(() => {
            const searchInput = document.getElementById('pos-search-input');
            if (searchInput) {
              searchInput.focus();
              (searchInput as HTMLInputElement).select();
            }
          }, 100);
          toast.success('🛒 Nova venda iniciada! Carrinho zerado.');
        } else {
          navigate('/pos?action=new');
          toast.success('🛒 Direcionado para nova venda no PDV.');
        }
        return;
      }

      // 6. NAVEGAÇÃO RÁPIDA VIA ALT ou CTRL+SHIFT (evitar conflito com digitação normal)
      // Alt + A or Ctrl + Shift + A -> Agenda
      if ((e.altKey && keyLower === 'a') || (modifier && e.shiftKey && keyLower === 'a')) {
        e.preventDefault();
        navigate('/schedule');
        toast.info('📅 Agenda de Atendimentos');
        return;
      }

      // Alt + C or Ctrl + Shift + C -> Clientes
      if ((e.altKey && keyLower === 'c') || (modifier && e.shiftKey && keyLower === 'c')) {
        e.preventDefault();
        navigate('/clients');
        toast.info('👥 Base de Clientes');
        return;
      }

      // Alt + F or Ctrl + Shift + F -> Financeiro
      if ((e.altKey && keyLower === 'f') || (modifier && e.shiftKey && keyLower === 'f')) {
        e.preventDefault();
        navigate('/finance');
        toast.info('💰 Fluxo Financeiro');
        return;
      }

      // Alt + D or Ctrl + Shift + D -> Dashboard
      if ((e.altKey && keyLower === 'd') || (modifier && e.shiftKey && keyLower === 'd')) {
        e.preventDefault();
        navigate('/');
        toast.info('📊 Painel Geral');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal, toggleModal, navigate, location.pathname]);
}
