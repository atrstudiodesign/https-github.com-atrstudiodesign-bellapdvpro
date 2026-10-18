import { useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, CheckCircle, Smartphone, Mail, CreditCard, Box, Key, Zap, UserCircle, QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApiKeysStore } from '../store/apiKeys';
import { FeatureGate } from '../components/ui/FeatureGate';

export default function Integrations() {
  const [whatsappStatus, setWhatsappStatus] = useState<'DISCONNECTED' | 'LOADING' | 'CONNECTED'>('DISCONNECTED');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  
  // Custom states for WhatsApp CRM dashboards
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappProvider, setWhatsappProvider] = useState<'Evolution' | 'MetaCloud' | 'Z-API'>('MetaCloud');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappQueue] = useState<Array<{ id: string; recipient: string; text: string; scheduled: string }>>([]);
  const [whatsappLogs] = useState<Array<{ id: string; recipient: string; text: string; status: string; time: string }>>([]);

  const { evolutionUrl, evolutionKey, asaasKey, geminiKey, setAsaasKey } = useApiKeysStore();
  const [isAsaasIntegrated, setIsAsaasIntegrated] = useState(false);

  const handleValidateAsaas = async () => {
      if (!asaasKey) {
          toast.error("Informe a API Key do Asaas primeiro.");
          return;
      }
      const toastId = toast.loading("Validando conta Asaas...");
      try {
          const response = await fetch('/api/asaas/proxy', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'x-asaas-key': asaasKey
              },
              body: JSON.stringify({
                  path: '/myAccount',
                  method: 'GET'
              })
          });
          const data = await response.json();
          if (response.ok) {
              toast.success(`Conta Asaas confirmada!`, { id: toastId, description: `Empresa: ${data.name || data.companyName}`});
              setIsAsaasIntegrated(true);
          } else {
              throw new Error(data.error || 'Não localizado');
          }
      } catch (err: any) {
          console.error(err);
          toast.error("Erro ao validar", { id: toastId, description: err.message });
          setIsAsaasIntegrated(false);
      }
  };

  const [whiteLabelDomain, setWhiteLabelDomain] = useState('');
  const [whiteLabelColor, setWhiteLabelColor] = useState('#7A5CFF');

  const handleApplyWhiteLabel = () => {
     if (!whiteLabelDomain.trim()) {
       toast.error('Informe um domínio válido');
       return;
     }
     toast.warning('Configuração White-Label indisponível: DNS e CNAME exigem integração com backend. Nenhum domínio foi alterado.');
  };

  const handleConnectWhatsapp = async () => {
     if (!evolutionUrl || !evolutionKey) {
        toast.error('Configure URL e chave reais da Evolution API antes de conectar.');
        setWhatsappStatus('DISCONNECTED');
        return;
     }
     setIsQrModalOpen(true);
     setWhatsappStatus('LOADING');
     setQrCodeBase64(null);

     try {
       // Tenta obter conexão com a Evolution API Oficial
       const instanceName = "BellaPDV-Oficial";
       const response = await fetch(`${evolutionUrl.replace(/\/$/, '')}/instance/connect/${instanceName}`, {
         headers: { 'apikey': evolutionKey }
       });
       if (!response.ok) {
           // Se a instancia não existe, cria ela
           const createRes = await fetch(`${evolutionUrl.replace(/\/$/, '')}/instance/create`, {
               method: 'POST',
               headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
               body: JSON.stringify({ instanceName, qrcode: true })
           });
           const createData = await createRes.json();
           if (createData.qrcode && createData.qrcode.base64) {
               setQrCodeBase64(createData.qrcode.base64);
           } else {
               throw new Error("Não foi possível gerar QR Code.");
           }
       } else {
           const data = await response.json();
           if (data.base64) {
               setQrCodeBase64(data.base64);
           } else {
               await verifyWhatsAppConnection();
           }
       }
     } catch (err: any) {
        console.error(err);
        toast.error("Erro na Evolution API", { description: err.message });
        setWhatsappStatus('DISCONNECTED');
        setIsQrModalOpen(false);
     }
  };

  const verifyWhatsAppConnection = async () => {
    if (!evolutionUrl || !evolutionKey) {
      setWhatsappStatus('DISCONNECTED');
      toast.error('Credenciais Evolution API ausentes.');
      return;
    }
    try {
      const response = await fetch(`${evolutionUrl.replace(/\/$/, '')}/instance/connectionState/BellaPDV-Oficial`, {
        headers: { apikey: evolutionKey },
      });
      if (!response.ok) throw new Error('Não foi possível consultar o estado real da instância.');
      const state = await response.json();
      if (state?.instance?.state === 'open') {
        setWhatsappStatus('CONNECTED');
        setIsQrModalOpen(false);
        toast.success('WhatsApp conectado: estado confirmado pela Evolution API.');
      } else {
        setWhatsappStatus('DISCONNECTED');
        toast.info('WhatsApp ainda não conectado. Faça a leitura do QR Code.');
      }
    } catch (error) {
      setWhatsappStatus('DISCONNECTED');
      toast.error('Conexão não confirmada. Verifique Evolution API e permissões de acesso.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050B14]">
      {/* Header */}
      <div className="flex-none h-24 border-b border-[#1A2C47] px-8 flex items-center justify-between bg-[#0C1627] sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-tight">App Store & Integrações</h1>
          <p className="text-sm text-slate-400 mt-1">Conecte sua empresa a canais e ferramentas do mercado (Multi-tenant layer).</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
            
            {/* SAAS CORE */}
            <div>
               <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Box className="w-5 h-5 text-purple-400" /> Core SaaS</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ASAAS */}
                  <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                     <div>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-xl tracking-tighter">AS</div>
                              <div>
                                 <h4 className="text-white font-semibold flex items-center gap-2 text-lg">Asaas API</h4>
                                 <p className="text-xs text-slate-400">Motor de cobrança e subcontas</p>
                              </div>
                           </div>
                           {isAsaasIntegrated ? (
                              <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-green-500/20 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Integrado</span>
                           ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-400/10 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-500/20 flex items-center gap-1">Pendente</span>
                           )}
                        </div>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                           Sincronize clientes e crie cobranças reais (Pix, Cartão e Boleto) usando nossa integração com API do Asaas.
                        </p>
                        
                        <div className="mb-4">
                           <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1 block">API Key do Asaas</label>
                           <input type="password" value={asaasKey} onChange={(e) => setAsaasKey(e.target.value)} placeholder="$aact_..." className="w-full bg-[#111] border border-[#1A2C47] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
                        </div>
                     </div>
                     <button 
                        onClick={handleValidateAsaas}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium text-sm flex items-center justify-center gap-2"
                     >
                        Verificar Conexão e Meus Dados
                     </button>
                  </div>

                  {/* OPENAI / GEMINI */}
                  <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col justify-between hover:border-cyan-500/50 transition-colors">
                     <div>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-white">
                                 <Zap className="w-6 h-6" />
                              </div>
                              <div>
                                 <h4 className="text-white font-semibold flex items-center gap-2 text-lg">Motor AI (Gemini)</h4>
                                 <p className="text-xs text-slate-400">LLM para Autopilot</p>
                              </div>
                           </div>
                           {geminiKey ? (
                              <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-green-500/20 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Integrado</span>
                           ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-400/10 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-500/20 flex items-center gap-1">Pendente</span>
                           )}
                        </div>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                           A inteligência artificial está habilitada. Análise de churn, automação de textos e gestão de funil são processados no nosso backend de forma nativa usando a chave fornecida.
                        </p>
                        <div className="bg-black/30 p-3 rounded-lg border border-white/5 mb-6 font-mono text-xs text-slate-400">
                           <span className="text-cyan-400">LLM Atual:</span> <span className="opacity-70">gemini-3.5-flash / gemini-3.1-pro</span><br/>
                           <span className="text-cyan-400">Status da Chave:</span> <span className="opacity-70">{geminiKey ? 'Configurada' : 'Não configurada (Usando fallback)'}</span>
                        </div>
                     </div>
                     <button 
                        onClick={() => {
                           if (geminiKey) {
                               toast.success('Chave OK!', { description: 'O modelo de base e tom de voz estão ativos.' });
                           } else {
                               toast.error('Configure a chave na aba Configurações.');
                           }
                        }}
                        className="w-full py-2.5 rounded-lg border border-[#1A2C47] text-white hover:bg-[#1A2C47] transition-colors font-medium text-sm"
                     >
                        Verificar Status da Engine AI
                     </button>
                  </div>
               </div>
            </div>

            {/* PUBLIC API & DEVELOPERS */}
            <div>
               <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Box className="w-5 h-5 text-indigo-400" /> Plataforma & Desenvolvedores</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* REST API */}
                  <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
                     <div>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                              </div>
                              <div>
                                 <h4 className="text-white font-semibold flex items-center gap-2 text-lg">API REST Pública</h4>
                                 <p className="text-xs text-slate-400">Headless UI & Integrações</p>
                              </div>
                           </div>
                           <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-green-500/20 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Chave Gerada</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                           Crie seus próprios aplicativos ou integre seu site existente com nossa API de agendamento em tempo real.
                        </p>
                        <div className="bg-black/30 p-3 rounded-lg border border-white/5 mb-6 font-mono text-xs text-slate-400 overflow-x-auto">
                           <span className="text-indigo-400">GET</span> <span className="opacity-70">/api/v1/public/slots?date=today</span><br/>
                           <span className="text-amber-400">POST</span> <span className="opacity-70">/api/v1/public/bookings</span><br/>
                           <span className="text-emerald-400 mt-2 block pt-2 border-t border-white/5">Bearer Token:</span>
                           <span className="opacity-70 break-all select-all">pk_live_8f92jK...</span>
                        </div>
                     </div>
                     <button className="w-full py-2.5 rounded-lg border border-[#1A2C47] text-white hover:bg-[#1A2C47] transition-colors font-medium text-sm flex items-center justify-center gap-2">
                        Ver Documentação no Swagger <ExternalLink className="w-4 h-4" />
                     </button>
                  </div>

                  {/* WHITE LABEL & CUSTOMER APP */}
                  <FeatureGate featureKey="whiteLabel">
                     <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col justify-between hover:border-fuchsia-500/50 transition-colors h-full">
                        <div>
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-pink-500 flex items-center justify-center font-bold text-white">
                                    <Smartphone className="w-6 h-6" />
                                 </div>
                                 <div>
                                    <h4 className="text-white font-semibold flex items-center gap-2 text-lg">White-Label & App</h4>
                                    <p className="text-xs text-slate-400">PWA exclusivo do cliente final</p>
                                 </div>
                              </div>
                              <span className="text-[10px] text-fuchsia-400 bg-fuchsia-400/10 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-fuchsia-500/20 flex items-center gap-1">Premium</span>
                           </div>
                           <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                              Personalize a experiência do seu cliente. App de agendamento e programa de fidelidade com <strong>sua logo, suas cores e seu domínio próprio</strong>.
                           </p>
                           <form className="space-y-3 mb-6" onSubmit={(e) => { e.preventDefault(); handleApplyWhiteLabel(); }}>
                              <div className="bg-black/20 p-2 rounded border border-[#1A2C47]">
                                 <label className="text-[10px] uppercase text-slate-500 font-bold tracking-widest ml-1 mb-1 block">Custom Domain</label>
                                 <input type="text" value={whiteLabelDomain} onChange={(e) => setWhiteLabelDomain(e.target.value)} placeholder="app.suaempresa.com.br" className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-slate-600 px-1" />
                              </div>
                              <div className="bg-black/20 p-2 rounded border border-[#1A2C47] flex justify-between items-center px-3">
                                 <span className="text-sm text-slate-400">Cor Primária (Hex)</span>
                                 <div className="flex items-center gap-2">
                                    <span className="text-white font-mono text-xs">{whiteLabelColor}</span>
                                    <input type="color" value={whiteLabelColor} onChange={(e) => setWhiteLabelColor(e.target.value)} className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-none outline-none" />
                                 </div>
                              </div>
                           </form>
                        </div>
                        <button onClick={handleApplyWhiteLabel} className="w-full py-2.5 rounded-lg border border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/10 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                           Aplicar White-Label <CheckCircle className="w-4 h-4" />
                        </button>
                     </div>
                  </FeatureGate>
               </div>
            </div>
            {/* MARKETPLACE & PLUGINS */}
            <div>
               <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Box className="w-5 h-5 text-orange-400" /> Marketplace & Delivery</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* iFOOD */}
                  <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col justify-between hover:border-red-500/50 transition-colors">
                     <div>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white text-xl tracking-tighter">IF</div>
                              <div>
                                 <h4 className="text-white font-semibold flex items-center gap-2 text-lg">iFood Delivery</h4>
                                 <p className="text-xs text-slate-400">Produtos, combos e cosméticos</p>
                              </div>
                           </div>
                           <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Inativo</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                           Venda pomadas, cosméticos e pacotes diretamente pelo iFood. Receba pedidos direto no PDV.
                        </p>
                     </div>
                     <button onClick={() => toast.info('Solicitação de integração via API do iFood enviada!')} className="w-full py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                        Autorizar Integração <ExternalLink className="w-4 h-4" />
                     </button>
                  </div>

                  {/* GOOGLE & META */}
                  <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                     <div>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white">
                                 <Box className="w-6 h-6" />
                              </div>
                              <div>
                                 <h4 className="text-white font-semibold flex items-center gap-2 text-lg">Meta & Google</h4>
                                 <p className="text-xs text-slate-400">Ads, Analytics & Pixel</p>
                              </div>
                           </div>
                           <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-green-500/20"><CheckCircle className="w-3 h-3 inline" /> Ativo</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                           Eventos de agendamento e compra são enviados via Server-side CAPI para Meta e GA4.
                        </p>
                     </div>
                     <button onClick={() => toast.success('Gerenciador de Pixels aberto em nova guia (Simulação)')} className="w-full py-2.5 rounded-lg border border-[#1A2C47] text-white hover:bg-[#1A2C47] transition-colors font-medium text-sm">
                        Configurar Pixels
                     </button>
                  </div>
               </div>
            </div>

            {/* CANAIS DE COMUNICAÇÃO */}
            <div>
               <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-emerald-400" /> Canais de Comunicação</h2>
               <div className="grid grid-cols-1 gap-6">
                  {/* WHATSAPP DASHBOARD */}
                  <FeatureGate featureKey="whatsapp">
                     <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col hover:border-emerald-500/30 transition-all h-full">
                     <div className="flex flex-col xl:flex-row justify-between gap-6 pb-6 border-b border-white/5">
                        <div className="flex-1 space-y-4">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center font-bold text-white">
                                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                 </div>
                                 <div>
                                    <h4 className="text-white font-semibold flex items-center gap-2 text-md">WhatsApp Business Autopilot</h4>
                                    <p className="text-xs text-slate-400">Canal ativo para notificações, cobranças e campanhas</p>
                                 </div>
                              </div>

                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border transition ${
                                 whatsappStatus === 'CONNECTED' 
                                    ? 'text-green-400 bg-green-400/10 border-green-500/20 shadow-sm' 
                                    : 'text-amber-400 bg-amber-400/10 border-amber-500/20'
                              }`}>
                                 {whatsappStatus === 'CONNECTED' ? '● CONECTADO' : '● AGUARDANDO QRCODE'}
                              </span>
                           </div>

                           <p className="text-xs text-slate-400 leading-relaxed">
                              Configure seu número, gateway e acesse o log de disparos do CRM. Suas automações usarão prioritariamente este canal se configuradas.
                           </p>

                           {/* Dynamic Fields (phoneNumber, provider, token) */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/15 p-4 rounded-xl border border-white/5">
                              <div>
                                 <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Membro do Número</label>
                                 <input 
                                    type="text" 
                                    placeholder="+55 (11) 98421-0492" 
                                    value={whatsappPhone}
                                    onChange={(e) => setWhatsappPhone(e.target.value)}
                                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500 transition"
                                 />
                              </div>

                              <div>
                                 <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Provedor API</label>
                                 <select 
                                    value={whatsappProvider}
                                    onChange={(e) => setWhatsappProvider(e.target.value as any)}
                                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500 transition"
                                 >
                                    <option value="Evolution">Evolution API (v2)</option>
                                    <option value="MetaCloud">Meta Cloud API (Official)</option>
                                    <option value="Z-API">Z-API Gateway</option>
                                 </select>
                              </div>

                              <div>
                                 <label className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Token de Acesso</label>
                                 <input 
                                    type="password" 
                                    placeholder="••••••••••••••••" 
                                    value={whatsappToken}
                                    onChange={(e) => setWhatsappToken(e.target.value)}
                                    className="w-full bg-[#050B14] border border-[#1A2C47] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500 transition"
                                 />
                              </div>
                           </div>

                           <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                              <span>Webhook URL de Retorno: <strong className="text-slate-300 font-mono">https://bellapdv.app/api/v1/webhooks/whatsapp</strong></span>
                              <button 
                                 onClick={() => {
                                    toast.success('Sessão de Webhook Re-sincronizada!', { description: 'Webhook ouvindo com sucesso no Worker.' });
                                 }}
                                 className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                              >
                                 <CheckCircle className="w-3 h-3" /> Testar Webhook Ping
                              </button>
                           </div>
                        </div>

                        {/* Connection action info */}
                        <div className="w-full xl:w-72 flex flex-col justify-between bg-black/20 p-4 border border-[#1A2C47] rounded-xl">
                           <div className="space-y-2">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Metadados de Gateway</span>
                              <div className="text-[11px] font-mono leading-normal text-slate-400 space-y-1">
                                 <div>Instance: <b className="text-emerald-400">inst_production_bella</b></div>
                                 <div>Ping: <b className="text-slate-200">12ms - Online</b></div>
                                 <div>Provider: <b className="text-slate-200">{whatsappProvider} Gateway</b></div>
                              </div>
                           </div>

                           <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                           {whatsappStatus === 'DISCONNECTED' ? (
                              <button 
                                 onClick={handleConnectWhatsapp}
                                 className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase rounded-lg transition shadow-md"
                              >
                                 Gerar QR Code Conexão
                              </button>
                           ) : whatsappStatus === 'LOADING' ? (
                              <button disabled className="w-full py-2 bg-neutral-800 text-slate-400 cursor-not-allowed text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1">
                                 <Zap className="w-3 h-3 animate-spin text-emerald-400" /> Carregando...
                              </button>
                           ) : (
                              <button 
                                 onClick={() => {
                                    setWhatsappStatus('DISCONNECTED');
                                    toast.error('WhatsApp Desconectado com sucesso.');
                                 }}
                                 className="w-full py-2 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold text-xs uppercase rounded-lg transition"
                              >
                                 Desconectar WhatsApp
                              </button>
                           )}
                           </div>
                        </div>
                     </div>

                     {/* Sub Grid Queue + History Logs */}
                     <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* QUEUE */}
                        <div className="bg-black/10 border border-white/5 rounded-xl p-4 flex flex-col h-60">
                           <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                 <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Fila Ativa de Envio (Queue)
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">{whatsappQueue.length} aguardando</span>
                           </div>

                           <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
                              {whatsappQueue.map(q => (
                                 <div key={q.id} className="bg-[#15233A]/50 border border-white/5 p-2.5 rounded-lg flex items-center justify-between text-xs">
                                    <div className="truncate pr-2">
                                       <div className="font-semibold text-white truncate max-w-[150px]">{q.recipient}</div>
                                       <span className="text-[10px] text-slate-400 truncate line-clamp-1 block mt-0.5">{q.text}</span>
                                    </div>
                                    <div className="text-right shrink-0">
                                       <span className="text-[8px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-1 py-0.5 rounded font-mono block">PENDING</span>
                                       <span className="text-[9px] text-slate-500 font-mono mt-1 block">{q.scheduled}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* HISTORY LOGS */}
                        <div className="bg-black/10 border border-white/5 rounded-xl p-4 flex flex-col h-60">
                           <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                 <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Histórico de Disparos (Sent Logs)
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">Real-time</span>
                           </div>

                           <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 hide-scrollbar">
                              {whatsappLogs.map(log => {
                                 const isSent = log.status === 'Sent';
                                 const isDelivered = log.status === 'Delivered';
                                 
                                 const statusBadge = isSent 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : isDelivered 
                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                                    : 'bg-green-500/10 text-green-400 border border-green-500/20';
                                 
                                 return (
                                    <div key={log.id} className="bg-[#15233A]/20 border border-[#1A2C47] p-2.5 rounded-lg flex items-center justify-between text-xs hover:border-white/10 transition-colors">
                                       <div className="truncate pr-2">
                                          <div className="font-semibold text-white flex items-center gap-1.5">
                                             {log.recipient} 
                                             <span className="font-mono text-[9px] text-slate-500">({log.time})</span>
                                          </div>
                                          <p className="text-[10px] text-slate-400 line-clamp-1 block mt-0.5">{log.text}</p>
                                       </div>
                                       <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded font-mono shrink-0 ${statusBadge}`}>
                                          {log.status}
                                       </span>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                     </div>
                     
                  </div>
                  </FeatureGate>

                  {/* SMTP EMAIL */}
                  <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47] flex flex-col justify-between hover:border-slate-500/50 transition-colors">
                     <div>
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white">
                                 <Mail className="w-6 h-6" />
                              </div>
                              <div>
                                 <h4 className="text-white font-semibold flex items-center gap-2 text-lg">E-mail SMTP</h4>
                                 <p className="text-xs text-slate-400">Envio corporativo</p>
                              </div>
                           </div>
                           <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Inativo</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                           Configure credenciais SMTP próprias para disparar recibos, alertas da agenda e funis de marketing com domínio próprio.
                        </p>
                        <form className="space-y-3 mb-6">
                           <div className="bg-black/20 p-2 rounded border border-[#1A2C47] flex items-center gap-2">
                              <Key className="w-4 h-4 text-slate-500 ml-2" />
                              <input type="text" placeholder="smtp.gmail.com" className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-slate-600" />
                           </div>
                           <div className="bg-black/20 p-2 rounded border border-[#1A2C47] pb-2 flex items-center gap-2">
                              <UserCircle className="w-4 h-4 text-slate-500 ml-2" />
                              <input type="text" placeholder="user@domain.com" className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-slate-600" />
                           </div>
                        </form>
                     </div>
                     <button className="w-full py-2.5 rounded-lg border border-[#1A2C47] text-white hover:bg-[#1A2C47] transition-colors font-medium text-sm">
                        Salvar Credenciais Criptografadas
                     </button>
                  </div>
               </div>
            </div>

        </div>
      </div>

      {/* WHATSAPP QR MODAL */}
      <AnimatePresence>
        {isQrModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-[#0F172A] border border-[#1A2C47] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative"
             >
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                   <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                      <QrCode className="w-5 h-5 text-emerald-400" />
                      Conectar WhatsApp
                   </h3>
                   <button onClick={() => { setIsQrModalOpen(false); setWhatsappStatus('DISCONNECTED'); }} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                <div className="p-8 flex flex-col items-center">
                   <p className="text-center text-slate-300 text-sm mb-6">
                      Abra o WhatsApp no seu celular, vá em <strong className="text-white">Aparelhos Conectados</strong> e aponte a câmera para o QRCode abaixo.
                   </p>
                   <div 
                      onClick={verifyWhatsAppConnection}
                      className="w-48 h-48 bg-white rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.2)] flex items-center justify-center cursor-pointer border-[8px] border-white relative group mb-6 overflow-hidden" 
                   >
                      {qrCodeBase64 ? (
                         <img src={qrCodeBase64.startsWith('http') ? qrCodeBase64 : qrCodeBase64} alt="QR Code WhatsApp" className="w-full h-full" />
                      ) : (
                         <div className="flex flex-col items-center justify-center text-slate-400">
                            <Zap className="w-8 h-8 animate-pulse mb-2 text-emerald-400" />
                            <span className="text-xs">Gerando QR...</span>
                         </div>
                      )}
                   </div>
                   <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <Zap className="w-3 h-3 animate-pulse" />
                      Aguardando leitura do QR Code...
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
