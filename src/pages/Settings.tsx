import { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useNicheStore } from '../store/niche';
import { Scissors, HeartPulse, Sparkles, Activity, CreditCard, CheckCircle, Shield, Clock, X, ExternalLink, Bell, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuthStore();
  const { getConfig } = useNicheStore();
  const config = getConfig();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [wppAuto, setWppAuto] = useState(true);
  const [emailAuto, setEmailAuto] = useState(false);

  const toggleWpp = () => {
     setWppAuto(!wppAuto);
     toast.success(wppAuto ? 'Lembrete WhatsApp desativado' : 'Lembrete WhatsApp ativado');
  };

  const toggleEmail = () => {
     setEmailAuto(!emailAuto);
     toast.success(emailAuto ? 'Lembrete E-mail desativado' : 'Lembrete E-mail ativado');
  };

  const handleBuyPlan = (plan: string) => {
    setSelectedPlan(plan);
  };

  const handleConfirmPurchase = () => {
    let paymentLink = 'https://www.asaas.com/';
    
    // Links de pagamento
    if (selectedPlan === 'Básico') {
      paymentLink = 'https://www.asaas.com/c/z7f8pxtethrwwubw'; // Link do Asaas para o plano Básico
    } else if (selectedPlan === 'Pro') {
      paymentLink = 'https://www.asaas.com/c/zbup4e02d4w6oc9e';    // Link do Asaas para o plano Pro
    } else if (selectedPlan === 'Premium') {
      paymentLink = 'https://www.asaas.com/c/rpawsbwgfgrsp2xu';// Link do Asaas para o plano Premium
    }

    window.open(paymentLink, '_blank');
    setSelectedPlan(null);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10 relative">
       
       <AnimatePresence>
          {selectedPlan && (
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
                 className="bg-[#0C1627] border border-[#1A2C47] p-8 rounded-2xl w-full max-w-md relative shadow-2xl"
               >
                  <button 
                    onClick={() => setSelectedPlan(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)] mx-auto">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-semibold mb-2 text-white text-center">Confirmar Assinatura</h3>
                  <p className="text-slate-400 mb-8 text-center">
                    Você está prestes a assinar o plano <span className="text-white font-semibold capitalize">{selectedPlan}</span>. Você será redirecionado para o ambiente seguro do Asaas para finalizar o pagamento.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleConfirmPurchase}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
                    >
                      <span>Ir para Pagamento Seguro</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedPlan(null)}
                      className="w-full py-3 bg-transparent border border-[#1A2C47] text-slate-300 hover:bg-white/5 font-semibold rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
               </motion.div>
            </motion.div>
          )}
       </AnimatePresence>

       {/* HEADER */}
       <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Configurações Avançadas</h1>
          <p className="text-slate-400 mt-2 text-lg">
             Gerencie as configurações do Bella PDV, nicho de atuação e detalhes da sua assinatura.
          </p>
       </div>

       {/* BILLING & PLANS SECTION */}
       <div className="glass-card p-0 border border-[#1A2C47] overflow-hidden">
          <div className="bg-[#0C1627] p-6 border-b border-[#1A2C47] flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                 <CreditCard className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-semibold text-white">Faturamento & Planos (Stripe Engine)</h2>
                  <p className="text-sm text-slate-400">Proration nativo, Trial Inteligente e upgrades automáticos.</p>
               </div>
             </div>
             <div className="bg-amber-500/10 text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)] cursor-pointer hover:bg-amber-500/20 transition-colors" title="Trial inteligente detecta uso e propõe assinatura">
                <Clock className="w-4 h-4" />
                 <span>Trial Inteligente: Termina em 2 dias</span>
             </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* BASIC PLAN */}
             <div className="bg-[#0C1627]/50 rounded-2xl border border-[#1A2C47] p-6 hover:border-[#253B5C] transition-all flex flex-col">
                <h3 className="text-lg font-semibold text-white">Básico</h3>
                <div className="flex items-end gap-1 mt-2 mb-4">
                   <span className="text-3xl font-bold text-white">R$79</span>
                   <span className="text-slate-400 mb-1">/mês</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm text-slate-300 flex-1">
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> PDV completo</li>
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Agenda</li>
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Até 2 profissionais</li>
                </ul>
                <div className="mt-auto space-y-3">
                   <div className="text-xs text-center text-slate-500 mb-2 border-t border-white/5 pt-3">
                      Inclui upgrade automático por uso
                   </div>
                   <button 
                     onClick={() => handleBuyPlan('Básico')}
                     className="w-full py-2.5 rounded-lg border border-[#1A2C47] text-white hover:bg-[#1A2C47] transition-colors font-medium"
                   >
                      Assinar Básico
                   </button>
                </div>
             </div>

             {/* PRO PLAN */}
             <div className="bg-gradient-to-b from-blue-900/40 to-[#0C1627]/50 rounded-2xl border border-blue-500/50 p-6 relative shadow-[0_0_30px_rgba(59,130,246,0.15)] transform scale-105 z-10 flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Recomendado
                </div>
                <h3 className="text-lg font-semibold text-white">Pro</h3>
                <div className="flex items-end gap-1 mt-2 mb-4">
                   <span className="text-3xl font-bold text-blue-400 neon-text">R$129</span>
                   <span className="text-slate-400 mb-1">/mês</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm text-slate-300 flex-1">
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> Tudo do Básico</li>
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> Profissionais ilimitados</li>
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> Lembretes WhatsApp VIP</li>
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> Cupons de Desconto</li>
                </ul>
                <div className="mt-auto space-y-3">
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 mx-1 mb-2">
                       <input type="text" placeholder="Código de Cupom" className="bg-transparent border-none outline-none text-xs text-white px-2 w-full" />
                       <button className="text-xs bg-blue-600 px-2 py-1 rounded text-white font-medium">Aplicar</button>
                    </div>
                   <button 
                     onClick={() => handleBuyPlan('Pro')}
                     className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                   >
                      Atualizar para Pro (Prorated)
                   </button>
                </div>
             </div>

             {/* ENTERPRISE PLAN */}
             <div className="bg-[#0C1627]/50 rounded-2xl border border-[#1A2C47] p-6 hover:border-[#253B5C] transition-all flex flex-col">
                <h3 className="text-lg font-semibold text-white">Premium</h3>
                <div className="flex items-end gap-1 mt-2 mb-4">
                   <span className="text-3xl font-bold text-white">R$197</span>
                   <span className="text-slate-400 mb-1">/mês</span>
                </div>
                <ul className="space-y-3 mb-6 text-sm text-slate-300 flex-1">
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Tudo do Pro</li>
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-unidade</li>
                   <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Acesso API Pública Limitada</li>
                </ul>
                <div className="mt-auto space-y-3">
                   <div className="text-xs text-center text-slate-500 mb-2 border-t border-white/5 pt-3">
                      Suporte SLA Premium
                   </div>
                   <button 
                     onClick={() => handleBuyPlan('Premium')}
                     className="w-full py-2.5 rounded-lg border border-[#1A2C47] text-white hover:bg-[#1A2C47] transition-colors font-medium"
                   >
                      Assinar Premium
                   </button>
                </div>
             </div>
          </div>
       </div>

       {/* AUTOMATIONS SECTION */}
       <div className="glass-card p-8 border-[#1A2C47]">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2.5 bg-green-500/20 text-green-400 rounded-xl">
               <Bell className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-semibold text-white">Lembretes & Automação de Pagamento</h2>
                <p className="text-sm text-slate-400">Configure avisos de pagamento automáticos diretamente no celular ou email dos clientes VIP/Pacotes.</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-[#0C1627] p-5 rounded-2xl border border-[#1A2C47] flex items-center justify-between hover:border-green-500/30 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                     <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                   </div>
                   <div>
                      <h4 className="text-white font-semibold mb-0.5">Automático via WhatsApp</h4>
                      <p className="text-xs text-slate-400">Envia lembrete 3 dias antes do vencimento</p>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div 
                    onClick={toggleWpp} 
                    className={`w-12 h-6 ${wppAuto ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-[#1A2C47]'} rounded-full relative cursor-pointer flex items-center px-1 transition-colors duration-300`}
                  >
                     <div className={`w-4 h-4 ${wppAuto ? 'bg-white' : 'bg-slate-500'} rounded-full absolute transition-all duration-300 ${wppAuto ? 'right-1' : 'left-1 shadow'}`} />
                  </div>
                  {wppAuto && <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Ativo</span>}
                </div>
             </div>

             <div className="bg-[#0C1627] p-5 rounded-2xl border border-[#1A2C47] flex items-center justify-between hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                     <Mail className="w-5 h-5 text-blue-400" />
                   </div>
                   <div>
                      <h4 className="text-white font-semibold mb-0.5">Automático via E-mail</h4>
                      <p className="text-xs text-slate-400">Envia boleto/PIX por email 5 dias antes</p>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div 
                    onClick={toggleEmail} 
                    className={`w-12 h-6 ${emailAuto ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-[#1A2C47]'} rounded-full relative cursor-pointer flex items-center px-1 transition-colors duration-300`}
                  >
                     <div className={`w-4 h-4 ${emailAuto ? 'bg-white' : 'bg-slate-500'} rounded-full absolute transition-all duration-300 ${emailAuto ? 'right-1' : 'left-1 shadow'}`} />
                  </div>
                  {emailAuto && <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Ativo</span>}
                </div>
             </div>
          </div>
       </div>

       {/* BACKUP E SEGURANÇA */}
       <div className="glass-card p-8 border-[#1A2C47]">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2.5 bg-yellow-500/20 text-yellow-400 rounded-xl">
               <Shield className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-semibold text-white">Backup e Exportação de Dados</h2>
                <p className="text-sm text-slate-400">Faça o download de todos os seus dados cadastrados para garantir a segurança das informações.</p>
             </div>
          </div>
          
          <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
             <div>
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                   Exportação de Banco de Dados (JSON)
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                   Esta opção fará uma varredura em todos os seus registros (Clientes, Agenda, Catálogo, Profissionais e Transações Financeiras) na nuvem e baixará um arquivo num formato seguro.
                </p>
             </div>
             
             <button
               onClick={async () => {
                 try {
                    const { db } = await import('../lib/firebase');
                    const { collection, getDocs, query, where } = await import('firebase/firestore');
                    const { getAuth } = await import('firebase/auth');
                    const auth = getAuth();
                    const user = auth.currentUser;
                    
                    if (!user) {
                        toast.error("Usuário não autenticado.");
                        return;
                    }

                    toast.info("Iniciando backup. Por favor, aguarde...");

                    const collectionsToExport = ['clients', 'appointments', 'catalog', 'professionals', 'transactions'];
                    const backupData: Record<string, any[]> = {};

                    for (const collName of collectionsToExport) {
                        const q = query(collection(db, collName), where('ownerId', '==', user.uid));
                        const snapshot = await getDocs(q);
                        backupData[collName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    }

                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `backup_bella_pdv_${new Date().toISOString().split('T')[0]}.json`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                    
                    toast.success("Backup do banco de dados concluído com sucesso!");
                 } catch (error) {
                    console.error("Erro no backup:", error);
                    toast.error("Falha ao exportar os dados.");
                 }
               }}
               className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-gray-900 font-semibold py-3 px-6 rounded-xl transition-all whitespace-nowrap border border-yellow-500/30 w-full md:w-auto text-center"
             >
                Gerar e Baixar Backup
             </button>
          </div>
       </div>

    </div>
  )
}
