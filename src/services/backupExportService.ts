import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useClientStore, Client } from '../store/clients';
import { useCatalogStore, CatalogItem } from '../store/catalog';
import { useTransactionStore, Transaction } from '../store/transactions';
import { useAppointmentStore, Appointment } from '../store/appointments';
import JSZip from 'jszip';

export interface BackupDataResult {
  clients: Client[];
  catalog: CatalogItem[];
  transactions: Transaction[];
  appointments: Appointment[];
  meta: {
    appName: string;
    exportDate: string;
    exportDateFormatted: string;
    version: string;
    userEmail: string;
    userId: string;
    source: 'firestore' | 'local_store' | 'mixed';
    totalRecords: {
      clients: number;
      catalog: number;
      transactions: number;
      appointments: number;
      total: number;
    };
  };
}

/**
 * Busca todos os dados do Firestore pertencentes ao usuário logado,
 * com fallback inteligente para os stores locais (Zustand) se não houver dados no Firestore ou se estiver offline.
 */
export async function fetchAllUserDataForBackup(): Promise<BackupDataResult> {
  const currentUser = auth.currentUser;
  const uid = currentUser?.uid;

  let clients: Client[] = [];
  let catalog: CatalogItem[] = [];
  let transactions: Transaction[] = [];
  let appointments: Appointment[] = [];
  let source: 'firestore' | 'local_store' | 'mixed' = 'local_store';

  if (uid) {
    try {
      // 1. Clientes
      const clientsQuery = query(collection(db, 'clients'), where('ownerId', '==', uid));
      const clientsSnap = await getDocs(clientsQuery);
      if (!clientsSnap.empty) {
        clients = clientsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Client));
        source = 'firestore';
      }

      // 2. Catálogo (Serviços / Produtos)
      const catalogQuery = query(collection(db, 'catalog'), where('ownerId', '==', uid));
      const catalogSnap = await getDocs(catalogQuery);
      if (!catalogSnap.empty) {
        catalog = catalogSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CatalogItem));
      }

      // 3. Transações Financeiras
      const transQuery = query(collection(db, 'transactions'), where('ownerId', '==', uid));
      const transSnap = await getDocs(transQuery);
      if (!transSnap.empty) {
        transactions = transSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
      }

      // 4. Agendamentos
      const appQuery = query(collection(db, 'appointments'), where('ownerId', '==', uid));
      const appSnap = await getDocs(appQuery);
      if (!appSnap.empty) {
        appointments = appSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
      }
    } catch (e) {
      console.warn('Falha na consulta ao Firestore, usando dados locais em cache:', e);
    }
  }

  // Fallback para os dados locais caso o Firestore esteja vazio ou sem conexão
  const storeClients = useClientStore.getState().clients;
  const storeCatalog = useCatalogStore.getState().items;
  const storeTransactions = useTransactionStore.getState().transactions;
  const storeAppointments = useAppointmentStore.getState().appointments;

  if (clients.length === 0 && storeClients.length > 0) {
    clients = storeClients;
    if (source === 'firestore') source = 'mixed';
  }
  if (catalog.length === 0 && storeCatalog.length > 0) {
    catalog = storeCatalog;
    if (source === 'firestore') source = 'mixed';
  }
  if (transactions.length === 0 && storeTransactions.length > 0) {
    transactions = storeTransactions;
    if (source === 'firestore') source = 'mixed';
  }
  if (appointments.length === 0 && storeAppointments.length > 0) {
    appointments = storeAppointments;
    if (source === 'firestore') source = 'mixed';
  }

  const now = new Date();
  const exportDateFormatted = now.toLocaleString('pt-BR');

  const meta = {
    appName: 'Bella PDV - Sistema ERP & PDV Inteligente',
    exportDate: now.toISOString(),
    exportDateFormatted,
    version: '1.0.0',
    userEmail: currentUser?.email || 'demo@bellapdv.com',
    userId: uid || 'local_user',
    source,
    totalRecords: {
      clients: clients.length,
      catalog: catalog.length,
      transactions: transactions.length,
      appointments: appointments.length,
      total: clients.length + catalog.length + transactions.length + appointments.length,
    },
  };

  return {
    clients,
    catalog,
    transactions,
    appointments,
    meta,
  };
}

/**
 * Converte array de objetos em string CSV com delimitador ';' e BOM UTF-8 (\uFEFF)
 * para perfeita abertura no Excel (Windows/Mac) sem truncar caracteres acentuados.
 */
