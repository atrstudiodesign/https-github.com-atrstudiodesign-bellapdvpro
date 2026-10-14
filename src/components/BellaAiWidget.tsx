import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Play,
  RotateCcw,
  Sliders,
  Check,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { voiceNarration, VoicePersona } from '../services/voiceNarrationService';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: Date;
}

export function BellaAiWidget() {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('bella_ai_isOpen');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      const saved = localStorage.getItem('bella_ai_isMinimized');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [message, setMessage] = useState('');
  const [voiceSettings, setVoiceSettings] = useState(() => voiceNarration.getSettings());
  const [voiceState, setVoiceState] = useState({ isSpeaking: false, isListening: false, currentVoice: voiceSettings.voice });
  const [playingMessageIdx, setPlayingMessageIdx] = useState<number | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('bella_ai_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
      }
    } catch (e) {
      console.error('Error loading chat history from local storage:', e);
    }
    return [
      {
        role: 'model',
        parts: [{ text: 'Olá! Sou a **Bella IA**, sua assistente com narração neural em português. 🎙️✨\n\nEstou pronta para analisar suas finanças, gerenciar agendamentos, resgatar clientes ou orientar suas vendas. Você também pode **falar pelo microfone** ou alternar entre a minha voz e a voz do **Gabriel**!' }],
        timestamp: new Date()
      }
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to voice narration service state
  useEffect(() => {
    const unsubscribe = voiceNarration.subscribe((state) => {
      setVoiceState(state);
      if (!state.isSpeaking) {
        setPlayingMessageIdx(null);
      }
    });

    // Custom event listener so other UI parts can trigger Bella
    const handleOpenAi = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('open-bella-ai', handleOpenAi);

    return () => {
      unsubscribe();
      window.removeEventListener('open-bella-ai', handleOpenAi);
    };
  }, []);

  // Persist open/minimized states
  useEffect(() => {
    try {
      localStorage.setItem('bella_ai_isOpen', String(isOpen));
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('bella_ai_isMinimized', String(isMinimized));
    } catch (e) {
      console.error(e);
    }
  }, [isMinimized]);

  // Persist chatHistory state
  useEffect(() => {
    try {
      if (chatHistory.length > 0) {
        localStorage.setItem('bella_ai_chat_history', JSON.stringify(chatHistory));
      } else {
        localStorage.removeItem('bella_ai_chat_history');
      }
    } catch (e) {
      console.error('Error saving chat history to local storage:', e);
    }
  }, [chatHistory]);

  const handleVoiceChange = (voice: VoicePersona) => {
    voiceNarration.updateSettings({ voice });
    setVoiceSettings(voiceNarration.getSettings());
    toast.success(`Voz alterada para: ${voice === 'feminino' ? 'Bella (Feminina)' : 'Gabriel (Masculino)'}`);
    
    // Quick demonstration audio
    const greeting = voice === 'feminino' 
      ? 'Olá! Sou a Bella. Voz feminina ativada com sucesso.' 
      : 'Olá! Sou o Gabriel. Voz executiva masculina ativada.';
    voiceNarration.speak(greeting, { voice });
  };

  const handleSpeedChange = (speed: number) => {
    voiceNarration.updateSettings({ speed });
    setVoiceSettings(voiceNarration.getSettings());
  };

  const handleAutoPlayToggle = () => {
    const next = !voiceSettings.autoPlay;
    voiceNarration.updateSettings({ autoPlay: next });
    setVoiceSettings(voiceNarration.getSettings());
    toast.info(next ? 'Auto-narração ativada' : 'Auto-narração desativada');
  };

  const handleToggleSpeakMessage = (text: string, index: number) => {
    if (voiceState.isSpeaking && playingMessageIdx === index) {
      voiceNarration.stopSpeaking();
      setPlayingMessageIdx(null);
    } else {
      setPlayingMessageIdx(index);
      voiceNarration.speak(text, {
        voice: voiceSettings.voice,
        speed: voiceSettings.speed,
        onEnd: () => setPlayingMessageIdx(null),
      });
    }
  };

  const handleMicClick = () => {
    if (voiceState.isListening) {
      voiceNarration.stopListening();
      return;
    }

    if (!voiceNarration.isSpeechRecognitionSupported()) {
      toast.error('Reconhecimento de voz não suportado neste navegador.', {
        description: 'Tente utilizar o Google Chrome ou Edge.'
      });
      return;
    }

    const started = voiceNarration.startListening({
      onResult: (transcript) => {
        setMessage(transcript);
        toast.success(`Voz capturada: "${transcript}"`);
        handleSendMessage(transcript);
      },
      onError: (err) => {
        toast.error('Erro no microfone', { description: String(err) });
      }
    });

    if (started) {
      toast.info('🎙️ Ouvindo... Fale agora em português!');
    }
  };

  // Suggested prompts based on current page path
  const getContextSuggestions = (pathname: string): string[] => {
    switch (pathname) {
      case '/':
        return [
          'Qual o resumo das finanças e agendamentos de hoje?',
          'Como posso aumentar meu faturamento esta semana?',
          'O que meu ticket médio de R$ 158,30 indica?'
        ];
      case '/pos':
        return [
          'Como aplicar upsell rápido no balcão?',
          'Como agilizar a emissão de nota NFC-e?',
          'Quais combos de produtos e serviços têm mais saída?'
        ];
      case '/schedule':
        return [
          'Como eliminar as faltas de clientes na agenda?',
          'Como encaixar clientes da lista de espera?',
          'Como balancear horários entre os profissionais?'
        ];
      case '/clients':
        return [
          'Script de mensagem de retorno para clientes inativos',
          'Como criar um programa de fidelidade irresistível?',
          'Mensagem de boas-vindas para novos clientes'
        ];
      case '/crm':
        return [
          'Como resgatar clientes da zona de churn?',
          'Ideias para reengajar clientes VIPs',
          'Qual a melhor oferta de reativação pelo WhatsApp?'
        ];
      case '/finance':
        return [
          'Como calcular o ponto de equilíbrio do meu negócio?',
          'Estratégia para reduzir despesas de produtos e insumos',
          'Qual porcentagem ideal de comissão para a equipe?'
        ];
      case '/marketing':
        return [
          'Copy pronta para promoção relâmpago no WhatsApp',
          'Legenda para post de transformação no Instagram',
          'Campanha para dias de menor movimento'
        ];
      default:
        return [
          'Faça um resumo executivo do meu negócio agora',
          'Como motivar e engajar minha equipe?',
          'Como automatizar processos repetitivos?'
        ];
    }
  };

  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/': return 'Dashboard Geral';
      case '/pos': return 'Frente de Caixa (PDV)';
      case '/schedule': return 'Agenda do Salão';
      case '/clients': return 'Gestão de Clientes';
      case '/crm': return 'Funil de Relacionamento';
      case '/professionals': return 'Gestão de Equipe';
      case '/services': return 'Tabela de Serviços';
      case '/finance': return 'Fluxo de Financeiro';
      case '/marketing': return 'Marketing com IA';
      case '/reports': return 'Relatórios e Métricas';
      default: return 'Geral';
    }
  };

  const getContextInstruction = (pathname: string) => {
    const baseInstruction = `Você é a Bella IA (ou Gabriel, caso a voz masculina esteja selecionada), a assistente de inteligência artificial com narração neural oficial integrada ao sistema ERP BellaPDV.
Você é extremamente profissional, carismática, prática e focada no sucesso operacional e financeiro do negócio.
Diretrizes:
- Responda SEMPRE em português do Brasil (pt-BR).
- Seja concisa, dinâmica e objetiva, pois suas respostas podem ser lidas por voz neural. Evite textos gigantescos desnecessários.
- Use pontuação adequada para que a leitura em voz alta soe totalmente natural e humana.
- Se perguntado sobre números, cite com clareza os valores em reais (ex: R$ 24.680,50).`;

    let pageContext = "";
    if (pathname === '/') {
      pageContext = "O usuário está na Dashboard. Faturamento deste mês: R$ 24.680,50, Agendamentos: 156, Clientes ativos: 1.250, Ticket médio: R$ 158,30.";
    } else if (pathname === '/pos') {
      pageContext = "O usuário está na Frente de Caixa (PDV). Forneça dicas rápidas de venda de balcão e conferência de caixa.";
    } else if (pathname === '/schedule') {
      pageContext = "O usuário está na Agenda. Sugira preenchimento de horários vagos e lembretes para evitar cancelamentos.";
    }

    return `${baseInstruction}\n\n[CONTEXTO ATUAL]: Tela "${getPageTitle(pathname)}". ${pageContext}`;
  };

  // Scroll to bottom when messages list updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawMsg = textToSend || message;
    if (!rawMsg.trim() || isLoading) return;

    if (!textToSend) setMessage('');

    const userMessage: Message = {
      role: 'user',
      parts: [{ text: rawMsg }],
      timestamp: new Date()
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const contentsForApi = updatedHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts
      }));

      const response = await fetch('/api/gemini/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contentsForApi,
          model: 'gemini-3.8-flash',
          config: {
            systemInstruction: getContextInstruction(location.pathname),
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor Gemini');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const aiReply = data.text || 'Entendido! Como posso te ajudar a aplicar isso agora?';

      const newMsg: Message = {
        role: 'model',
        parts: [{ text: aiReply }],
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, newMsg]);

      // If autoPlay is enabled, speak the reply immediately
      if (voiceSettings.autoPlay) {
        const newMsgIdx = updatedHistory.length;
        setPlayingMessageIdx(newMsgIdx);
        voiceNarration.speak(aiReply, {
          voice: voiceSettings.voice,
          speed: voiceSettings.speed,
          onEnd: () => setPlayingMessageIdx(null),
        });
      }
    } catch (error: any) {
      console.error('Error calling Bella AI:', error);
      toast.error('Ocorreu um erro ao falar com a Bella AI');
      setChatHistory(prev => [
        ...prev,
        {
          role: 'model',
          parts: [{ text: '⚠️ *Desculpe, tive uma oscilação na conexão.* Pode tentar novamente em alguns instantes?' }],
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja limpar o histórico do chat com a assistente?')) {
      voiceNarration.stopSpeaking();
      setChatHistory([
        {
          role: 'model',
          parts: [{ text: 'Histórico redefinido! Pronto para nova conversa com narração neural. ✨' }],
          timestamp: new Date()
        }
      ]);
    }
  };

  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let content = line;
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-slate-300 leading-relaxed mb-1"
              dangerouslySetInnerHTML={{ __html: content.trim().substring(2) }} />
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-300 leading-relaxed mb-1.5"
           dangerouslySetInnerHTML={{ __html: content }} />
      );
    });
  };

  return (
    <>
      {/* FLOATING ACTION TRIGGER */}
      <div className="fixed bottom-28 right-6 z-50">
        <button 
          id="bella-ai-fab"
          onClick={() => {
            setIsOpen(!isOpen);
            setIsMinimized(false);
          }}
          className="group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-cyan-950 via-[#0B1528] to-indigo-950 border border-cyan-500/50 rounded-full shadow-[0_0_25px_rgba(34,211,238,0.35)] hover:scale-105 hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all cursor-pointer relative"
          title="Falar com Assistente IA (Voz Neural)"
        >
          {voiceState.isSpeaking ? (
            // Equalizer animation when speaking
            <div className="flex items-center gap-1 z-10">
              <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-6 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-3 bg-cyan-300 rounded-full animate-bounce" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-ping opacity-60 pointer-events-none" />
              <Bot className="w-6 h-6 text-cyan-400 relative z-10" />
            </>
          )}
          
          <div className="absolute -top-1 bg-[#10192e] border border-cyan-500/40 text-[9px] text-cyan-300 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider scale-90 shadow-lg flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 text-cyan-400" />
            VOZ
          </div>

          <div className="absolute -top-12 -right-2 bg-[#0C1627] border border-[#1A2C47] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs text-white shadow-xl pointer-events-none hidden md:block">
            Assistente com Narração Neural (PT-BR)
          </div>
        </button>
      </div>

      {/* CHAT MAIN INTERFACE WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="bella-ai-chat-window"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '52px' : '560px',
              width: '380px'
            }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-44 right-6 z-[100] bg-[#0E1629]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col w-[380px] max-w-[calc(100vw-2rem)]"
          >
            {/* PANEL HEADER */}
            <div className="bg-[#09111F]/95 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-inner">
                    <Bot className="w-4 h-4 text-black font-bold" />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#09111F] ${voiceState.isSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white tracking-wide flex items-center gap-1.5">
                    Assistente IA
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono font-medium">
                      {voiceSettings.voice === 'feminino' ? 'Bella 👩' : 'Gabriel 👨'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {voiceState.isSpeaking ? (
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        <Volume2 className="w-3 h-3 animate-pulse" /> Narrando em Português...
                      </span>
                    ) : (
                      'Voz neural humanizada PT-BR'
                    )}
                  </span>
                </div>
              </div>

              {/* ACTION COMMANDS */}
              <div className="flex items-center gap-1">
                {/* Voice Settings Dropdown Toggle */}
                <button
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className={`p-1.5 rounded transition-colors ${showVoiceSettings ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  title="Ajustes de Voz"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
                <button
                  id="bella-clear-chat"
                  onClick={handleClearHistory}
                  className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  id="bella-ai-toggle-minimize"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title={isMinimized ? 'Expandir' : 'Minimizar'}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  id="bella-close-chat"
                  onClick={() => {
                    voiceNarration.stopSpeaking();
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Fechar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* EXPANDED PANEL CONTENT */}
            {!isMinimized && (
              <>
                {/* VOICE SETTINGS DRAWER */}
                <AnimatePresence>
                  {showVoiceSettings && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-[#070D18] border-b border-cyan-500/20 p-3 space-y-2.5 text-xs overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Voz Narradora:</span>
                        <div className="flex gap-1.5 bg-[#101A2D] p-1 rounded-lg border border-white/5">
                          <button
                            onClick={() => handleVoiceChange('feminino')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              voiceSettings.voice === 'feminino' 
                                ? 'bg-cyan-500 text-black shadow' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            👩 Bella
                          </button>
                          <button
                            onClick={() => handleVoiceChange('masculino')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                              voiceSettings.voice === 'masculino' 
                                ? 'bg-cyan-500 text-black shadow' 
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            👨 Gabriel
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-slate-400 font-medium">Velocidade:</span>
                        <div className="flex gap-1">
                          {[0.9, 1.0, 1.25].map(rate => (
                            <button
                              key={rate}
                              onClick={() => handleSpeedChange(rate)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                                voiceSettings.speed === rate 
                                  ? 'bg-white/20 text-white font-bold border border-cyan-400/40' 
                                  : 'text-slate-400 hover:bg-white/5'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-slate-400 font-medium">Auto-narrar Respostas:</span>
                        <button
                          onClick={handleAutoPlayToggle}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all ${
                            voiceSettings.autoPlay 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {voiceSettings.autoPlay ? 'Ativado' : 'Desativado'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ACTIVE NARRATION BAR (when speaking) */}
                {voiceState.isSpeaking && (
                  <div className="bg-gradient-to-r from-cyan-950/70 to-indigo-950/70 px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-2 bg-cyan-300 rounded-full animate-bounce" />
                      </div>
                      <span className="text-[11px] font-medium">
                        Narrando com voz de <strong>{voiceSettings.voice === 'feminino' ? 'Bella' : 'Gabriel'}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => voiceNarration.stopSpeaking()}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10px] font-semibold transition-colors"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" /> Parar Áudio
                    </button>
                  </div>
                )}

                {/* ACTIVE PATH BADGE */}
                <div className="bg-cyan-950/20 px-4 py-1.5 border-b border-cyan-500/10 flex items-center justify-between text-[10px] text-cyan-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Contexto: <strong>{getPageTitle(location.pathname)}</strong></span>
                  </div>
                  <span className="text-slate-400 text-[9px]">Model: Gemini 3.8</span>
                </div>

                {/* MESSAGES VIEW */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/10 scrollbar-track-transparent">
                  {chatHistory.map((msg, index) => {
                    const isAi = msg.role === 'model';
                    const isThisPlaying = voiceState.isSpeaking && playingMessageIdx === index;

                    return (
                      <div
                        key={index}
                        className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                      >
                        {isAi && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                            isAi
                              ? `bg-[#151D30]/90 text-slate-300 rounded-tl-none border ${isThisPlaying ? 'border-cyan-500/60 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-white/5'} leading-relaxed`
                              : 'bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white rounded-tr-none font-medium'
                          }`}
                        >
                          {formatMarkdown(msg.parts[0].text)}

                          {/* Message Footer with Audio Narration Controls */}
                          <div className={`mt-2 pt-1 border-t ${isAi ? 'border-white/5' : 'border-white/10'} flex items-center justify-between text-[9px]`}>
                            <span className={isAi ? 'text-slate-500' : 'text-cyan-200/70'}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {isAi && (
                              <button
                                onClick={() => handleToggleSpeakMessage(msg.parts[0].text, index)}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all font-semibold ${
                                  isThisPlaying 
                                    ? 'bg-cyan-500 text-black shadow' 
                                    : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                                }`}
                                title={isThisPlaying ? 'Pausar/Parar Narração' : 'Ouvir Narração com Voz Neural'}
                              >
                                {isThisPlaying ? (
                                  <>
                                    <Square className="w-2.5 h-2.5 fill-current" />
                                    <span>Parar</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3 h-3" />
                                    <span>Ouvir</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* TYPING LOADER */}
                  {isTyping && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-6 h-6 rounded-full bg-cyan-700 flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-[#151D30] text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs border border-white/5 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>Bella está elaborando a resposta...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* SUGGESTIONS FIELD */}
                {chatHistory.length <= 3 && !isLoading && (
                  <div className="p-3 border-t border-white/5 bg-[#080E1D] space-y-2">
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pl-1">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Perguntas frequentes para ouvir:
                    </p>
                    <div className="flex flex-col gap-1.5 max-h-[85px] overflow-y-auto">
                      {getContextSuggestions(location.pathname).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(suggestion)}
                          className="w-full text-left text-[11px] text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/15 py-1.5 px-2.5 rounded-lg transition-all truncate hover:text-cyan-200 flex items-center justify-between group"
                        >
                          <span className="truncate">{suggestion}</span>
                          <Volume2 className="w-3 h-3 text-cyan-500/50 group-hover:text-cyan-400 flex-shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOTTOM CHAT INPUT BAR WITH MIC & SEND */}
                <div className="p-3 border-t border-white/5 bg-[#09111F]/95 flex items-center gap-2">
                  <button
                    onClick={handleMicClick}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      voiceState.isListening
                        ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                        : 'bg-[#141C2F] border-white/10 text-cyan-400 hover:text-white hover:border-cyan-500/50'
                    }`}
                    title={voiceState.isListening ? 'Clique para parar' : 'Falar pelo Microfone (Português)'}
                  >
                    {voiceState.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    id="bella-input-text"
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    placeholder={voiceState.isListening ? 'Ouvindo... Pode falar agora!' : 'Faça uma pergunta ou comando...'}
                    className={`flex-1 bg-[#141C2F] border rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all ${
                      voiceState.isListening ? 'border-red-500/60 ring-1 ring-red-500/30' : 'border-white/10 focus:border-cyan-500/50'
                    }`}
                    disabled={isLoading}
                    autoComplete="off"
                  />

                  <button
                    id="bella-btn-submit"
                    onClick={() => handleSendMessage()}
                    className="p-2.5 bg-gradient-to-tr from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
                    disabled={isLoading || !message.trim()}
                    title="Enviar pergunta"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
