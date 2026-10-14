import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Zap,
  Headphones,
  ArrowRight,
  ShoppingCart,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { voiceNarration, VoicePersona, VoiceEngineMode } from '../services/voiceNarrationService';
import { systemOperator, SystemAction, QUICK_CATALOG_ITEMS } from '../services/systemOperatorService';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
  timestamp: Date;
  actions?: SystemAction[];
}

export function BellaAiWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceSettings, setVoiceSettings] = useState(() => voiceNarration.getSettings());
  const [voiceState, setVoiceState] = useState({ 
    isSpeaking: false, 
    isListening: false, 
    currentVoice: voiceSettings.voice,
    interimTranscript: ''
  });
  const [playingMessageIdx, setPlayingMessageIdx] = useState<number | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(() => voiceSettings.handsFree);

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
        parts: [{ 
          text: 'Olá, operador! Sou a **Bella IA**, sua copiloto integrada ao sistema BellaPDV. 🎙️⚡\n\nFale comigo pelo microfone para **abrir o PDV**, **consultar vendas de hoje**, **conferir agendamentos**, **adicionar itens ao carrinho** ou **tirar dúvidas operacionais** em tempo real!' 
        }],
        actions: [
          { id: 'act-1', label: '🛒 Abrir PDV', type: 'NAVIGATE', payload: { path: '/pos' } },
          { id: 'act-2', label: '📊 Vendas de Hoje', type: 'TRIGGER_AI', payload: { query: 'Quanto vendemos hoje?' } },
          { id: 'act-3', label: '📅 Ver Agenda', type: 'NAVIGATE', payload: { path: '/schedule' } }
        ],
        timestamp: new Date()
      }
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Subscribe to voice narration state
  useEffect(() => {
    const unsubscribe = voiceNarration.subscribe((state) => {
      setVoiceState(state);
      if (state.interimTranscript) {
        setLiveTranscript(state.interimTranscript);
      }
      if (!state.isSpeaking) {
        setPlayingMessageIdx(null);
      }
    });

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

  // Persist states
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
    
    const greeting = voice === 'feminino' 
      ? 'Olá! Sou a Bella. Voz feminina ativada com resposta instantânea.' 
      : 'Olá! Sou o Gabriel. Voz executiva masculina ativada.';
    voiceNarration.speak(greeting, { voice, mode: voiceSettings.engineMode });
  };

  const handleEngineModeToggle = () => {
    const nextMode: VoiceEngineMode = voiceSettings.engineMode === 'instant' ? 'neural' : 'instant';
    voiceNarration.updateSettings({ engineMode: nextMode });
    setVoiceSettings(voiceNarration.getSettings());
    toast.success(nextMode === 'instant' 
      ? '⚡ Modo Ultrarrápido ativado (Resposta Instantânea 0s)' 
      : '🎙️ Modo Estúdio Neural ativado'
    );
  };

  const handleHandsFreeToggle = () => {
    const next = !handsFreeMode;
    setHandsFreeMode(next);
    voiceNarration.updateSettings({ handsFree: next });
    setVoiceSettings(voiceNarration.getSettings());
    toast.info(next ? '🎧 Modo Operador Mãos Livres ATIVADO (Escuta Contínua)' : 'Modo Mãos Livres Desativado');
    if (next && !voiceState.isListening) {
      handleStartListening();
    }
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
        mode: voiceSettings.engineMode,
        onEnd: () => setPlayingMessageIdx(null),
      });
    }
  };

  const handleStartListening = () => {
    if (!voiceNarration.isSpeechRecognitionSupported()) {
      toast.error('Reconhecimento de voz não suportado neste navegador.', {
        description: 'Tente utilizar o Google Chrome ou Edge.'
      });
      return;
    }

    setLiveTranscript('');
    const started = voiceNarration.startListening({
      onInterim: (interim) => {
        setLiveTranscript(interim);
      },
      onResult: (transcript) => {
        setLiveTranscript('');
        setMessage(transcript);
        toast.success(`Comando de voz: "${transcript}"`);
        handleSendMessage(transcript);
      },
      onError: (err) => {
        setLiveTranscript('');
        if (err !== 'no-speech') {
          toast.error('Erro no microfone', { description: String(err) });
        }
      },
      onEnd: () => {
        setLiveTranscript('');
      }
    });

    if (started) {
      toast.info('🎙️ Ouvindo... Pode falar agora em português!');
    }
  };

  const handleMicClick = () => {
    if (voiceState.isListening) {
      voiceNarration.stopListening();
      setLiveTranscript('');
    } else {
      handleStartListening();
    }
  };

  // Execute system action from interactive badge or voice
  const handleExecuteAction = (action: SystemAction) => {
    if (action.type === 'TRIGGER_AI' && action.payload?.query) {
      handleSendMessage(action.payload.query);
      return;
    }
    systemOperator.executeAction(action, navigate);
    toast.success(`Ação executada: ${action.label}`);
  };

  // Main Send & Voice Response Handler
  const handleSendMessage = async (textToSend?: string) => {
    const rawMsg = textToSend || message;
    if (!rawMsg.trim() || isLoading) return;

    if (!textToSend) setMessage('');
    setLiveTranscript('');

    const userMessage: Message = {
      role: 'user',
      parts: [{ text: rawMsg }],
      timestamp: new Date()
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setIsLoading(true);
    setIsTyping(true);

    // 1. FAST INTENT RESOLUTION: Check direct system operator actions (0ms zero-wait!)
    const opResult = systemOperator.evaluateOperatorIntent(rawMsg, navigate);
    if (opResult.handled) {
      const aiReply = opResult.reply;
      const spokenText = opResult.spokenText || aiReply;

      const newMsg: Message = {
        role: 'model',
        parts: [{ text: aiReply }],
        actions: opResult.actions,
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, newMsg]);
      setIsLoading(false);
      setIsTyping(false);

      if (voiceSettings.autoPlay) {
        const newMsgIdx = updatedHistory.length;
        setPlayingMessageIdx(newMsgIdx);
        voiceNarration.speak(spokenText, {
          voice: voiceSettings.voice,
          speed: voiceSettings.speed,
          mode: voiceSettings.engineMode,
          onEnd: () => {
            setPlayingMessageIdx(null);
            if (handsFreeMode) {
              setTimeout(() => handleStartListening(), 400);
            }
          },
        });
      }
      return;
    }

    // 2. GENERAL AI CONSULTATION: Request Gemini with high-resilience model sequence
    try {
      const snapshot = systemOperator.getSystemSnapshot();
      const liveContext = `[ESTADO ATUAL DO SISTEMA]: Faturamento: R$ ${snapshot.revenueToday.toFixed(2)}, Vendas: ${snapshot.salesCount}, Clientes ativos: ${snapshot.activeClients}, Agendamentos hoje: ${snapshot.appointmentsToday}, Próximo: ${snapshot.nextAppointment.client} às ${snapshot.nextAppointment.time}.`;

      const contentsForApi = updatedHistory.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts
      }));

      const response = await fetch('/api/gemini/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: contentsForApi,
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: `${getContextInstruction(location.pathname)}\n\n${liveContext}`,
            temperature: 0.6,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor');
      }

      const data = await response.json();
      const aiReply = data.text || 'Entendido! O que deseja executar no sistema agora?';

      const newMsg: Message = {
        role: 'model',
        parts: [{ text: aiReply }],
        actions: [
          { id: '1', label: '🛒 Abrir PDV', type: 'NAVIGATE', payload: { path: '/pos' } },
          { id: '2', label: '📅 Ver Agenda', type: 'NAVIGATE', payload: { path: '/schedule' } }
        ],
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, newMsg]);

      if (voiceSettings.autoPlay) {
        const newMsgIdx = updatedHistory.length;
        setPlayingMessageIdx(newMsgIdx);
        voiceNarration.speak(aiReply, {
          voice: voiceSettings.voice,
          speed: voiceSettings.speed,
          mode: voiceSettings.engineMode,
          onEnd: () => {
            setPlayingMessageIdx(null);
            if (handsFreeMode) {
              setTimeout(() => handleStartListening(), 400);
            }
          },
        });
      }
    } catch (error: any) {
      console.warn('Graceful AI Fallback triggered:', error);
      const snapshot = systemOperator.getSystemSnapshot();
      const fallbackReply = `Estou conectada e pronta para operar! Hoje já registramos **R$ ${snapshot.revenueToday.toFixed(2)}** em vendas e temos **${snapshot.appointmentsToday} agendamentos**. Posso abrir a Frente de Caixa, cadastrar clientes ou gerenciar a agenda agora mesmo.`;

      const fallbackMsg: Message = {
        role: 'model',
        parts: [{ text: fallbackReply }],
        actions: [
          { id: '1', label: '🛒 Abrir PDV Agora', type: 'NAVIGATE', payload: { path: '/pos' } },
          { id: '2', label: '📅 Ver Agenda', type: 'NAVIGATE', payload: { path: '/schedule' } },
          { id: '3', label: '💵 Abrir Gaveta', type: 'OPEN_DRAWER' }
        ],
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, fallbackMsg]);

      if (voiceSettings.autoPlay) {
        voiceNarration.speak('Estou conectada e pronta para operar! O que deseja executar agora no BellaPDV?', {
          voice: voiceSettings.voice,
          speed: voiceSettings.speed,
          mode: voiceSettings.engineMode,
          onEnd: () => {
            if (handsFreeMode) {
              setTimeout(() => handleStartListening(), 400);
            }
          }
        });
      }
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
          parts: [{ text: 'Histórico redefinido! Pronto para novas orientações e comandos operacionais. ⚡' }],
          actions: [
            { id: 'act-1', label: '🛒 Abrir PDV', type: 'NAVIGATE', payload: { path: '/pos' } },
            { id: 'act-2', label: '📊 Vendas de Hoje', type: 'TRIGGER_AI', payload: { query: 'Quanto vendemos hoje?' } }
          ],
          timestamp: new Date()
        }
      ]);
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
    return `Você é a Bella IA (ou Gabriel), a assistente de voz e copiloto oficial integrada ao sistema ERP BellaPDV.
Você interage diretamente com o operador de caixa, barbeiro ou gerente.
Diretrizes:
- Responda SEMPRE em português do Brasil (pt-BR) de forma direta, ágil e concisa, ideal para áudio.
- Se o operador pedir ações (como abrir caixa, agenda ou relatórios), confirme objetivamente.
- Valores monetários devem ser citados claramente (ex: R$ 24.680,50).`;
  };

  const getContextSuggestions = (pathname: string): string[] => {
    switch (pathname) {
      case '/pos':
        return [
          'Adicionar corte degradê no carrinho',
          'Abrir gaveta do caixa',
          'Quanto vendemos hoje no balcão?'
        ];
      case '/schedule':
        return [
          'Quem é o próximo cliente agendado?',
          'Quantos agendamentos temos para hoje?',
          'Como evitar cancelamentos de clientes?'
        ];
      default:
        return [
          'Abre o PDV agora',
          'Quanto vendemos hoje?',
          'Quem é o próximo cliente na agenda?'
        ];
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
      return (
        <p key={idx} className="mb-1.5 last:mb-0 leading-relaxed" 
           dangerouslySetInnerHTML={{ __html: content }} />
      );
    });
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping, liveTranscript]);

  return (
    <>
      {/* FLOATING ACTION TRIGGER BUTTON */}
      <div className="fixed bottom-24 right-6 z-40 flex items-center">
        <button
          id="bella-ai-floating-trigger"
          onClick={() => {
            setIsOpen(!isOpen);
            if (isMinimized) setIsMinimized(false);
          }}
          className={`relative group p-4 rounded-2xl shadow-[0_10px_35px_rgba(34,211,238,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ${
            voiceState.isSpeaking 
              ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-600 text-black ring-4 ring-cyan-400/50' 
              : voiceState.isListening
              ? 'bg-red-500 text-white ring-4 ring-red-400/50 animate-pulse'
              : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white'
          }`}
          title="Assistente de Voz Bella IA"
        >
          {voiceState.isListening ? (
            <Mic className="w-7 h-7 text-white animate-bounce" />
          ) : voiceState.isSpeaking ? (
            <Volume2 className="w-7 h-7 text-black animate-pulse" />
          ) : (
            <Bot className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />
          )}

          {/* Hands-Free Indicator */}
          {handsFreeMode && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-black shadow">
              MÃOS LIVRES
            </span>
          )}

          {/* Voice Indicator Badge */}
          <div className="absolute -bottom-2 bg-[#09111F] text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/40 shadow-md flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-cyan-400" />
            0s
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
              height: isMinimized ? '52px' : '580px',
              width: '400px'
            }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-44 right-6 z-[100] bg-[#0E1629]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col w-[400px] max-w-[calc(100vw-2rem)]"
          >
            {/* PANEL HEADER */}
            <div className="bg-[#09111F]/95 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-inner">
                    <Bot className="w-4 h-4 text-black font-bold" />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#09111F] ${
                    voiceState.isListening ? 'bg-red-500 animate-ping' : voiceState.isSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500'
                  }`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white tracking-wide flex items-center gap-1.5">
                    Assistente do Operador
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono font-medium">
                      {voiceSettings.voice === 'feminino' ? 'Bella 👩' : 'Gabriel 👨'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {voiceState.isListening ? (
                      <span className="text-red-400 font-semibold flex items-center gap-1 animate-pulse">
                        <Mic className="w-3 h-3" /> Ouvindo você em tempo real...
                      </span>
                    ) : voiceState.isSpeaking ? (
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        <Volume2 className="w-3 h-3 animate-pulse" /> Respondendo em Português...
                      </span>
                    ) : (
                      'Interação com sistema e operador pronta'
                    )}
                  </span>
                </div>
              </div>

              {/* ACTION COMMANDS */}
              <div className="flex items-center gap-1">
                {/* Hands-free toggle */}
                <button
                  onClick={handleHandsFreeToggle}
                  className={`p-1.5 rounded transition-colors ${handsFreeMode ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  title={handsFreeMode ? 'Mãos Livres Ativo (Escuta Contínua)' : 'Ativar Modo Mãos Livres'}
                >
                  <Headphones className="w-3.5 h-3.5" />
                </button>

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
                  id="bella-ai-close"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Fechar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* VOICE SETTINGS POPUP */}
                <AnimatePresence>
                  {showVoiceSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-[#0B1322] border-b border-cyan-500/20 px-4 py-3 space-y-3 text-xs overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">Voz da Assistente:</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleVoiceChange('feminino')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                              voiceSettings.voice === 'feminino' 
                                ? 'bg-cyan-500 text-black shadow' 
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            👩 Bella
                          </button>
                          <button
                            onClick={() => handleVoiceChange('masculino')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                              voiceSettings.voice === 'masculino' 
                                ? 'bg-cyan-500 text-black shadow' 
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            👨 Gabriel
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-slate-300 font-medium">Motor de Resposta:</span>
                        <button
                          onClick={handleEngineModeToggle}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                            voiceSettings.engineMode === 'instant' 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          {voiceSettings.engineMode === 'instant' ? '⚡ 0s Instantâneo' : '🎙️ Estúdio Neural'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-slate-300 font-medium">Modo Mãos Livres:</span>
                        <button
                          onClick={handleHandsFreeToggle}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                            handsFreeMode 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Headphones className="w-3 h-3" />
                          {handsFreeMode ? 'Ativo (Escuta Contínua)' : 'Desativado'}
                        </button>
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

                {/* ACTIVE NARRATION BAR */}
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

                {/* ACTIVE PATH & SPEED BADGE */}
                <div className="bg-cyan-950/20 px-4 py-1.5 border-b border-cyan-500/10 flex items-center justify-between text-[10px] text-cyan-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Tela: <strong>{getPageTitle(location.pathname)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" /> 0s Resposta
                    </span>
                  </div>
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

                          {/* INTERACTIVE ACTION BUTTONS */}
                          {isAi && msg.actions && msg.actions.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                              {msg.actions.map((act) => (
                                <button
                                  key={act.id}
                                  onClick={() => handleExecuteAction(act)}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98 shadow-sm cursor-pointer"
                                >
                                  <span>{act.label}</span>
                                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Message Footer with Audio Controls */}
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
                                title={isThisPlaying ? 'Pausar/Parar' : 'Ouvir Narração'}
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
                        <span>Bella está executando o comando...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* SUGGESTIONS QUICK BAR */}
                {chatHistory.length <= 4 && !isLoading && (
                  <div className="p-2.5 border-t border-white/5 bg-[#080E1D] space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 pl-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Comandos rápidos por voz ou clique:
                    </p>
                    <div className="flex flex-col gap-1 max-h-[75px] overflow-y-auto">
                      {getContextSuggestions(location.pathname).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(suggestion)}
                          className="w-full text-left text-[11px] text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/15 py-1 px-2.5 rounded-lg transition-all truncate hover:text-cyan-200 flex items-center justify-between group"
                        >
                          <span className="truncate">{suggestion}</span>
                          <ArrowRight className="w-3 h-3 text-cyan-500/50 group-hover:text-cyan-400 flex-shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* LIVE SPEECH INTERIM PREVIEW (TRANSCRIÇÃO AO VIVO) */}
                {voiceState.isListening && (
                  <div className="px-4 py-2 bg-red-950/40 border-t border-red-500/30 flex items-center gap-2 text-xs text-red-200 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-semibold text-red-300">Ouvindo:</span>
                    <span className="truncate italic font-medium">{liveTranscript || 'Fale seu comando agora...'}</span>
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
                    placeholder={
                      voiceState.isListening 
                        ? (liveTranscript || 'Ouvindo... Pode falar!') 
                        : 'Ex: "Abre o PDV", "Vendas de hoje", "Adicionar corte degradê"...'
                    }
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
