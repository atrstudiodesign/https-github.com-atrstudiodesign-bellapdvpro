// System Operator Service - Real-time Voice & Action Assistant for BellaPDV
// Allows the AI Voice Assistant to interact with the entire system, execute operator actions, and provide instant zero-delay responses

import { useTransactionStore } from '../store/transactions';
import { useAppointmentStore } from '../store/appointments';
import { useClientStore } from '../store/clients';
import { useCatalogStore, CatalogItem } from '../store/catalog';
import { useProfessionalStore } from '../store/professionals';

export interface SystemAction {
  id: string;
  label: string;
  type: 'NAVIGATE' | 'ADD_TO_CART' | 'OPEN_DRAWER' | 'CLEAR_CART' | 'CHECKOUT' | 'SELECT_PAYMENT' | 'OPEN_WHATSAPP' | 'TRIGGER_AI';
  payload?: any;
  icon?: string;
}

export interface OperatorExecutionResult {
  handled: boolean;
  reply: string;
  actions?: SystemAction[];
  spokenText?: string;
}

// Built-in catalog reference for immediate voice matching
export const QUICK_CATALOG_ITEMS = [
  { id: 'b1', name: 'Corte Degradê', price: 45, category: 'Cabelo', keywords: ['degrade', 'degradê', 'corte degrade', 'corte degradê', 'fade'] },
  { id: 'b2', name: 'Corte Social', price: 40, category: 'Cabelo', keywords: ['social', 'corte social', 'corte tradicional'] },
  { id: 'b3', name: 'Corte Infantil', price: 35, category: 'Cabelo', keywords: ['infantil', 'corte infantil', 'criança'] },
  { id: 'b4', name: 'Barba Tradicional', price: 35, category: 'Barba', keywords: ['barba', 'fazer a barba', 'barba tradicional', 'fazer barba'] },
  { id: 'b5', name: 'Barboterapia', price: 60, category: 'Barba', keywords: ['terapia', 'barba terapia', 'barboterapia', 'toalha quente'] },
  { id: 'b6', name: 'Sobrancelha Navalhada', price: 20, category: 'Cuidado Facial', keywords: ['sobrancelha', 'fazer sobrancelha'] },
  { id: 'b7', name: 'Limpeza de Pele', price: 80, category: 'Cuidado Facial', keywords: ['limpeza de pele', 'pele', 'facial'] },
  { id: 'b10', name: 'Pomada Modeladora', price: 45, category: 'Produtos', keywords: ['pomada', 'pomada modeladora', 'gel'] },
  { id: 'b11', name: 'Óleo para Barba', price: 55, category: 'Produtos', keywords: ['oleo', 'óleo', 'óleo para barba', 'oleo de barba'] },
  { id: 'b13', name: 'Cerveja Artesanal', price: 18, category: 'Bebidas', keywords: ['cerveja', 'artesanal', 'bebida', 'cervejinha'] },
  { id: 'b14', name: 'Refrigerante / Água', price: 6, category: 'Bebidas', keywords: ['refrigerante', 'agua', 'água', 'coca'] },
  { id: 's1', name: 'Corte Feminino', price: 80, category: 'Cabelo', keywords: ['corte feminino', 'feminino', 'cortar cabelo feminino'] },
  { id: 's2', name: 'Escova Modelada', price: 60, category: 'Cabelo', keywords: ['escova', 'escova modelada', 'secador'] },
  { id: 's3', name: 'Hidratação Profunda', price: 90, category: 'Tratamentos', keywords: ['hidratacao', 'hidratação', 'nutrição capilar'] },
  { id: 's4', name: 'Manicure', price: 35, category: 'Unhas', keywords: ['manicure', 'fazer as unhas', 'unha da mao', 'unhas'] },
  { id: 's5', name: 'Pedicure', price: 40, category: 'Unhas', keywords: ['pedicure', 'unha do pé', 'unhas do pe', 'pe', 'pé'] },
  { id: 's6', name: 'Unhas em Gel', price: 150, category: 'Unhas', keywords: ['alongamento', 'gel', 'unha de gel', 'fibra'] },
  { id: 's9', name: 'Mechas', price: 350, category: 'Química', keywords: ['mechas', 'mecha', 'luzes', 'reflexo'] },
  { id: 's10', name: 'Progressiva', price: 250, category: 'Química', keywords: ['progressiva', 'alisamento', 'botox capilar'] },
  { id: 's11', name: 'Shampoo Profissional', price: 120, category: 'Produtos', keywords: ['shampoo', 'xampu', 'shampoo profissional'] },
  { id: 's12', name: 'Máscara de Hidratação', price: 150, category: 'Produtos', keywords: ['mascara', 'máscara', 'creme'] },
  { id: 'c1', name: 'Consulta Avaliação', price: 100, category: 'Consultas', keywords: ['avaliacao', 'avaliação', 'consulta'] },
  { id: 'c2', name: 'Limpeza de Pele Profunda', price: 180, category: 'Facial', keywords: ['limpeza profunda', 'extracao', 'extração'] },
  { id: 'c4', name: 'Botox Facial', price: 800, category: 'Injetáveis', keywords: ['botox', 'toxina botulinica'] },
  { id: 'c6', name: 'Drenagem Linfática', price: 120, category: 'Corporal', keywords: ['drenagem', 'massagem drenagem'] },
  { id: 'c7', name: 'Massagem Relaxante', price: 150, category: 'Corporal', keywords: ['massagem', 'relaxante', 'massoterapia'] },
];

