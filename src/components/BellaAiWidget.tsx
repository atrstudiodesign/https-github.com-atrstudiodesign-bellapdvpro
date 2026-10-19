import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Trash2,
  Mic, 
  MicOff,
  Volume2, 
  Square,
  Sliders,
  Zap,
  Headphones,
  ArrowRight,
  Radio,
  VolumeX,
  Compass
} from 'lucide-react';
import { toast } from 'sonner';
import { voiceNarration, VoicePersona, VoiceEngineMode } from '../services/voiceNarrationService';
import { systemOperator, SystemAction } from '../services/systemOperatorService';

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

  // Dedicated Neural Voice Screen Mode
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);

  const [message, setMessage] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceSettings, setVoiceSettings] = useState(() => voiceNarration.getSettings());
  const [voiceState, setVoiceState] = useState(() => ({ 
    isSpeaking: false, 
    isListening: false, 
    currentVoice: voiceSettings.voice,
    interimTranscript: '',
    volumeLevel: 0,
    frequencyData: new Array(12).fill(0),
    engine: voiceSettings.engineMode,
  }));
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
          text: 'Olá, operador! Sou a **Bella IA**, sua copiloto neural integrada ao sistema BellaPDV. 🎙️⚡\n\nFale comigo pelo microfone para **abrir o PDV**, **consultar vendas de hoje**, **conferir agendamentos**, **adicionar itens ao carrinho** ou **tirar dúvidas operacionais** em tempo real!' 
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
    const isJarvis = voice === 'masculino';
    toast.success(`Voz alterada para: ${isJarvis ? 'Jarvis (Masculino Humanizado)' : 'Bella (Feminina Natural)'}`);
    
    const greeting = isJarvis 
      ? 'Olá! Sou o Jarvis, com voz humanizada e natural. Estou pronto para ajudar você em todo o sistema.'
      : 'Olá! Sou a Bella, sua assistente pessoal humanizada. Como posso ajudar você hoje?';
    voiceNarration.speak(greeting, { voice, mode: voiceSettings.engineMode });
  };

  const handleTestVoice = () => {
    voiceNarration.testVoice();
    toast.info('Reproduzindo amostra da voz humanizada...');
  };

  const handleEngineModeToggle = () => {
    const nextMode: VoiceEngineMode = 
      voiceSettings.engineMode === 'neural' ? 'humanized' : 
      voiceSettings.engineMode === 'humanized' ? 'instant' : 'neural';
    voiceNarration.updateSettings({ engineMode: nextMode });
    setVoiceSettings(voiceNarration.getSettings());
    toast.success(
      nextMode === 'neural'
        ? '🎙️ Voz Neural Gemini 3.8 ativada (Áudio de alta fidelidade natural)'
        : nextMode === 'humanized'
        ? '✨ Voz Humanizada Local ativada'
        : '⚡ Modo Instantâneo 0s ativado'
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
        handleSendMessage(transcript);
      },
      onError: (err) => {
        setLiveTranscript('');
        if (err !== 'no-speech') {
          console.warn('SpeechRecognition error:', err);
        }
      },
      onEnd: () => {
        setLiveTranscript('');
      }
    });

    if (started) {
      // Audio chime plays via voiceNarration.startListening
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
              setTimeout(() => handleStartListening(), 350);
            }
          },
        });
      }
      return;
    }

    // 2. GENERAL AI CONSULTATION: Request Gemini with high-resilience model sequence & strict 2.5s timeout
    try {
      const snapshot = systemOperator.getSystemSnapshot();
      const liveContext = `[DADOS ATUAIS DO SISTEMA EM TEMPO REAL]: Faturamento: R$ ${snapshot.revenueToday.toFixed(2)}, Total de Vendas: ${snapshot.salesCount}, Clientes ativos: ${snapshot.activeClients}, Agendamentos hoje: ${snapshot.appointmentsToday}, Próximo: ${snapshot.nextAppointment.client} às ${snapshot.nextAppointment.time} com ${snapshot.nextAppointment.employee}. Profissionais: ${snapshot.professionalsList}.`;

      const contentsForApi = updatedHistory.slice(-6).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: msg.parts
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const { auth } = await import('../lib/firebase');
      const storedSupabase = (() => {
        try { return JSON.parse(sessionStorage.getItem('bella_supabase_session') || 'null'); }
        catch { return null; }
      })();
      const bearer = storedSupabase?.token ||
        (auth.currentUser && !auth.currentUser.isAnonymous ? await auth.currentUser.getIdToken() : null);
      if (!bearer) throw new Error('Sessão válida necessária para Bella IA');
      const response = await fetch('/api/gemini/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer },
        body: JSON.stringify({
          contents: contentsForApi,
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: `${getContextInstruction(location.pathname)}\n\n${liveContext}`,
            temperature: 0.6,
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
              setTimeout(() => handleStartListening(), 350);
            }
          },
        });
      }
    } catch {
      // Instant intelligent fallback enriched with live system context so the operator is NEVER left waiting!
      const snapshot = systemOperator.getSystemSnapshot();
      const fallbackReply = `Estou conectada e pronta para operar! Hoje já faturamos **${systemOperator.formatCurrency(snapshot.revenueToday)}** com **${snapshot.appointmentsToday} agendamentos** confirmados. Posso abrir a Frente de Caixa, registrar uma venda, abrir a gaveta ou consultar a agenda agora mesmo.`;
      const spokenFallback = `Estou conectada e pronta para operar! Hoje já faturamos ${systemOperator.formatCurrency(snapshot.revenueToday)} com ${snapshot.appointmentsToday} agendamentos. Deseja abrir a frente de caixa ou conferir a agenda?`;

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
        voiceNarration.speak(spokenFallback, {
          voice: voiceSettings.voice,
          speed: voiceSettings.speed,
          mode: voiceSettings.engineMode,
          onEnd: () => {
            if (handsFreeMode) {
              setTimeout(() => handleStartListening(), 350);
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
    toast.success('Histórico do chat limpo');
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
      case '/finance': return 'Fluxo Financeiro';
      case '/marketing': return 'Marketing com IA';
      case '/reports': return 'Relatórios e Métricas';
      default: return 'Geral';
    }
  };

  const getContextInstruction = (_pathname: string) => {
    return `Você é a Bella IA (ou Gabriel), copiloto de voz oficial do sistema BellaPDV para barbearias, salões de beleza e clínicas de estética.
Você conversa diretamente com o operador de caixa, barbeiro ou gerente.
Diretrizes:
- Responda em português do Brasil (pt-BR) de forma humana, natural, calorosa e concisa (máximo 2 a 3 frases).
- Nunca diga que houve oscilação ou que você não tem acesso: você está 100% conectada ao sistema e sabe o faturamento, agendamentos e clientes.
- Confirme ações operacionais (abertura de caixa, agenda, gaveta) com agilidade.`;
  };

  const getContextSuggestions = (pathname: string): string[] => {
    switch (pathname) {
      case '/pos':
        return [
          'Adicionar corte degradê no carrinho',
          'Abrir gaveta do caixa',
          'Finalizar venda no Pix',
          'Quanto vendemos hoje?'
        ];
      case '/schedule':
        return [
          'Quem é o próximo cliente agendado?',
          'Quantos agendamentos temos para hoje?',
          'Confirmar agendamentos no WhatsApp'
        ];
      default:
        return [
          'Abre o PDV agora',
          'Quanto vendemos hoje?',
          'Quem é o próximo cliente na agenda?',
          'Abrir gaveta do caixa'
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

  const lastAiMessage = [...chatHistory].reverse().find(m => m.role === 'model');

  return (
    <>
      {/* FLOATING ACTION TRIGGER BUTTON */}
      <div className="fixed bottom-24 right-6 z-40 flex items-center gap-2">
        {/* Instant Neural Voice Chat Button */}
        <button
          id="bella-voice-mode-trigger"
          onClick={() => {
            setIsVoiceChatMode(true);
            setIsOpen(false);
            if (!voiceState.isListening) {
              handleStartListening();
            }
          }}
          className="relative group px-3.5 py-2.5 rounded-2xl bg-[#0F172A]/90 hover:bg-[#1E293B] border border-cyan-500/40 text-cyan-300 shadow-[0_8px_25px_rgba(34,211,238,0.25)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer backdrop-blur-md"
          title="Abrir Chat de Voz Neural Instantâneo"
        >
          <div className="relative">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">Voz Neural 0s</span>
        </button>

        {/* Floating Panel Trigger */}
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

      {/* FULL-SCREEN / DEDICATED NEURAL VOICE CHAT MODAL */}
      <AnimatePresence>
        {isVoiceChatMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] bg-[#070D1B]/90 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-10"
          >
            {/* Header */}
            <div className="w-full max-w-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Chat de Voz Humanizado & Operador
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      0s Latência
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Falando com <strong>{voiceSettings.voice === 'feminino' ? 'Bella (Feminina Natural)' : 'Jarvis (Masculino Humanizado)'}</strong> • Interação completa com o sistema
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleHandsFreeToggle}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    handsFreeMode 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                  }`}
                  title="Escuta contínua: Bella fala e já volta a escutar você"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>{handsFreeMode ? 'Mãos Livres: ATIVO' : 'Mãos Livres'}</span>
                </button>

                <button
                  onClick={() => setIsVoiceChatMode(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Fechar modo de voz"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Central Animated Neural Orb & Spectrum */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl text-center space-y-8 my-auto">
              <div className="relative flex items-center justify-center">
                {/* Outer Ripple Rings */}
                <div className={`absolute w-72 h-72 rounded-full border transition-all duration-700 ${
                  voiceState.isSpeaking
                    ? 'border-cyan-500/40 scale-125 animate-ping'
                    : voiceState.isListening
                    ? 'border-red-500/40 scale-115 animate-pulse'
                    : 'border-white/5 scale-100'
                }`} />

                <div className={`absolute w-56 h-56 rounded-full border transition-all duration-500 ${
                  voiceState.isSpeaking
                    ? 'border-indigo-400/50 scale-110'
                    : voiceState.isListening
                    ? 'border-red-400/50 scale-105'
                    : 'border-cyan-500/10'
                }`} />

                {/* Central Glowing Orb */}
                <button
                  onClick={handleMicClick}
                  className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl cursor-pointer ${
                    voiceState.isListening
                      ? 'bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white ring-8 ring-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.6)] scale-105'
                      : voiceState.isSpeaking
                      ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 text-black ring-8 ring-cyan-400/30 shadow-[0_0_60px_rgba(34,211,238,0.6)] scale-105 animate-pulse'
                      : 'bg-gradient-to-tr from-slate-900 via-cyan-950 to-indigo-950 text-cyan-400 border border-cyan-500/40 hover:scale-105'
                  }`}
                >
                  {voiceState.isListening ? (
                    <>
                      <Mic className="w-12 h-12 text-white animate-bounce" />
                      <span className="text-xs font-bold uppercase tracking-wider mt-1 text-white">Ouvindo...</span>
                    </>
                  ) : voiceState.isSpeaking ? (
                    <>
                      <Volume2 className="w-12 h-12 text-black animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider mt-1 text-black">Falando...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-12 h-12 text-cyan-300" />
                      <span className="text-xs font-semibold tracking-wider mt-1 text-slate-300">Toque p/ Falar</span>
                    </>
                  )}
                </button>
              </div>

              {/* High-Fidelity Sound Wave Equalizer Bars */}
              <div className="flex items-center justify-center gap-1.5 h-12">
                {voiceState.frequencyData.map((f, i) => {
                  const barHeight = voiceState.isSpeaking
                    ? Math.max(6, Math.round(f * 48))
                    : voiceState.isListening
                    ? Math.max(6, Math.round((voiceState.volumeLevel || 0.4) * 36 * (((i % 4) + 1) / 3)))
                    : 6;
                  return (
                    <span
                      key={i}
                      style={{ height: `${barHeight}px` }}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        voiceState.isListening
                          ? 'bg-red-400 animate-pulse'
                          : voiceState.isSpeaking
                          ? 'bg-gradient-to-t from-cyan-400 via-indigo-400 to-purple-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                          : 'bg-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Subtitle / Live Transcript Display */}
              <div className="min-h-[70px] flex flex-col items-center justify-center px-4 max-w-lg">
                {voiceState.isListening ? (
                  <p className="text-lg text-red-200 font-medium italic animate-pulse">
                    "{liveTranscript || 'Fale seu comando ou dúvida...'}"
                  </p>
                ) : voiceState.isSpeaking ? (
                  <p className="text-base text-cyan-200 font-normal leading-relaxed">
                    {lastAiMessage?.parts[0].text.replace(/[*_#`]/g, '').slice(0, 220)}...
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    Ex: "Abrir PDV", "Quanto vendemos hoje?", "Adicionar corte degradê", "Abrir gaveta"
                  </p>
                )}
              </div>

              {/* Quick Spoken Shortcuts */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[
                  '🛒 Abrir PDV',
                  '💵 Abrir Gaveta',
                  '📊 Vendas de Hoje',
                  '📅 Próximo Cliente',
                  '✂️ Adicionar Corte'
                ].map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const cleanQuery = cmd.replace(/^[^\w\s]+/, '').trim();
                      handleSendMessage(cleanQuery);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer hover:scale-105"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Persona Selector & Stop */}
            <div className="w-full max-w-md flex items-center justify-between pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Voz:</span>
                <button
                  onClick={() => handleVoiceChange('feminino')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    voiceSettings.voice === 'feminino' 
                      ? 'bg-cyan-500 text-black shadow' 
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  👩 Bella
                </button>
                <button
                  onClick={() => handleVoiceChange('masculino')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    voiceSettings.voice === 'masculino' 
                      ? 'bg-cyan-500 text-black shadow' 
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  🎙️ Jarvis
                </button>
                <button
                  onClick={handleTestVoice}
                  title="Ouvir teste de voz"
                  className="px-2 py-1 rounded-lg font-medium text-[11px] bg-white/5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" /> Testar
                </button>
              </div>

              {voiceState.isSpeaking && (
                <button
                  onClick={() => voiceNarration.stopSpeaking()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 font-semibold hover:bg-red-500/30 transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" /> Parar Fala
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      {voiceSettings.voice === 'feminino' ? 'Bella 👩' : 'Jarvis 🎙️'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {voiceState.isListening ? (
                      <span className="text-red-400 font-semibold flex items-center gap-1 animate-pulse">
                        <Mic className="w-3 h-3" /> Ouvindo você em tempo real...
                      </span>
                    ) : voiceState.isSpeaking ? (
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        <Volume2 className="w-3 h-3 animate-pulse" /> Respondendo com voz neural...
                      </span>
                    ) : (
                      'Interação com sistema e operador ativa'
                    )}
                  </span>
                </div>
              </div>

              {/* ACTION COMMANDS */}
              <div className="flex items-center gap-1">
                {/* Full voice mode button */}
                <button
                  onClick={() => {
                    setIsVoiceChatMode(true);
                    setIsOpen(false);
                    if (!voiceState.isListening) handleStartListening();
                  }}
                  className="p-1.5 rounded text-cyan-400 hover:text-white hover:bg-cyan-500/20 transition-colors"
                  title="Abrir Chat de Voz Neural Full"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                </button>

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
                            🎙️ Jarvis
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-slate-300 font-medium">Motor de Resposta:</span>
                        <button
                          onClick={handleEngineModeToggle}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                            voiceSettings.engineMode === 'humanized' 
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                              : voiceSettings.engineMode === 'instant'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {voiceSettings.engineMode === 'humanized' ? '✨ Humanizada Natural' : voiceSettings.engineMode === 'instant' ? '⚡ 0s Instantâneo' : '🎙️ Estúdio Neural'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-slate-300 font-medium">Amostra da Voz:</span>
                        <button
                          onClick={handleTestVoice}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold bg-white/5 text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 flex items-center gap-1 transition-all"
                        >
                          <Volume2 className="w-3 h-3" /> Testar Voz
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ACTIVE NARRATION BAR (High-Fidelity Studio Audio) */}
                {voiceState.isSpeaking && (
                  <div className="bg-gradient-to-r from-cyan-950/80 via-indigo-950/80 to-purple-950/80 px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {voiceState.frequencyData.slice(0, 4).map((f, idx) => (
                          <span
                            key={idx}
                            style={{ height: `${Math.max(6, Math.round(f * 18))}px` }}
                            className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-medium text-white">
                          Voz: <strong>{voiceSettings.voice === 'feminino' ? 'Bella (Natural)' : 'Jarvis (Humanizado)'}</strong>
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                          Humanizada
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => voiceNarration.stopSpeaking()}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" /> Parar
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
                    <span className="text-amber-400 flex items-center gap-0.5 font-bold">
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
                                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md transition-all font-semibold cursor-pointer ${
                                  isThisPlaying 
                                    ? 'bg-gradient-to-r from-cyan-400 to-indigo-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                                    : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/15 border border-cyan-500/20'
                                }`}
                                title={isThisPlaying ? 'Pausar/Parar áudio' : 'Ouvir resposta com Voz Neural Humanizada (24kHz)'}
                              >
                                {isThisPlaying ? (
                                  <>
                                    <span className="flex items-center gap-0.5">
                                      <span className="w-0.5 h-2 bg-black rounded-full animate-bounce [animation-delay:-0.2s]" />
                                      <span className="w-0.5 h-3 bg-black rounded-full animate-bounce [animation-delay:-0.1s]" />
                                      <span className="w-0.5 h-2 bg-black rounded-full animate-bounce" />
                                    </span>
                                    <span>Tocando</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3 h-3 text-cyan-400" />
                                    <span>Voz Neural</span>
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
                        <span>Bella está respondendo imediatamente...</span>
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
                    title="Enviar comando"
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
