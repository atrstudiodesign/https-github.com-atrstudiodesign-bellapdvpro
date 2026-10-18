import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useNicheStore } from '../store/niche';
import { 
  CreditCard, 
  CheckCircle, 
  Shield, 
  Clock, 
  X, 
  ExternalLink, 
  Bell, 
  Mail, 
  Volume2, 
  Play, 
  Square, 
  Save, 
  Cloud, 
  Sparkles, 
  Bot, 
  Sliders, 
  Check, 
  Radio,
  Zap,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  voiceNarration, 
  BELLA_VOICE_PERSONAS, 
  BellaVoiceType, 
  VoiceEngineMode 
} from '../services/voiceNarrationService';
import { auth } from '../lib/firebase';

export default function Settings() {
  const { user } = useAuthStore();
  const { getConfig } = useNicheStore();
  const config = getConfig();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [wppAuto, setWppAuto] = useState(true);
  const [emailAuto, setEmailAuto] = useState(false);

  // --- Voice Settings State ---
  const initialSettings = voiceNarration.getSettings();
  const [selectedPersona, setSelectedPersona] = useState<BellaVoiceType>(initialSettings.personaType || 'varejista');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(initialSettings.speed || 1.0);
  const [voiceVolume, setVoiceVolume] = useState<number>(initialSettings.volume ?? 1.0);
  const [soundEffects, setSoundEffects] = useState<boolean>(initialSettings.soundEffects ?? true);
  const [engineMode, setEngineMode] = useState<VoiceEngineMode>(initialSettings.engineMode || 'neural');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewingPersona, setPreviewingPersona] = useState<BellaVoiceType | null>(null);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [voiceSavedSuccess, setVoiceSavedSuccess] = useState(false);

  // Load user settings from Firebase on mount
  useEffect(() => {
    let isMounted = true;
    const loadVoicePrefs = async () => {
      const uid = user?.id || (auth.currentUser ? auth.currentUser.uid : null);
      if (uid) {
        await voiceNarration.loadFromFirebase(uid);
        if (isMounted) {
          const loaded = voiceNarration.getSettings();
          setSelectedPersona(loaded.personaType);
          setVoiceSpeed(loaded.speed);
          setVoiceVolume(loaded.volume);
          setSoundEffects(loaded.soundEffects);
          setEngineMode(loaded.engineMode);
        }
      }
    };
    loadVoicePrefs();
    return () => { isMounted = false; };
  }, [user]);

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

  // Select persona and update default speed for that persona
  const handleSelectPersona = (p: BellaVoiceType) => {
    setSelectedPersona(p);
    const cfg = BELLA_VOICE_PERSONAS[p];
    voiceNarration.updateSettings({
      personaType: p,
      voice: cfg.gender,
      speed: cfg.recommendedSpeed,
    });
    setVoiceSpeed(cfg.recommendedSpeed);
    toast.info(`Persona "${cfg.name}" selecionada`, {
      description: cfg.description,
      duration: 3000
    });
  };

  // Preview voice narration
  const handlePreviewVoice = async (p?: BellaVoiceType) => {
    const personaToTest = p || selectedPersona;
    if (isPlayingPreview) {
      voiceNarration.stopSpeaking();
      setIsPlayingPreview(false);
      setPreviewingPersona(null);
      return;
    }

    setIsPlayingPreview(true);
    setPreviewingPersona(personaToTest);
    try {
      await voiceNarration.previewVoice(personaToTest, voiceSpeed);
    } catch (e) {
      console.warn('Preview error:', e);
    } finally {
      setIsPlayingPreview(false);
      setPreviewingPersona(null);
    }
  };

  // Save voice settings to Firebase Firestore
  const handleSaveVoicePreferences = async () => {
    setIsSavingVoice(true);
    try {
      voiceNarration.updateSettings({
        personaType: selectedPersona,
        speed: voiceSpeed,
        volume: voiceVolume,
        soundEffects,
        engineMode,
      });

      const uid = user?.id || (auth.currentUser ? auth.currentUser.uid : 'anon_operador');
      const success = await voiceNarration.saveToFirebase(uid);

      if (success) {
        setVoiceSavedSuccess(true);
        setTimeout(() => setVoiceSavedSuccess(false), 3500);
        toast.success('Preferências de voz salvas no Firebase!', {
          description: `Persona "${BELLA_VOICE_PERSONAS[selectedPersona].name}" e velocidade ${voiceSpeed.toFixed(2)}x sincronizadas na nuvem.`,
          duration: 4000
        });
      } else {
        toast.success('Preferências salvas localmente!', {
          description: 'Configurações ativas no navegador.',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar preferências de voz.');
    } finally {
      setIsSavingVoice(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-10 relative pb-12">
       
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
             Gerencie as configurações do Bella PDV, nicho de atuação, preferências de voz e detalhes da sua assinatura.
          </p>
       </div>

       {/* ========================================================================= */}
       {/* BELLA IA & JARVIS VOCAL PERSONAS & SPEED CONFIGURATION (SAVED IN FIREBASE) */}
       {/* ========================================================================= */}
       <div className="glass-card p-0 border border-blue-500/30 overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.12)]">
          {/* Card Top Header */}
          <div className="bg-gradient-to-r from-[#0D1C34] via-[#0C1627] to-[#12112C] p-6 border-b border-[#1A2C47] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/40 text-blue-400 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                 <Bot className="w-7 h-7" />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">Voz & Persona da Bella IA e Jarvis</h2>
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Nuvem Firebase
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Selecione a persona vocal, ajuste a velocidade da fala e salve as preferências diretamente no Firebase para toda a equipe.
                  </p>
               </div>
             </div>

             <div className="flex items-center gap-2">
               <button
                 onClick={() => handlePreviewVoice()}
                 className={`px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                   isPlayingPreview 
                     ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse'
                     : 'bg-[#0C1627] text-blue-400 border-blue-500/40 hover:bg-blue-500/10 hover:border-blue-400'
                 }`}
               >
                 {isPlayingPreview ? (
                   <>
                     <Square className="w-4 h-4 fill-current" />
                     <span>Parar Áudio</span>
                   </>
                 ) : (
                   <>
                     <Play className="w-4 h-4 fill-current" />
                     <span>Testar Voz Atual</span>
                   </>
                 )}
               </button>

               <button
                 onClick={handleSaveVoicePreferences}
                 disabled={isSavingVoice}
                 className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all disabled:opacity-50"
               >
                 {isSavingVoice ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     <span>Salvando...</span>
                   </>
                 ) : voiceSavedSuccess ? (
                   <>
                     <Check className="w-4 h-4 text-emerald-300" />
                     <span>Salvo no Firebase!</span>
                   </>
                 ) : (
                   <>
                     <Cloud className="w-4 h-4" />
                     <span>Salvar no Firebase</span>
                   </>
                 )}
               </button>
             </div>
          </div>

          <div className="p-8 space-y-8">
             {/* 1. SELEÇÃO DE PERSONAS VOCAIS */}
             <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-blue-400" /> Escolha o Estilo Vocal da Bella IA
                    </h3>
                    <p className="text-xs text-slate-400">
                      Vozes humanizadas com entonação expressiva, sem som mecânico ou robótico.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    Ativa: <span className="text-white font-semibold">{BELLA_VOICE_PERSONAS[selectedPersona].name}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.keys(BELLA_VOICE_PERSONAS) as BellaVoiceType[]).map((pKey) => {
                    const persona = BELLA_VOICE_PERSONAS[pKey];
                    const isSelected = selectedPersona === pKey;
                    const isPreviewingThis = isPlayingPreview && previewingPersona === pKey;

                    return (
                      <div
                        key={pKey}
                        onClick={() => handleSelectPersona(pKey)}
                        className={`relative rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-gradient-to-b from-blue-900/40 via-[#0C1627] to-[#0A1220] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.25)] ring-1 ring-blue-400' 
                            : 'bg-[#0C1627]/70 border-[#1A2C47] hover:border-[#2A446E] hover:bg-[#0E1A30]'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1 shadow">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              pKey === 'varejista' 
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                : pKey === 'executivo'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : pKey === 'amigavel'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            }`}>
                              {persona.gender === 'feminino' ? 'Voz Feminina' : 'Voz Masculina'}
                            </span>
                            {pKey === 'varejista' && (
                              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                Animado / Comercial
                              </span>
                            )}
                          </div>

                          <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-1.5">
                            {persona.name}
                          </h4>
                          <p className="text-xs text-slate-400 mb-3 font-medium">
                            {persona.subtitle}
                          </p>

                          {/* Persona Natural Prompt Box */}
                          <div className="bg-[#050B14]/80 border border-white/5 rounded-xl p-2.5 text-xs text-slate-300 italic mb-4 leading-relaxed">
                            "{persona.naturalPrompt}"
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {persona.tags.map((tag, idx) => (
                              <span key={idx} className="text-[10px] bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Card Action */}
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewVoice(pKey);
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              isPreviewingThis 
                                ? 'bg-amber-500 text-gray-900 font-bold'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                            }`}
                          >
                            {isPreviewingThis ? (
                              <>
                                <Square className="w-3 h-3 fill-current" />
                                <span>Ouvindo...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>Ouvir Amostra</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>

             {/* 2. CONTROLE DE VELOCIDADE DA FALA */}
             <div className="bg-[#0C1627] p-6 rounded-2xl border border-[#1A2C47]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="text-base font-semibold text-white">Velocidade da Fala (Cadência do Atendimento)</h3>
                         <p className="text-xs text-slate-400">
                           Ajuste a velocidade das narrações automáticas de fechamento de caixa, lembretes e respostas da assistente.
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono text-blue-400">
                        {voiceSpeed.toFixed(2)}x
                      </span>
                      <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        {voiceSpeed < 0.95 ? 'Pausado / Calmo' : voiceSpeed > 1.15 ? 'Ultra Rápido' : voiceSpeed > 1.05 ? 'Enérgico / Comercial' : 'Natural'}
                      </span>
                   </div>
                </div>

                <div className="space-y-4">
                   <input
                     type="range"
                     min="0.85"
                     max="1.30"
                     step="0.05"
                     value={voiceSpeed}
                     onChange={(e) => {
                       const val = parseFloat(e.target.value);
                       setVoiceSpeed(val);
                       voiceNarration.updateSettings({ speed: val });
                     }}
                     className="w-full h-2.5 bg-[#050B14] rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                   />

                   <div className="flex items-center justify-between text-xs text-slate-500">
                     <span>0.85x (Pausado)</span>
                     <span>1.00x (Equilibrado)</span>
                     <span>1.10x (Dinâmico / PDV)</span>
                     <span>1.30x (Acelerado)</span>
                   </div>

                   {/* Quick Speed Preset Buttons */}
                   <div className="flex flex-wrap gap-2 pt-2">
                     <span className="text-xs text-slate-400 self-center mr-1">Atalhos rápidos:</span>
                     {[
                       { label: '0.90x Sóbrio', val: 0.90 },
                       { label: '1.00x Padrão', val: 1.00 },
                       { label: '1.05x Conversacional', val: 1.05 },
                       { label: '1.10x Enérgico', val: 1.10 },
                       { label: '1.20x Comercial', val: 1.20 },
                     ].map((item) => (
                       <button
                         key={item.val}
                         type="button"
                         onClick={() => {
                           setVoiceSpeed(item.val);
                           voiceNarration.updateSettings({ speed: item.val });
                           toast.info(`Velocidade ajustada para ${item.val.toFixed(2)}x`);
                         }}
                         className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                           Math.abs(voiceSpeed - item.val) < 0.02
                             ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                             : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                         }`}
                       >
                         {item.label}
                       </button>
                     ))}
                   </div>
                </div>
             </div>

             {/* 3. MOTOR VOCAL & EFEITOS SONOROS */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Engine Selector */}
                <div className="bg-[#0C1627] p-5 rounded-2xl border border-[#1A2C47]">
                   <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-400" /> Motor de Síntese
                        </h4>
                        <p className="text-xs text-slate-400">Selecione o motor de voz da assistente</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded border border-purple-500/30">
                        {engineMode === 'neural' ? '✨ Nuvem Gemini Neural (Alta Fidelidade)' : 'Humanizada Local'}
                      </span>
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEngineMode('neural');
                          voiceNarration.updateSettings({ engineMode: 'neural' });
                          toast.success('Voz Neural Gemini Studio ativada!');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          engineMode === 'neural'
                            ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                         <div className="flex items-center justify-between mb-0.5">
                           <p className="text-xs font-bold text-white">Nuvem Gemini TTS</p>
                           <span className="text-[9px] bg-purple-500/30 text-purple-300 font-semibold px-1.5 py-0.5 rounded">Recomendado</span>
                         </div>
                         <p className="text-[11px] text-slate-400 leading-tight">Voz neural expressiva, quente e humana via Gemini 3.8</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEngineMode('humanized');
                          voiceNarration.updateSettings({ engineMode: 'humanized' });
                          toast.info('Modo de compatibilidade local ativado.');
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          engineMode === 'humanized'
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                         <p className="text-xs font-bold text-white mb-0.5">Voz do Navegador</p>
                         <p className="text-[11px] text-slate-400 leading-tight">Síntese padrão do dispositivo (modo offline)</p>
                      </button>
                   </div>
                </div>

                {/* Sound Effects & Volume */}
                <div className="bg-[#0C1627] p-5 rounded-2xl border border-[#1A2C47] flex flex-col justify-between">
                   <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Radio className="w-4 h-4 text-cyan-400" /> Sinais & Feedback Acústico
                        </h4>
                        <p className="text-xs text-slate-400">Beeps e acordes harmônicos de confirmação no PDV</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !soundEffects;
                          setSoundEffects(nextVal);
                          voiceNarration.updateSettings({ soundEffects: nextVal });
                          if (nextVal) voiceNarration.playChime('success');
                          toast.success(nextVal ? 'Efeitos sonoros ativados' : 'Efeitos sonoros desativados');
                        }}
                        className={`w-12 h-6 ${soundEffects ? 'bg-blue-600' : 'bg-slate-700'} rounded-full relative cursor-pointer flex items-center px-1 transition-colors duration-200`}
                      >
                         <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 ${soundEffects ? 'ml-auto' : 'ml-0'}`} />
                      </button>
                   </div>

                   <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                      <span>Volume de Narração: {Math.round(voiceVolume * 100)}%</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newVol = voiceVolume === 1 ? 0.7 : 1;
                          setVoiceVolume(newVol);
                          voiceNarration.updateSettings({ volume: newVol });
                        }}
                        className="text-blue-400 hover:underline"
                      >
                        Alternar Volume
                      </button>
                   </div>
                </div>
             </div>

             {/* Bottom Save Action Bar */}
             <div className="pt-4 border-t border-[#1A2C47] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                   <Shield className="w-4 h-4 text-emerald-400" />
                   <span>Suas preferências serão sincronizadas no Firebase Firestore sob a coleção <code className="text-blue-400">voice_settings</code>.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <button
                     type="button"
                     onClick={() => {
                       handleSelectPersona('varejista');
                       setVoiceSpeed(1.10);
                       setEngineMode('neural');
                       voiceNarration.updateSettings({
                         personaType: 'varejista',
                         speed: 1.10,
                         engineMode: 'neural'
                       });
                       toast.info('Restaurado para Varejista Neural Gemini (1.10x)');
                     }}
                     className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                   >
                     <RotateCcw className="w-4 h-4" />
                     <span>Restaurar Padrão</span>
                   </button>

                   <button
                     type="button"
                     onClick={handleSaveVoicePreferences}
                     disabled={isSavingVoice}
                     className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50"
                   >
                     {isSavingVoice ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         <span>Gravando no Firebase...</span>
                       </>
                     ) : (
                       <>
                         <Save className="w-4 h-4" />
                         <span>Salvar Preferências no Firebase</span>
                       </>
                     )}
                   </button>
                </div>
             </div>
          </div>
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
  );
}