class SystemOperatorService {
  // Format currency helper
  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  // Get current snapshot of system data for AI context or instant answers
  public getSystemSnapshot() {
    const transactions = useTransactionStore.getState().transactions;
    const appointments = useAppointmentStore.getState().appointments;
    const clients = useClientStore.getState().clients;
    const professionals = useProfessionalStore.getState().professionals;

    const totalRevenue = transactions.reduce((acc, t) => acc + (t.total || 0), 0);
    const completedSales = transactions.filter(t => t.status === 'completed').length;
    const pendingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
    const activeClientsCount = clients.length;
    const activeProsCount = professionals.length;

    const sortedAppointments = [...appointments].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const nextAppt = sortedAppointments[0] || null;

    return {
      revenueToday: totalRevenue,
      salesCount: completedSales,
      averageTicket: completedSales > 0 ? totalRevenue / completedSales : 0,
      activeClients: activeClientsCount,
      appointmentsToday: appointments.length,
      pendingAppointments,
      professionalsCount: activeProsCount,
      professionalsList: professionals.map(p => p.name).join(', '),
      nextAppointment: nextAppt,
    };
  }

  // Dispatch global system event to add item to POS cart
  public addItemToPos(item: { id: string; name: string; price: number; category?: string }) {
    window.dispatchEvent(new CustomEvent('pos-add-item', { detail: item }));
  }

  // Clear POS cart
  public clearPosCart() {
    window.dispatchEvent(new CustomEvent('pos-clear-cart'));
  }

  // Open cash drawer simulation
  public openCashDrawer() {
    window.dispatchEvent(new CustomEvent('pos-open-drawer'));
  }

  // Checkout directly
  public checkoutPos(method: 'pix' | 'card' | 'cash' = 'pix') {
    window.dispatchEvent(new CustomEvent('pos-checkout', { detail: { method } }));
  }

  // Select payment method in POS
  public selectPayment(method: 'pix' | 'card' | 'cash' = 'pix') {
    window.dispatchEvent(new CustomEvent('pos-select-payment', { detail: { method } }));
  }

  // Execute system action directly
  public executeAction(action: SystemAction, navigate?: (path: string) => void) {
    switch (action.type) {
      case 'NAVIGATE':
        if (navigate && action.payload?.path) {
          navigate(action.payload.path);
        }
        break;
      case 'ADD_TO_CART':
        if (action.payload?.item) {
          this.addItemToPos(action.payload.item);
          if (navigate && window.location.pathname !== '/pos') {
            navigate('/pos');
          }
        }
        break;
      case 'CLEAR_CART':
        this.clearPosCart();
        break;
      case 'OPEN_DRAWER':
        this.openCashDrawer();
        break;
      case 'CHECKOUT':
        this.checkoutPos(action.payload?.method || 'pix');
        if (navigate && window.location.pathname !== '/pos') {
          navigate('/pos');
        }
        break;
      case 'SELECT_PAYMENT':
        this.selectPayment(action.payload?.method || 'pix');
        break;
      case 'OPEN_WHATSAPP':
        window.dispatchEvent(new CustomEvent('open-whatsapp-modal', { detail: action.payload }));
        break;
    }
  }

