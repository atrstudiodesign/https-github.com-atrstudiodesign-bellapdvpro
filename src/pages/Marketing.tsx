import { useState } from 'react';
import { useNicheStore } from '../store/niche';
import { Bot, Sparkles, Send, MessageCircle, Instagram, Mail, Calendar as CalendarIcon, Check, HelpCircle, ChevronDown, Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApiKeysStore } from '../store/apiKeys';
import { FeatureGate } from '../components/ui/FeatureGate';

export default function Marketing() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const { geminiKey } = useApiKeysStore();

  const [prompt, setPrompt] = useState('');
  const [includeImage, setIncludeImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [response, setResponse] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('whatsapp'); // whatsapp, instagram, email
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Growth Engine - Campaign Studio states (Módulo 6)
  const [selectedSegment, setSelectedSegment] = useState('Qualquer'); // VIP, Ativos, Novos, Risco de Perda, Inativos
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templates, setTemplates] = useState([
    { id: 't1', name: 'Convite Reencontro VIP', text: 'Você faz parte do nosso Club VIP! Já faz 30 dias que não te vemos por aqui. Que tal um mimo especial no seu próximo procedimento?', segment: 'VIP' },
    { id: 't2', name: 'Lembrete de Aniversário', text: 'Parabéns pelo seu dia especial! Como presente da nossa equipe, você acaba de ganhar um voucher com 10% OFF para usar este mês.', segment: 'Novos' },
    { id: 't3', name: 'Recuperação Churn Risco', text: 'Sentimos sua falta! Volte esta semana e ganhe um procedimento estético cortesia de hidratação intensa.', segment: 'Risco de Perda' }
  ]);

  const handleSaveAsTemplate = () => {
    if (!prompt) {
      toast.error('Escreva alguma coisa na mensagem primeiro!');
      return;
    }
    const name = window.prompt('Qual o nome deste template?', 'Meu Template Personalizado');
    if (name) {
      const newTpt = {
        id: `t_${Date.now()}`,
        name: name,
        text: prompt,
        segment: selectedSegment,
      };
      setTemplates([...templates, newTpt]);
      toast.success('Template salvo com sucesso!');
    }
  };

  const handleSelectTemplate = (id: string) => {
    const t = templates.find(item => item.id === id);
    if (t) {
      setSelectedTemplate(id);
      setPrompt(t.text);
      setSelectedSegment(t.segment);
      toast.success(`Template "${t.name}" carregado!`);
    } else {
      setSelectedTemplate('');
    }
  };

  const handleCopy = () => {
     if (!response) return;
     navigator.clipboard.writeText(response);
     toast.success('Texto copiado para a área de transferência!');
  };

  const handleSend = () => {
    toast.error('Disparo indisponível: nenhum provedor de mensagens está integrado.');
  };

  const handleActivateAI = () => {
    toast.error('Retenção automática indisponível: não há worker de execução configurado.');
  };

  const faqs = [
    {
      q: "O que a Inteligência Artificial considera ao gerar a mensagem?",
      a: `A IA é treinada com o contexto do seu negócio (${config.title}), terminologias (ex: usar '${config.terminology.client}' ao invés de termos genéricos), o tom de voz da sua marca e as melhores práticas exclusivas para o canal selecionado (WhatsApp, Instagram ou E-mail).`
    },
    {
      q: "Posso editar a mensagem gerada antes de enviar?",
      a: "Sim! Após gerar o conteúdo, você pode copiar o texto gerado pela IA e ajustá-lo livremente antes de fazer o envio para seus clientes. Imagens geradas podem ser salvas clicando com botão direito."
    },
    {
      q: "Como o botão 'Disparar' funciona na prática?",
      a: "O disparo inteligente realiza uma integração com o seu aplicativo de mensagens padrão (como o WhatsApp Web ou aplicativo) e preenche automaticamente a mensagem, facilitando o envio para suas listas de transmissão."
    },
    {
      q: "Dica: Como escrever um bom pedido (prompt)?",
      a: "Para obter os melhores resultados, seja específico no canal e no público! Ao invés de usar algo genérico como 'Crie uma promoção', tente: 'Crie uma promoção de Dia das Mães focada em hidratação, oferecendo 20% de desconto para quem não vem há 2 meses, com tom alegre e emojis.'"
    }
  ];

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    setResponse('');

    try {
      // 1. Send prompt to Gemini Text Model
      const textReq = await fetch('/api/gemini/generateContent', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey || '' },
         body: JSON.stringify({
            model: "gemini-3.5-flash",
            contents: `Escreva uma mensagem de marketing para o canal ${selectedChannel.toUpperCase()}.
        Negócio: ${config.title}. 
        Nicho: ${config.type}.
        Termo para cliente: ${config.terminology.client}.
        Termo para serviço: ${config.terminology.service}.
        
        Pedido do usuário: ${prompt}
        
        Siga as melhores práticas para o canal ${selectedChannel}. Mantenha a mensagem persuasiva e engajadora. Não inclua conversas extras, responda apenas com a mensagem final.`
         })
      });
      const textData = await textReq.json();
      if (!textReq.ok) throw new Error(textData.error || "Erro na geração");
      
      setResponse(textData.text || "Não foi possível gerar o texto. Tente novamente.");

      // 2. Send image prompt to Gemini Image Model if requested
      if (includeImage && imagePrompt) {
         try {
           const imageRes = await fetch('/api/gemini/generateImages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey || '' },
              body: JSON.stringify({
                 prompt: `Uma imagem de marketing bonita, profissional, fotorealista para postagem em ${selectedChannel}: ${imagePrompt}`
              })
           });
           const imgData = await imageRes.json();
           
           if (!imageRes.ok) throw new Error(imgData.error || "Erro ao gerar imagem");
           
           if (imgData.generatedImages && imgData.generatedImages[0]) {
               const b64 = imgData.generatedImages[0].image.imageBytes || imgData.generatedImages[0].image.base64;
               if (b64) {
                   setGeneratedImage(`data:image/jpeg;base64,${b64}`);
               }
           }
         } catch (imgErr) {
           console.error("Image generation error", imgErr);
           toast.error("Aviso: Falha ao gerar imagem, mas o texto foi gerado.");
         }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Ocorreu um erro: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-8">
      <div className="flex items-end justify-between">
         <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-1 flex items-center gap-3">
              Marketing IA 
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs uppercase tracking-widest font-bold">Beta</span>
            </h1>
            <p className="text-slate-400 text-sm">Gere campanhas e mensagens usando inteligência artificial conectada ao seu negócio.</p>
         </div>
      </div>

      <FeatureGate featureKey="aiAssistant">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
         {/* LEFT: Generator */}
         <div className="glass-card p-6 border-[#1A2C47] flex flex-col">
            <h3 className="text-lg font-semibold tracking-tight text-white mb-6 flex items-center justify-between">
               <span className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  Campaign & Template Studio
               </span>
               <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/20">Active Node</span>
            </h3>

            <div className="space-y-6 flex-1 flex flex-col">
               {/* Predefined Templates */}
               <div>
                  <div className="flex items-center justify-between mb-2">
                     <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 block">Templates Rápidos</label>
                     <button 
                        onClick={handleSaveAsTemplate}
                        className="text-[10px] text-blue-400 hover:underline font-bold"
                     >
                        + Salvar Mensagem como Template
                     </button>
                  </div>
                  <select 
                     value={selectedTemplate}
                     onChange={(e) => handleSelectTemplate(e.target.value)}
                     className="w-full bg-[#0C1627] border border-[#1A2C47] rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                  >
                     <option value="">Selecione um template pronto...</option>
                     {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.segment})</option>
                     ))}
                  </select>
               </div>

               {/* Segment Selection */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">Segmentação de {config.terminology.client}s</label>
                     <select 
                        value={selectedSegment}
                        onChange={(e) => setSelectedSegment(e.target.value)}
                        className="w-full bg-[#0C1627] border border-[#1A2C47] rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                     >
                        <option value="Qualquer">Todos os Clientes</option>
                        <option value="Novos">Novo Cliente (Recente)</option>
                        <option value="Ativos">Ativo (Alta Frequência)</option>
                        <option value="VIP">VIP (Sócio Premium)</option>
                        <option value="Risco de Perda">Risco de Perda (Quase inativo)</option>
                        <option value="Inativo">Inativo (Sem retorno)</option>
                     </select>
                  </div>

                  <div>
                     <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 block">Configuração de Disparo</label>
                     <div className="flex items-center gap-3 h-10">
                        <button 
                           type="button"
                           onClick={() => setIsScheduled(!isScheduled)}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                              isScheduled 
                                 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                 : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                           }`}
                        >
                           {isScheduled ? 'Agendado ✓' : 'Imediato (Live)'}
                        </button>
                        {isScheduled && (
                           <input 
                              type="datetime-local"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="bg-[#0C1627] border border-[#1A2C47] rounded-lg text-[11px] text-white px-2 py-1 outline-none flex-1 font-mono"
                           />
                        )}
                     </div>
                  </div>
               </div>

               <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 block">Canal de Divulgação</label>
                  <div className="grid grid-cols-3 gap-3">
                     <button 
                       onClick={() => setSelectedChannel('whatsapp')}
                       className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${selectedChannel === 'whatsapp' ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-[#0C1627] text-slate-400 border-[#1A2C47] hover:border-[#253B5C]'}`}
                     >
                       <MessageCircle className="w-4 h-4" /> WhatsApp
                     </button>
                     <button 
                       onClick={() => setSelectedChannel('instagram')}
                       className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${selectedChannel === 'instagram' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.1)]' : 'bg-[#0C1627] text-slate-400 border-[#1A2C47] hover:border-[#253B5C]'}`}
                     >
                       <Instagram className="w-4 h-4" /> Instagram
                     </button>
                     <button 
                       onClick={() => setSelectedChannel('email')}
                       className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${selectedChannel === 'email' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-[#0C1627] text-slate-400 border-[#1A2C47] hover:border-[#253B5C]'}`}
                     >
                       <Mail className="w-4 h-4" /> E-mail
                     </button>
                  </div>
               </div>

                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 block">O que você deseja divulgar?</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: Crie uma mensagem curta convidando clientes que não vêm há 30 dias para fazer um pacote promocional..."
                    className="w-full flex-1 min-h-[120px] bg-[#0C1627] border border-[#1A2C47] rounded-xl p-4 text-sm text-white resize-none outline-none focus:border-blue-500 transition-colors placeholder-slate-600 mb-4"
                  />
                  
                  <div className="flex items-center gap-2 mb-3">
                     <div 
                        onClick={() => setIncludeImage(!includeImage)} 
                        className={`w-10 h-5 ${includeImage ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-[#1A2C47]'} rounded-full relative cursor-pointer flex items-center px-1 transition-colors duration-300`}
                     >
                        <div className={`w-3 h-3 ${includeImage ? 'bg-white' : 'bg-slate-500'} rounded-full absolute transition-all duration-300 ${includeImage ? 'right-1' : 'left-1 shadow'}`} />
                     </div>
                     <span className="text-sm font-medium text-slate-300 cursor-pointer" onClick={() => setIncludeImage(!includeImage)}>
                        Incluir Imagem (IA)
                     </span>
                  </div>

                  <AnimatePresence>
                    {includeImage && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                       >
                          <textarea
                             value={imagePrompt}
                             onChange={(e) => setImagePrompt(e.target.value)}
                             placeholder="Ex: Uma imagem de um salão de beleza moderno, luzes neon, foco em um corte feminino..."
                             className="w-full h-[80px] bg-[#0C1627] border border-blue-500/30 rounded-xl p-4 text-sm text-white resize-none outline-none focus:border-blue-500 transition-colors placeholder-slate-600 mb-4"
                          />
                       </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               <div className="flex gap-3">
                  <button className="px-4 py-3 bg-[#1A2C47] text-slate-300 rounded-xl text-sm font-semibold hover:bg-[#253B5C] transition-colors border border-[#253B5C]">
                     Limpar
                  </button>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:shadow-none"
                  >
                     {isGenerating ? (
                       <>
                         <Sparkles className="w-4 h-4 animate-spin" />
                         Gerando...
                       </>
                     ) : (
                       <>
                         <Sparkles className="w-4 h-4" />
                         Gerar Campanha IA
                       </>
                     )}
                  </button>
               </div>
            </div>
         </div>

         {/* RIGHT: Preview & Actions */}
         <div className="glass-card p-6 border-[#1A2C47] flex flex-col">
            <h3 className="text-lg font-semibold tracking-tight text-white mb-6 flex items-center gap-2">
               <Send className="w-5 h-5 text-blue-400" />
               Resultado da Campanha
            </h3>

            <div className="flex-1 bg-[#09111D] border border-[#1A2C47] rounded-2xl p-6 relative overflow-y-auto">
               {!response && !isGenerating && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm text-center p-8">
                    <Sparkles className="w-8 h-8 opacity-20 mb-3" />
                    Descreva o que deseja divulgar e a nossa IA criará um texto persuasivo baseado no seu nicho ({config.title}).
                 </div>
               )}
               {isGenerating && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4"></div>
                    <p className="text-sm text-blue-400 animate-pulse font-medium">Analisando contexto...</p>
                 </div>
               )}
               {response && !isGenerating && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed font-medium"
                 >
                   {generatedImage && (
                      <div 
                        className="mb-4 rounded-xl overflow-hidden shadow-lg border border-[#1A2C47] cursor-pointer relative group"
                        onClick={() => setIsImageModalOpen(true)}
                      >
                         <img src={generatedImage} alt="Generated by AI" className="w-full object-cover max-h-[300px] transition-transform duration-500 group-hover:scale-105" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm">Clique para expandir</span>
                         </div>
                      </div>
                   )}
                   {response}
                 </motion.div>
               )}
            </div>

            <div className="mt-6 flex flex-col gap-3">
               <button 
                 onClick={handleCopy}
                 disabled={!response}
                 className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A2C47] hover:bg-[#253B5C] disabled:bg-[#1A2C47]/50 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all border border-[#253B5C]"
               >
                 <Check className="w-4 h-4" />
                 Copiar Texto
               </button>
               <button 
                 onClick={handleSend}
                 disabled={!response}
                 className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:text-emerald-900 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(5,150,105,0.3)] disabled:shadow-none"
               >
                 <Send className="w-4 h-4" />
                 Disparar para {config.terminology.client}s
               </button>
            </div>
         </div>
      </div>

      {/* AI AUTOMATION TRIGGERS */}
      <div className="glass-card p-6 md:p-8 border-blue-500/30 bg-blue-500/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Bot className="w-32 h-32 text-blue-500" />
         </div>
         
         <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
             <div className="md:w-1/3">
               <h3 className="text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-cyan-400" /> IA de Retenção
               </h3>
               <p className="text-sm text-slate-300 leading-relaxed mb-4">
                 A Inteligência Artificial analisa o comportamento dos clientes para evitar perdas, detecta clientes sumindo e dispara campanhas automáticas.
               </p>
               <button onClick={handleActivateAI} className="text-xs uppercase tracking-widest font-bold px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:scale-105 rounded-lg transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                  Ativar Retenção IA
               </button>
            </div>
            
            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
               <div className="bg-[#1E293B] border border-green-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1 h-full bg-green-500 rounded-r-xl" />
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] uppercase tracking-widest font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-500/20">Motor WhatsApp</span>
                     <div className="w-8 h-4 bg-green-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-0 shadow" />
                     </div>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Confirmação & Lembretes</h4>
                  <p className="text-xs text-slate-400">Envia WhatsApp automático logo após agendar e 2h antes do {config.terminology.service}.</p>
               </div>

               <div className="bg-[#1E293B] border border-cyan-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1 h-full bg-cyan-500 rounded-r-xl" />
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded border border-cyan-500/20">Evento Pós-Venda</span>
                     <div className="w-8 h-4 bg-cyan-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-0 shadow" />
                     </div>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">"Gostou do serviço?"</h4>
                  <p className="text-xs text-slate-400">Pede avaliação com link (NPS) 1 hora após a conclusão do Ticket no PDV.</p>
               </div>

               <div className="bg-[#1E293B] border border-purple-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1 h-full bg-purple-500 rounded-r-xl" />
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] uppercase tracking-widest font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded border border-purple-500/20">Anti-Churn IA</span>
                     <div className="w-8 h-4 bg-purple-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                        <div className="w-4 h-4 bg-white rounded-full absolute right-0 shadow" />
                     </div>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Reativação Automática</h4>
                  <p className="text-xs text-slate-400">"Faz tempo que você não vem". Detecta inatividade e dispara oferta personalizada.</p>
               </div>
               
               <div className="bg-[#050B14]/80 border border-[#1A2C47] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-500/20">Aniversariantes</span>
                     <div className="w-8 h-4 bg-[#1A2C47] rounded-full relative cursor-pointer">
                        <div className="w-4 h-4 bg-slate-500 rounded-full absolute left-0 shadow" />
                     </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-300 mb-1">Campanha de Aniversário</h4>
                  <p className="text-xs text-slate-500">Parabeniza e oferece um presente/desconto na semana do aniversário.</p>
               </div>
            </div>
         </div>
      </div>
      </FeatureGate>

      {/* FAQ SECTION */}
      <div className="glass-card p-8 border-[#1A2C47]">
         <h3 className="text-xl font-semibold tracking-tight text-white mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            Perguntas Frequentes & Boas Práticas
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#0C1627] border border-[#1A2C47] rounded-xl overflow-hidden transition-colors hover:border-[#253B5C]">
                 <button 
                   onClick={() => setOpenFaq(openFaq === index ? null : index)}
                   className="w-full p-5 text-left flex items-start justify-between gap-4 focus:outline-none"
                 >
                    <span className="text-sm font-semibold text-white leading-snug">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-blue-400' : ''}`} />
                 </button>
                 <AnimatePresence>
                   {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                         <div className="p-5 pt-0 text-sm text-slate-400 leading-relaxed border-t border-[#1A2C47]/50 mt-2">
                            {faq.a}
                         </div>
                      </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            ))}
         </div>
      </div>

      <AnimatePresence>
        {isImageModalOpen && generatedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setIsImageModalOpen(false)}
          >
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
               <button 
                 onClick={() => setIsImageModalOpen(false)}
                 className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors border border-white/10"
                 title="Fechar"
               >
                 <X className="w-6 h-6" />
               </button>
               <img src={generatedImage} alt="AI Generated Full" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
               <a 
                 href={generatedImage} 
                 download="campanha-gerada.jpg"
                 className="absolute bottom-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]"
               >
                 <Download className="w-5 h-5" />
                 Fazer Download
               </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