export function generateCsvString(
  rows: Record<string, any>[],
  headers: { key: string; label: string }[]
): string {
  const headerRow = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(';');

  const dataRows = rows.map((row) =>
    headers
      .map((h) => {
        let val = row[h.key];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'number') {
          // Formata decimais com vírgula para Excel em português
          val = val.toString().replace('.', ',');
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        }
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(';')
  );

  return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
}

/**
 * Dispara o download de um arquivo no navegador do cliente.
 */
export function triggerFileDownload(content: Blob | string, filename: string, mimeType: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// EXPORTADORES ESPECÍFICOS (JSON & CSVs)
// ----------------------------------------------------

export function exportBackupAsJson(data: BackupDataResult) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `backup_completo_bella_pdv_${dateStr}.json`;
  const jsonStr = JSON.stringify(data, null, 2);
  triggerFileDownload(jsonStr, filename, 'application/json;charset=utf-8;');
  saveLastBackupDate();
}

export function exportClientsCsv(clients: Client[]) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `clientes_backup_${dateStr}.csv`;

  const headers = [
    { key: 'id', label: 'ID Cliente' },
    { key: 'name', label: 'Nome Completo' },
    { key: 'phone', label: 'Telefone / WhatsApp' },
    { key: 'email', label: 'E-mail' },
    { key: 'location', label: 'Cidade / Local' },
    { key: 'classification', label: 'Classificação' },
    { key: 'totalSpent', label: 'Total Gasto (R$)' },
    { key: 'avgTicket', label: 'Ticket Médio (R$)' },
    { key: 'lastVisit', label: 'Última Visita' },
    { key: 'lastService', label: 'Último Serviço' },
    { key: 'lastProfessional', label: 'Profissional Atendente' },
    { key: 'status', label: 'Status' },
    { key: 'tagsStr', label: 'Tags' },
    { key: 'aiScore', label: 'Score IA' },
  ];

  const rows = clients.map((c) => ({
    ...c,
    tagsStr: (c.tags || []).join(', '),
  }));

  const csvContent = generateCsvString(rows, headers);
  triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');
  saveLastBackupDate();
}

export function exportCatalogCsv(catalog: CatalogItem[]) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `servicos_produtos_catalogo_${dateStr}.csv`;

  const headers = [
    { key: 'id', label: 'Código do Item' },
    { key: 'name', label: 'Nome do Serviço / Produto' },
    { key: 'category', label: 'Categoria' },
    { key: 'typeLabel', label: 'Tipo' },
    { key: 'price', label: 'Preço (R$)' },
    { key: 'duration', label: 'Duração' },
    { key: 'stock', label: 'Estoque' },
  ];

  const rows = catalog.map((item) => ({
    ...item,
    typeLabel: item.type === 'service' ? 'Serviço' : 'Produto',
  }));

  const csvContent = generateCsvString(rows, headers);
  triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');
  saveLastBackupDate();
}

export function exportTransactionsCsv(transactions: Transaction[]) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `financeiro_vendas_${dateStr}.csv`;

  const headers = [
    { key: 'id', label: 'ID da Transação' },
    { key: 'dateFormatted', label: 'Data / Hora' },
    { key: 'total', label: 'Valor Total (R$)' },
    { key: 'paymentMethodLabel', label: 'Forma de Pagamento' },
    { key: 'statusLabel', label: 'Status da Venda' },
    { key: 'itemsCount', label: 'Qtd de Itens' },
    { key: 'itemsSummary', label: 'Itens Vendidos' },
  ];

  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    card: 'Cartão',
    cash: 'Dinheiro',
    split: 'Múltiplos / Dividido',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Concluída',
    pending: 'Pendente',
    cancelled: 'Cancelada',
  };

  const rows = transactions.map((t) => {
    let dateFormatted = t.date;
    try {
      dateFormatted = new Date(t.date).toLocaleString('pt-BR');
    } catch {
      // keep original
    }

    const itemsSummary = (t.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', ');

    return {
      id: t.id,
      dateFormatted,
      total: t.total,
      paymentMethodLabel: paymentLabels[t.paymentMethod] || t.paymentMethod,
      statusLabel: statusLabels[t.status] || t.status,
      itemsCount: (t.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0),
      itemsSummary,
    };
  });

  const csvContent = generateCsvString(rows, headers);
  triggerFileDownload(csvContent, filename, 'text/csv;charset=utf-8;');
  saveLastBackupDate();
}

/**
 * Gera um pacote comprimido ZIP contendo:
 * - backup_completo.json
 * - clientes.csv
 * - servicos_produtos.csv
 * - financeiro_vendas.csv
 * - agendamentos.csv
 * - LEIA-ME-BACKUP.txt
 */