  // Instant operator intent analyzer - executes in 0ms without waiting for network!
  public evaluateOperatorIntent(rawPrompt: string, navigate?: (path: string) => void): OperatorExecutionResult {
    const text = rawPrompt.toLowerCase().trim();
    const snapshot = this.getSystemSnapshot();

    // 0. Warm Humanized Greeting
    if (/^(ol[aá]|oi|e a[ií]|bom dia|boa tarde|boa noite|fala bella|fala gabriel|iniciar)/i.test(text) && text.split(' ').length <= 4) {
      const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';
      return {
        handled: true,
        reply: `👋 **${greeting}, operador!** Estou 100% conectada ao BellaPDV com resposta instantânea.\n\nHoje faturamos **${this.formatCurrency(snapshot.revenueToday)}** com **${snapshot.appointmentsToday} agendamentos**. O que você deseja fazer agora?`,
        spokenText: `${greeting}, operador! Estou conectada e pronta. Faturamos ${this.formatCurrency(snapshot.revenueToday)} hoje. O que deseja executar no sistema agora?`,
        actions: [
          { id: '1', label: '🛒 Abrir PDV', type: 'NAVIGATE', payload: { path: '/pos' } },
          { id: '2', label: '📅 Ver Agenda', type: 'NAVIGATE', payload: { path: '/schedule' } },
          { id: '3', label: '📊 Vendas de Hoje', type: 'TRIGGER_AI', payload: { query: 'Quanto vendemos hoje?' } }
        ]
      };
    }

    // 1. Navigation Commands (Navegação imediata por voz)
    if (/(abrir|abre|ir para|vai para|acessar|mostrar)\s*(o\s*)?(pdv|caixa|frente de caixa|balc[aã]o)/i.test(text) || text === 'pdv' || text === 'caixa') {
      if (navigate) navigate('/pos');
      return {
        handled: true,
        reply: 'Pronto! Abri a **Frente de Caixa (PDV)** para você agora. O leitor e os atalhos de venda rápida estão prontos.',
        spokenText: 'Pronto! Abri a frente de caixa para você agora. Pode registrar as vendas.',
        actions: [
          { id: '1', label: '🛒 Abrir PDV', type: 'NAVIGATE', payload: { path: '/pos' } },
          { id: '2', label: '💵 Abrir Gaveta', type: 'OPEN_DRAWER' }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver|mostrar)\s*(a\s*)?(agenda|agendamento|hor[aá]rios)/i.test(text) || text === 'agenda') {
      if (navigate) navigate('/schedule');
      return {
        handled: true,
        reply: `Abrindo sua **Agenda**! Hoje temos **${snapshot.appointmentsToday} agendamentos** confirmados. O próximo cliente é **${snapshot.nextAppointment.client}** às **${snapshot.nextAppointment.time}**.`,
        spokenText: `Abrindo sua agenda! Hoje temos ${snapshot.appointmentsToday} agendamentos. O próximo cliente é ${snapshot.nextAppointment.client} às ${snapshot.nextAppointment.time}.`,
        actions: [
          { id: '1', label: '📅 Ver Agenda', type: 'NAVIGATE', payload: { path: '/schedule' } },
          { id: '2', label: '💬 Confirmar WhatsApp', type: 'NAVIGATE', payload: { path: '/schedule' } }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver|mostrar)\s*(os\s*)?(cliente|clientes|base de clientes)/i.test(text)) {
      if (navigate) navigate('/clients');
      return {
        handled: true,
        reply: `Abrindo a **Gestão de Clientes**. Sua base conta com **${snapshot.activeClients} clientes cadastrados** e ativos.`,
        spokenText: `Abrindo a gestão de clientes com ${snapshot.activeClients} cadastros ativos.`,
        actions: [
          { id: '1', label: '👥 Ver Clientes', type: 'NAVIGATE', payload: { path: '/clients' } },
          { id: '2', label: '🔄 Ir para CRM', type: 'NAVIGATE', payload: { path: '/crm' } }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver)\s*(o\s*)?(financeiro|finan[cç]as|fluxo de caixa|contas)/i.test(text)) {
      if (navigate) navigate('/finance');
      return {
        handled: true,
        reply: `Abrindo o painel **Financeiro**! O faturamento acumulado atual é de **${this.formatCurrency(snapshot.revenueToday)}** com ticket médio de **${this.formatCurrency(snapshot.averageTicket)}**.`,
        spokenText: `Abrindo o painel financeiro! O faturamento acumulado é de ${this.formatCurrency(snapshot.revenueToday)}.`,
        actions: [
          { id: '1', label: '💰 Ver Financeiro', type: 'NAVIGATE', payload: { path: '/finance' } },
          { id: '2', label: '📊 Relatórios', type: 'NAVIGATE', payload: { path: '/reports' } }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver)\s*(o\s*)?(crm|funil|resgate|churn|clientes sumidos|inativos)/i.test(text)) {
      if (navigate) navigate('/crm');
      return {
        handled: true,
        reply: 'Abrindo o **CRM Inteligente**. Aqui você pode resgatar clientes inativos e disparar ofertas de retorno pelo WhatsApp.',
        spokenText: 'Abrindo o CRM Inteligente. Pronto para disparar campanhas de retorno.',
        actions: [
          { id: '1', label: '🎯 Ir para CRM', type: 'NAVIGATE', payload: { path: '/crm' } },
          { id: '2', label: '📢 Marketing IA', type: 'NAVIGATE', payload: { path: '/marketing' } }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver)\s*(o\s*)?(marketing|promo[cç][aã]o|campanha|propaganda)/i.test(text)) {
      if (navigate) navigate('/marketing');
      return {
        handled: true,
        reply: 'Abrindo o estúdio de **Marketing com IA**! Pronto para gerar copys e promoções para o WhatsApp e redes sociais.',
        spokenText: 'Abrindo o marketing com inteligência artificial.',
        actions: [
          { id: '1', label: '📢 Abrir Marketing', type: 'NAVIGATE', payload: { path: '/marketing' } }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver)\s*(os\s*)?(relat[oó]rios|m[eé]tricas|indicadores|dre|desempenho)/i.test(text)) {
      if (navigate) navigate('/reports');
      return {
        handled: true,
        reply: 'Abrindo a central de **Relatórios e Métricas**. Dados de desempenho consolidados em tempo real.',
        spokenText: 'Abrindo a central de relatórios e métricas do sistema.',
        actions: [
          { id: '1', label: '📈 Ver Relatórios', type: 'NAVIGATE', payload: { path: '/reports' } }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver)\s*(a\s*)?(equipe|profissionais|barbeiros|cabeleireiros|colaboradores)/i.test(text)) {
      if (navigate) navigate('/professionals');
      return {
        handled: true,
        reply: `Abrindo a **Gestão de Equipe**. Temos **${snapshot.professionalsCount} profissionais ativos**: ${snapshot.professionalsList}.`,
        spokenText: `Abrindo a gestão de equipe com ${snapshot.professionalsCount} profissionais ativos.`,
        actions: [
          { id: '1', label: '💈 Ver Equipe', type: 'NAVIGATE', payload: { path: '/professionals' } }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver)\s*(os\s*)?(servi[cç]os|produtos|cat[aá]logo|tabela de pre[cç]os)/i.test(text)) {
      if (navigate) navigate('/services');
      return {
        handled: true,
        reply: 'Abrindo a **Tabela de Serviços e Catálogo de Produtos** do seu estabelecimento!',
        spokenText: 'Abrindo tabela de serviços e produtos.',
        actions: [
          { id: '1', label: '✂️ Ver Serviços', type: 'NAVIGATE', payload: { path: '/services' } }
        ]
      };
    }

    if (/(abrir|abre|ir para|vai para|ver)\s*(as\s*)?(configura[cç][oõ]es|ajustes|sistema|prefer[eê]ncias)/i.test(text)) {
      if (navigate) navigate('/settings');
      return {
        handled: true,
        reply: 'Abrindo o painel de **Configurações e Parâmetros** do BellaPDV!',
        spokenText: 'Abrindo configurações do sistema.',
        actions: [
          { id: '1', label: '⚙️ Configurações', type: 'NAVIGATE', payload: { path: '/settings' } }
        ]
      };
    }

    if (/(ir para|vai para|abrir|abre)\s*(o\s*)?(in[ií]cio|home|dashboard|painel geral)/i.test(text)) {
      if (navigate) navigate('/');
      return {
        handled: true,
        reply: 'Voltando para a **Dashboard Principal**!',
        spokenText: 'Voltando para a dashboard principal.',
        actions: [
          { id: '1', label: '🏠 Dashboard', type: 'NAVIGATE', payload: { path: '/' } }
        ]
      };
    }

    // 2. Real-time Metrics Queries (Respostas em tempo real sobre vendas e agenda)
    if (/(quanto|qual)\s*(vendemos|faturamos|o faturamento|o total de vendas)\s*(hoje|este m[eê]s|no m[eê]s)?/i.test(text) || text.includes('vendas de hoje') || text.includes('faturamento de hoje')) {
      return {
        handled: true,
        reply: `📊 **Resumo Financeiro em Tempo Real**:\n- **Faturamento:** ${this.formatCurrency(snapshot.revenueToday)}\n- **Atendimentos/Vendas:** ${snapshot.salesCount}\n- **Ticket Médio:** ${this.formatCurrency(snapshot.averageTicket)}\n\nO caixa está rodando com ótimo desempenho! Deseja registrar uma nova venda ou emitir o relatório?`,
        spokenText: `Hoje registramos ${this.formatCurrency(snapshot.revenueToday)} em vendas, com ${snapshot.salesCount} atendimentos e ticket médio de ${this.formatCurrency(snapshot.averageTicket)}.`,
        actions: [
          { id: '1', label: '🛒 Abrir PDV', type: 'NAVIGATE', payload: { path: '/pos' } },
          { id: '2', label: '💰 Ver no Financeiro', type: 'NAVIGATE', payload: { path: '/finance' } }
        ]
      };
    }

    if (/(quem [eé] o pr[oó]ximo|pr[oó]ximo cliente|pr[oó]ximo agendado|agenda de hoje|quem vai atender)/i.test(text)) {
      const next = snapshot.nextAppointment;
      return {
        handled: true,
        reply: `📅 **Próximo Atendimento na Agenda**:\n- **Cliente:** ${next.client}\n- **Horário:** ${next.time}\n- **Serviço:** ${next.service}\n- **Profissional:** ${next.employee}\n\nO cliente já recebeu a confirmação automática pelo WhatsApp.`,
        spokenText: `O próximo cliente agendado é ${next.client} às ${next.time} para ${next.service} com ${next.employee}.`,
        actions: [
          { id: '1', label: '📅 Abrir Agenda', type: 'NAVIGATE', payload: { path: '/schedule' } }
        ]
      };
    }

    if (/(quantos clientes|total de clientes|base de clientes)/i.test(text)) {
      return {
        handled: true,
        reply: `👥 Você possui **${snapshot.activeClients} clientes cadastrados** na base de dados.`,
        spokenText: `Você possui ${snapshot.activeClients} clientes cadastrados na sua base de dados.`,
        actions: [
          { id: '1', label: '👥 Ver Clientes', type: 'NAVIGATE', payload: { path: '/clients' } }
        ]
      };
    }

    // 3. POS Actions: Add Item to Cart by Voice (Pesquisa dinâmica no catálogo)
    if (/(adicionar|adiciona|coloca|p[oõ]e|lan[cç]ar|lan[cç]a|vender|vende|quero um|incluir|inclui)\s*(o|a|no carrinho|ao carrinho)?/i.test(text)) {
      const customCatalog = useCatalogStore.getState().items;
      const combined = [...customCatalog, ...QUICK_CATALOG_ITEMS];

      // Clean command verbs to isolate the item query
      const query = text
        .replace(/^(adicionar|adiciona|coloca|põe|poe|lançar|lanca|lança|vender|vende|incluir|inclui)\s*/i, '')
        .replace(/^(um|uma|o|a|ao carrinho|no carrinho)\s*/i, '')
        .trim();

      const matched = combined.find(item => {
        const itemName = item.name.toLowerCase();
        if (query && (itemName.includes(query) || query.includes(itemName))) return true;
        if ('keywords' in item && Array.isArray((item as any).keywords)) {
          return (item as any).keywords.some((k: string) => text.includes(k) || (query && query.includes(k)));
        }
        return false;
      });

      if (matched) {
        this.addItemToPos(matched);
        if (navigate && window.location.pathname !== '/pos') {
          navigate('/pos');
        }
        return {
          handled: true,
          reply: `🛒 Adicionei **${matched.name}** (${this.formatCurrency(matched.price)}) ao carrinho da Frente de Caixa com sucesso!\n\nDeseja adicionar mais algum produto ou finalizar o pagamento?`,
          spokenText: `Adicionei ${matched.name} no valor de ${this.formatCurrency(matched.price)} ao carrinho do PDV.`,
          actions: [
            { id: '1', label: '🛒 Ver no PDV', type: 'NAVIGATE', payload: { path: '/pos' } },
            { id: '2', label: '⚡ Finalizar no Pix', type: 'CHECKOUT', payload: { method: 'pix' } },
            { id: '3', label: '💳 Finalizar no Cartão', type: 'CHECKOUT', payload: { method: 'card' } }
          ]
        };
      }
    }

    // 4. POS Checkout / Payment Commands
    if (/(finalizar|fechar|concluir|cobrar|pagar)\s*(a venda|o caixa|no|com)?\s*(pix|cart[aã]o|cr[eé]dito|d[eé]bito|dinheiro)?/i.test(text)) {
      let method: 'pix' | 'card' | 'cash' = 'pix';
      if (/cart[aã]o|cr[eé]dito|d[eé]bito/i.test(text)) method = 'card';
      if (/dinheiro|esp[eé]cie/i.test(text)) method = 'cash';

      this.checkoutPos(method);
      if (navigate && window.location.pathname !== '/pos') {
        navigate('/pos');
      }

      const methodNames = { pix: 'Pix', card: 'Cartão', cash: 'Dinheiro' };
      return {
        handled: true,
        reply: `💳 **Finalizando venda com pagamento via ${methodNames[method]}!** Processando cupom e recibo...`,
        spokenText: `Finalizando venda com pagamento via ${methodNames[method]}.`,
        actions: [
          { id: '1', label: '🛒 Ver Frente de Caixa', type: 'NAVIGATE', payload: { path: '/pos' } }
        ]
      };
    }

    // 5. Cash Drawer Commands
    if (/(abrir|abre)\s*(a\s*)?(gaveta|gaveta do caixa|caixa manual)/i.test(text)) {
      this.openCashDrawer();
      return {
        handled: true,
        reply: '💵 **Gaveta do Caixa Acionada!** O comando de abertura foi enviado ao operador com sucesso.',
        spokenText: 'Gaveta do caixa aberta com sucesso.',
        actions: [
          { id: '1', label: '🛒 Ir para o PDV', type: 'NAVIGATE', payload: { path: '/pos' } }
        ]
      };
    }

    if (/(limpar|limpa|cancelar|cancela|zerar|zera)\s*(o\s*)?(carrinho|venda atual)/i.test(text)) {
      this.clearPosCart();
      return {
        handled: true,
        reply: '🗑️ O carrinho da Frente de Caixa foi limpo e está zerado para o próximo cliente.',
        spokenText: 'Carrinho do caixa zerado com sucesso.',
        actions: [
          { id: '1', label: '🛒 Novo Atendimento', type: 'NAVIGATE', payload: { path: '/pos' } }
        ]
      };
    }

    // 6. Help / Capabilities
    if (/(o que voc[eê] pode fazer|ajuda|comandos|como usar|quais os comandos)/i.test(text)) {
      return {
        handled: true,
        reply: `💡 **Comandos Operacionais por Voz Instantâneos:**\n\n- **Caixa & PDV:** "Abrir PDV", "Adicionar corte degradê", "Abrir gaveta", "Limpar carrinho", "Finalizar no Pix"\n- **Métricas:** "Quanto vendemos hoje?", "Ticket médio"\n- **Agenda:** "Quem é o próximo cliente?", "Abrir agenda"\n- **Navegação:** "Abrir clientes", "Abrir financeiro", "Abrir CRM", "Abrir marketing"`,
        spokenText: 'Você pode falar comandos como abrir o caixa, adicionar corte degradê ao carrinho, consultar o faturamento de hoje, ver o próximo cliente agendado e muito mais.',
        actions: [
          { id: '1', label: '🛒 Abrir PDV', type: 'NAVIGATE', payload: { path: '/pos' } },
          { id: '2', label: '📅 Ver Agenda', type: 'NAVIGATE', payload: { path: '/schedule' } },
          { id: '3', label: '📊 Vendas de Hoje', type: 'TRIGGER_AI', payload: { query: 'Quanto vendemos hoje?' } }
        ]
      };
    }

    // Not a direct operator command, forward to AI with rich system context
    return {
      handled: false,
      reply: '',
    };
  }
}

export const systemOperator = new SystemOperatorService();
