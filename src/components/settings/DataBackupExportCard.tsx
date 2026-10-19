import React, { useState, useEffect } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  FileCode, 
  Archive, 
  Download, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Eye, 
  X, 
  Users, 
  Briefcase, 
  DollarSign, 
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  fetchAllUserDataForBackup,
  exportBackupAsJson,
  exportClientsCsv,
  exportCatalogCsv,
  exportTransactionsCsv,
  exportAllInZipPackage,
  getLastBackupDateFormatted,
  BackupDataResult,
} from '../../services/backupExportService';
import { useClientStore } from '../../store/clients';
import { useCatalogStore } from '../../store/catalog';
import { useTransactionStore } from '../../store/transactions';

export const DataBackupExportCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [cachedData, setCachedData] = useState<BackupDataResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'clients' | 'catalog' | 'transactions'>('clients');

  // Stores locais para contagem rápida instantânea
  const localClients = useClientStore((state) => state.clients);
  const localCatalog = useCatalogStore((state) => state.items);
  const localTransactions = useTransactionStore((state) => state.transactions);

  useEffect(() => {
    setLastBackup(getLastBackupDateFormatted());
  }, []);

  const totalMovimentado = localTransactions.reduce((acc, t) => acc + (t.total || 0), 0);

  const loadData = async (): Promise<BackupDataResult> => {
    if (cachedData) return cachedData;
    setIsLoading(true);
    try {
      const data = await fetchAllUserDataForBackup();
      setCachedData(data);
      return data;
    } catch (e) {
      console.error('Erro ao coletar dados para backup:', e);
      toast.error('Erro ao conectar ao banco de dados');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJson = async () => {
    setIsLoading(true);
    try {
      const data = await loadData();
      exportBackupAsJson(data);
      setLastBackup(getLastBackupDateFormatted());
      toast.success('Backup em JSON baixado!', {
        description: `${data.meta.totalRecords.total} registros exportados com sucesso.`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportClientsCsv = async () => {
    setIsLoading(true);
    try {
      const data = await loadData();
      exportClientsCsv(data.clients);
      setLastBackup(getLastBackupDateFormatted());
      toast.success('Planilha de Clientes baixada!', {
        description: `${data.clients.length} clientes exportados em CSV para Excel.`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCatalogCsv = async () => {
    setIsLoading(true);
    try {
      const data = await loadData();
      exportCatalogCsv(data.catalog);
      setLastBackup(getLastBackupDateFormatted());
      toast.success('Planilha de Serviços baixada!', {
        description: `${data.catalog.length} itens do catálogo exportados em CSV.`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTransactionsCsv = async () => {
    setIsLoading(true);
    try {
      const data = await loadData();
      exportTransactionsCsv(data.transactions);
      setLastBackup(getLastBackupDateFormatted());
      toast.success('Planilha Financeira baixada!', {
        description: `${data.transactions.length} vendas e transações exportadas em CSV.`,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportZip = async () => {
    setIsLoading(true);
    try {
      const data = await loadData();
      await exportAllInZipPackage(data);
      setLastBackup(getLastBackupDateFormatted());
      toast.success('Pacote Completo (.ZIP) baixado!', {
        description: 'Todos os arquivos JSON e planilhas CSV consolidados com sucesso.',
      });
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar arquivo compactado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPreview = async () => {
    try {
      await loadData();
      setIsPreviewOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="glass-card p-0 border border-amber-500/30 overflow-hidden shadow-[0_0_35px_rgba(245,158,11,0.08)]">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-[#1A160C] via-[#0C1627] to-[#0D182E] p-6 border-b border-[#1A2C47] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">Backup e Exportação de Dados (Firestore)</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Nuvem Conectada
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Faça o download de todos os seus dados cadastrados (Clientes, Serviços e Financeiro) diretamente do Firestore para um backup local em JSON ou CSV.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleOpenPreview}
              disabled={isLoading}
              className="py-2.5 px-3.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              title="Visualizar dados antes de baixar"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Pré-visualizar</span>
            </button>

            <button
              onClick={handleExportZip}
              disabled={isLoading}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              <span>Baixar Tudo (.ZIP)</span>
            </button>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="p-6 bg-[#080D1A]/60 border-b border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Clientes Cadastrados</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {cachedData ? cachedData.clients.length : localClients.length}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Serviços no Catálogo</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {cachedData ? cachedData.catalog.length : localCatalog.length}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Vendas & Transações</p>
              <p className="text-lg font-bold text-white mt-0.5">
                {cachedData ? cachedData.transactions.length : localTransactions.length}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0F172A] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Movimentado</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMovimentado)}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Download Options Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opção 1: JSON Completo */}
            <div className="p-5 rounded-2xl bg-[#0C1425] border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <FileCode className="w-5 h-5" />
                    </span>
                    <h3 className="text-sm font-bold text-white">Backup Estruturado Completo (JSON)</h3>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Exporta todas as coleções do Firestore (Clientes, Serviços, Vendas e Agendamentos) com metadados do sistema em um único arquivo <strong>.json</strong> pronto para migração e restauração.
                </p>
              </div>

              <button
                onClick={handleExportJson}
                disabled={isLoading}
                className="mt-4 w-full py-2.5 px-4 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Backup Completo (.JSON)</span>
              </button>
            </div>

            {/* Opção 2: Planilhas em CSV para Excel */}
            <div className="p-5 rounded-2xl bg-[#0C1425] border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </span>
                    <h3 className="text-sm font-bold text-white">Planilhas Formatadas para Excel (CSV)</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Excel & Sheets
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Exportação com delimitador brasileiro (<code>;</code>) e codificação <strong>UTF-8 BOM</strong> para abrir sem acentos corrompidos no Microsoft Excel e Google Planilhas.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={handleExportClientsCsv}
                  disabled={isLoading}
                  className="py-2 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] rounded-lg border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 truncate disabled:opacity-50"
                  title="Exportar apenas a planilha de Clientes"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">CSV Clientes</span>
                </button>

                <button
                  onClick={handleExportCatalogCsv}
                  disabled={isLoading}
                  className="py-2 px-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold text-[11px] rounded-lg border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 truncate disabled:opacity-50"
                  title="Exportar apenas o Catálogo de Serviços e Produtos"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">CSV Serviços</span>
                </button>

                <button
                  onClick={handleExportTransactionsCsv}
                  disabled={isLoading}
                  className="py-2 px-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-semibold text-[11px] rounded-lg border border-purple-500/30 transition-all flex items-center justify-center gap-1.5 truncate disabled:opacity-50"
                  title="Exportar apenas o Histórico Financeiro e Vendas"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">CSV Financeiro</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Info & Timestamp */}
          <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {lastBackup ? (
                  <>
                    Último backup realizado neste navegador em: <strong className="text-white">{lastBackup}</strong>
                  </>
                ) : (
                  'Nenhum backup realizado recentemente nesta sessão.'
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Os backups são salvos localmente e não compartilham dados externamente.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pré-visualização de Dados */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B1220] border border-amber-500/30 rounded-2xl w-full max-w-4xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0F172A]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Pré-visualização do Backup</h3>
                    <p className="text-xs text-slate-400">
                      Verifique os dados cadastrados prontos para download
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/5 bg-[#070B14] px-4 gap-2 text-xs font-medium">
                <button
                  onClick={() => setPreviewTab('clients')}
                  className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
                    previewTab === 'clients'
                      ? 'border-blue-400 text-blue-300 font-bold bg-blue-500/10'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Clientes ({cachedData?.clients.length || localClients.length})</span>
                </button>

                <button
                  onClick={() => setPreviewTab('catalog')}
                  className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
                    previewTab === 'catalog'
                      ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-500/10'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Serviços / Catálogo ({cachedData?.catalog.length || localCatalog.length})</span>
                </button>

                <button
                  onClick={() => setPreviewTab('transactions')}
                  className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
                    previewTab === 'transactions'
                      ? 'border-emerald-400 text-emerald-300 font-bold bg-emerald-500/10'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Vendas & Financeiro ({cachedData?.transactions.length || localTransactions.length})</span>
                </button>
              </div>

              {/* Table Preview */}
              <div className="p-4 overflow-y-auto max-h-[50vh] text-xs">
                {previewTab === 'clients' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5">
                          <th className="p-2.5">Nome</th>
                          <th className="p-2.5">Telefone</th>
                          <th className="p-2.5">Local</th>
                          <th className="p-2.5">Classificação</th>
                          <th className="p-2.5 text-right">Total Gasto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {((cachedData?.clients || localClients).slice(0, 15)).map((c) => (
                          <tr key={c.id} className="hover:bg-white/5">
                            <td className="p-2.5 font-medium text-white">{c.name}</td>
                            <td className="p-2.5">{c.phone || '-'}</td>
                            <td className="p-2.5">{c.location || '-'}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {c.classification || 'ATIVO'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.totalSpent || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {previewTab === 'catalog' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5">
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5">Categoria</th>
                          <th className="p-2.5">Tipo</th>
                          <th className="p-2.5">Duração</th>
                          <th className="p-2.5 text-right">Preço</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {((cachedData?.catalog || localCatalog).slice(0, 15)).map((item) => (
                          <tr key={item.id} className="hover:bg-white/5">
                            <td className="p-2.5 font-medium text-white">{item.name}</td>
                            <td className="p-2.5">{item.category}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {item.type === 'service' ? 'Serviço' : 'Produto'}
                              </span>
                            </td>
                            <td className="p-2.5">{item.duration || '-'}</td>
                            <td className="p-2.5 text-right font-mono text-emerald-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {previewTab === 'transactions' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5">
                          <th className="p-2.5">ID</th>
                          <th className="p-2.5">Data</th>
                          <th className="p-2.5">Pagamento</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5 text-right">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {((cachedData?.transactions || localTransactions).slice(0, 15)).map((t) => (
                          <tr key={t.id} className="hover:bg-white/5">
                            <td className="p-2.5 font-mono text-[11px] text-slate-400">{t.id.slice(0, 8)}...</td>
                            <td className="p-2.5">{t.date}</td>
                            <td className="p-2.5 uppercase text-[11px] font-semibold text-cyan-300">
                              {t.paymentMethod}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {t.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-400">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.total || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-[#070B14] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Mostrando os primeiros 15 registros de cada coleção.
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleExportJson}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5" /> Baixar JSON
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