export async function exportAllInZipPackage(data: BackupDataResult) {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. JSON Completo
  zip.file(`backup_completo_${dateStr}.json`, JSON.stringify(data, null, 2));

  // 2. CSV Clientes
  const clientsCsv = generateCsvString(
    data.clients.map((c) => ({ ...c, tagsStr: (c.tags || []).join(', ') })),
    [
      { key: 'id', label: 'ID Cliente' },
      { key: 'name', label: 'Nome Completo' },
      { key: 'phone', label: 'Telefone / WhatsApp' },
      { key: 'email', label: 'E-mail' },
      { key: 'location', label: 'Cidade / Local' },
      { key: 'classification', label: 'Classificação' },
      { key: 'totalSpent', label: 'Total Gasto (R$)' },
      { key: 'avgTicket', label: 'Ticket Médio (R$)' },
      { key: 'lastVisit', label: 'Última Visita' },
      { key: 'lastService', label: 'Último Serviço' },
      { key: 'lastProfessional', label: 'Profissional Atendente' },
      { key: 'status', label: 'Status' },
      { key: 'tagsStr', label: 'Tags' },
      { key: 'aiScore', label: 'Score IA' },
    ]
  );
  zip.file(`clientes_${dateStr}.csv`, clientsCsv);

  // 3. CSV Serviços
  const catalogCsv = generateCsvString(
    data.catalog.map((i) => ({ ...i, typeLabel: i.type === 'service' ? 'Serviço' : 'Produto' })),
    [
      { key: 'id', label: 'Código do Item' },
      { key: 'name', label: 'Nome do Serviço / Produto' },
      { key: 'category', label: 'Categoria' },
      { key: 'typeLabel', label: 'Tipo' },
      { key: 'price', label: 'Preço (R$)' },
      { key: 'duration', label: 'Duração' },
      { key: 'stock', label: 'Estoque' },
    ]
  );
  zip.file(`servicos_produtos_${dateStr}.csv`, catalogCsv);

  // 4. CSV Financeiro
  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    card: 'Cartão',
    cash: 'Dinheiro',
    split: 'Múltiplos / Dividido',
  };
  const statusLabels: Record<string, string> = {
    completed: 'Concluída',
    pending: 'Pendente',
    cancelled: 'Cancelada',
  };

  const transactionsCsv = generateCsvString(
    data.transactions.map((t) => ({
      id: t.id,
      dateFormatted: t.date,
      total: t.total,
      paymentMethodLabel: paymentLabels[t.paymentMethod] || t.paymentMethod,
      statusLabel: statusLabels[t.status] || t.status,
      itemsCount: (t.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0),
      itemsSummary: (t.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', '),
    })),
    [
      { key: 'id', label: 'ID da Transação' },
      { key: 'dateFormatted', label: 'Data / Hora' },
      { key: 'total', label: 'Valor Total (R$)' },
      { key: 'paymentMethodLabel', label: 'Forma de Pagamento' },
      { key: 'statusLabel', label: 'Status da Venda' },
      { key: 'itemsCount', label: 'Qtd de Itens' },
      { key: 'itemsSummary', label: 'Itens Vendidos' },
    ]
  );
  zip.file(`financeiro_vendas_${dateStr}.csv`, transactionsCsv);

  // 5. CSV Agendamentos
  const appointmentsCsv = generateCsvString(data.appointments, [
    { key: 'id', label: 'ID Agendamento' },
    { key: 'client', label: 'Cliente' },
    { key: 'clientPhone', label: 'Telefone' },
    { key: 'service', label: 'Serviço' },
    { key: 'employee', label: 'Profissional' },
    { key: 'date', label: 'Data' },
    { key: 'time', label: 'Horário' },
    { key: 'status', label: 'Status' },
  ]);
  zip.file(`agendamentos_${dateStr}.csv`, appointmentsCsv);

  // 6. LEIA-ME
  const readme = `======================================================
BELLA PDV - PACOTE DE BACKUP E EXPORTAÇÃO
======================================================
Data do Backup: ${data.meta.exportDateFormatted}
Origem dos Dados: ${data.meta.source === 'firestore' ? 'Nuvem Google Firestore (Produção)' : 'Memória Local / Sincronizada'}
Conta de Usuário: ${data.meta.userEmail}

TOTAL DE REGISTROS:
- Clientes Cadastrados: ${data.meta.totalRecords.clients}
- Serviços e Produtos no Catálogo: ${data.meta.totalRecords.catalog}
- Vendas e Transações Financeiras: ${data.meta.totalRecords.transactions}
- Agendamentos: ${data.meta.totalRecords.appointments}
TOTAL GERAL: ${data.meta.totalRecords.total} registros

ARQUIVOS INCLUÍDOS:
1. backup_completo_${dateStr}.json: Estrutura completa de dados para restauração e migração.
2. clientes_${dateStr}.csv: Planilha com dados completos de clientes compatível com Excel e Google Planilhas.
3. servicos_produtos_${dateStr}.csv: Planilha com catálogo de preços e estoque.
4. financeiro_vendas_${dateStr}.csv: Planilha do fluxo financeiro e registros de caixa.
5. agendamentos_${dateStr}.csv: Planilha com agenda de atendimentos.

Dica: Os arquivos CSV foram codificados com UTF-8 BOM e delimitador ';', perfeitos para abrir diretamente no Microsoft Excel sem desconfigurar acentuações.
`;
  zip.file('LEIA-ME-BACKUP.txt', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(blob, `BellaPDV_Backup_Completo_${dateStr}.zip`, 'application/zip');
  saveLastBackupDate();
}

function saveLastBackupDate() {
  try {
    localStorage.setItem('bella_last_backup_timestamp', new Date().toISOString());
  } catch (e) {
    console.error('Erro ao salvar timestamp do backup:', e);
  }
}

export function getLastBackupDateFormatted(): string | null {
  try {
    const raw = localStorage.getItem('bella_last_backup_timestamp');
    if (!raw) return null;
    const d = new Date(raw);
    return d.toLocaleString('pt-BR');
  } catch {
    return null;
  }
}
