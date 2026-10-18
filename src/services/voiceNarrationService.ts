import { authenticatedApiFetch } from '../lib/apiClient';
// Service for High-Fidelity Humanized Voice Narration in Portuguese (BR)
// Prioritizes ultra-natural Brazilian humanized voices with conversational inflection,
// dynamic voice scoring, studio mastering, and low-latency audio processing.

export type VoicePersona = 'feminino' | 'masculino';
export type VoiceEngineMode = 'humanized' | 'instant' | 'neural'; 
// 'humanized' = Natural Brazilian Humanized Voice (Warm, articulate, conversational - RECOMMENDED)
// 'instant' = Instant Low-Latency Web Speech
// 'neural' = Cloud Neural Studio TTS (Gemini)

export interface VoiceSettings {
  voice: VoicePersona;
  speed: number; // 0.85 to 1.25
  volume: number; // 0 to 1
  autoPlay: boolean;
  engineMode: VoiceEngineMode;
  handsFree: boolean; // Continuous conversational listening for operator
  soundEffects: boolean; // Subtle audio cues
}

export interface AudioState {
  isSpeaking: boolean;
  isListening: boolean;
  currentVoice: VoicePersona;
  interimTranscript: string;
  volumeLevel: number; // 0 to 1 real-time frequency/amplitude for visualizer
  frequencyData: number[]; // frequency bins for visualizer bars
  engine: VoiceEngineMode;
}

type AudioStateListener = (state: AudioState) => void;

class VoiceNarrationService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isListening = false;
  private interimTranscript = '';
  private volumeLevel = 0;
  private frequencyData: number[] = new Array(12).fill(0);
  private recognition: any = null;
  private silenceTimer: any = null;
  private listeners: Set<AudioStateListener> = new Set();
  
  // Web Audio mastering & frequency analysis pipeline
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  private animationFrameId: number | null = null;

  // Cached browser voices
  private availableVoices: SpeechSynthesisVoice[] = [];

  // Client-side in-memory audio cache for 0ms replay
  private clientAudioCache: Map<string, string> = new Map();
  private readonly MAX_CLIENT_CACHE = 100;

  // Default to Humanized voice with Jarvis (masculino) as primary assistant
  private settings: VoiceSettings = {
    voice: 'feminino', // Bella natural voice by default
    speed: 1.04,
    volume: 1.0,
    autoPlay: true,
    engineMode: 'humanized', // Prefer cloud humanized audio with fast browser fallback
    handsFree: false,
    soundEffects: true,
  };

  constructor() {
    try {
      const saved = localStorage.getItem('bella_voice_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If user was on old 'neural' mode that was perceived as robotic, upgrade to 'humanized'
        if (parsed.engineMode === 'neural') {
          parsed.engineMode = 'humanized';
        }
        this.settings = { ...this.settings, ...parsed };
        // Earlier versions silently used robotic browser speech in 'humanized' mode.
        if (this.settings.engineMode !== 'instant') this.settings.engineMode = 'humanized';
      }
    } catch (e) {
      console.warn('Could not load voice settings from localStorage', e);
    }

    // Initialize speech synthesis voices eagerly
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const load = () => {
      this.availableVoices = window.speechSynthesis.getVoices();
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  public getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...partial };
    try {
      localStorage.setItem('bella_voice_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save voice settings to localStorage', e);
    }
    this.notifyState();
  }

  public subscribe(listener: AudioStateListener) {
    this.listeners.add(listener);
    listener(this.getStateSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private getStateSnapshot(): AudioState {
    return {
      isSpeaking: this.isSpeaking,
      isListening: this.isListening,
      currentVoice: this.settings.voice,
      interimTranscript: this.interimTranscript,
      volumeLevel: this.volumeLevel,
      frequencyData: [...this.frequencyData],
      engine: this.settings.engineMode,
    };
  }

  private notifyState() {
    const snapshot = this.getStateSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  // Initialize or resume Web Audio mastering context
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
        
        // Studio Mastering: Dynamics Compressor Node (warm broadcast clarity)
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-22, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(25, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(3.5, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.005, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.20, this.audioCtx.currentTime);

        // Real-time Analyser Node for visualizer
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;

        this.gainNode = this.audioCtx.createGain();

        // Connect chain: Source -> Compressor -> Analyser -> Gain -> Destination
        this.compressor.connect(this.analyser);
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Soft acoustic chimes for interactions
  public playChime(type: 'start' | 'success' | 'stop') {
    if (!this.settings.soundEffects) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'start') {
        // High-tech two-tone listening beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'success') {
        // Warm action confirmation chord
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(587, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Soft stop tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.1);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
      }
    } catch {
      // Audio context may require user gesture on first interaction
    }
  }

  // Clean markdown and optimize text for natural spoken Portuguese
  public cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/[*_#`~>\[\]]/g, '') // remove markdown symbols
      .replace(/https?:\/\/\S+/g, 'o link')
      // Natural spoken currency in Brazilian Portuguese
      .replace(/R\$\s*(\d{1,3}(?:\.\d{3})*),(\d{2})/g, (_m, intPart, decPart) => {
        const cleanInt = intPart.replace(/\./g, '');
        return decPart === '00' ? `${cleanInt} reais` : `${cleanInt} reais e ${parseInt(decPart, 10)} centavos`;
      })
      .replace(/R\$\s*(\d+)[,.](\d{2})/g, (_m, intPart, decPart) => {
        return decPart === '00' ? `${intPart} reais` : `${intPart} reais e ${parseInt(decPart, 10)} centavos`;
      })
      .replace(/R\$\s*(\d+)/g, '$1 reais')
      .replace(/(\d+)%/g, '$1 por cento')
      .replace(/(\d{1,2}):(\d{2})/g, '$1 horas e $2 minutos')
      // Natural conversational transformations
      .replace(/\bPDV\b/gi, 'frente de caixa')
      .replace(/\bCRM\b/gi, 'gestão de clientes')
      .replace(/\bIA\b/gi, 'inteligência artificial')
      .replace(/\bPIX\b/gi, 'Pix')
      .replace(/\bNFC-e\b/gi, 'nota fiscal eletrônica')
      .replace(/\bWhatsApp\b/gi, 'WhatsApp')
      .replace(/\bOK\b/gi, 'Tudo certo')
      .replace(/\bID\b/gi, 'código')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public stopSpeaking() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.volumeLevel = 0;
    this.frequencyData = new Array(12).fill(0);
    this.notifyState();
  }

  // Real-time audio spectrum analysis loop
  private startFrequencyAnalysis() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (!this.isSpeaking || !this.analyser) {
        this.volumeLevel = 0;
        this.frequencyData = new Array(12).fill(0);
        this.notifyState();
        return;
      }

      this.analyser.getByteFrequencyData(dataArray);

      // Compute RMS volume (0.0 to 1.0)
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      this.volumeLevel = Math.min(1, Math.max(0, avg / 128));

      // Compute 12 frequency bands for visualizer equalizer bars
      const bands = 12;
      const step = Math.floor(dataArray.length / bands);
      const newFrequencies: number[] = [];
      for (let b = 0; b < bands; b++) {
        let bSum = 0;
        for (let j = 0; j < step; j++) {
          bSum += dataArray[b * step + j] || 0;
        }
        newFrequencies.push((bSum / step) / 255);
      }
      this.frequencyData = newFrequencies;
      this.notifyState();

      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  // Find the highest-quality humanized Brazilian voice
  private selectBestBrazilianVoice(isMasculine: boolean): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

    let voices = this.availableVoices;
    if (!voices || voices.length === 0) {
      voices = window.speechSynthesis.getVoices();
      this.availableVoices = voices;
    }

    if (!voices || voices.length === 0) return null;

    // Filter Portuguese voices
    const ptVoices = voices.filter((v) => {
      const lang = v.lang.replace('_', '-').toLowerCase();
      return lang.startsWith('pt');
    });

    if (ptVoices.length === 0) {
      // Fallback to any voice
      return voices[0] || null;
    }

    // Score voices for humanization and persona alignment
    const scored = ptVoices.map((v) => {
      let score = 0;
      const name = v.name.toLowerCase();
      const lang = v.lang.replace('_', '-').toLowerCase();

      // Brazilian Portuguese preference
      if (lang.startsWith('pt-br')) score += 50;

      // Natural online voices (Edge & Windows Natural voices are extraordinarily human)
      if (name.includes('natural')) score += 150;
      if (name.includes('online')) score += 60;
      if (name.includes('neural')) score += 70;
      if (name.includes('google')) score += 50; // Google Brazilian voices are high quality

      if (isMasculine) {
        // JARVIS - Male Brazilian voices
        if (/antonio|daniel|felipe|fabio|ricardo|luciano|thiago|nicolau|homem|male|mário/i.test(name)) {
          score += 100;
        }
        // Penalize female voices for Jarvis
        if (/francisca|leticia|luciana|helena|camila|maria|brenda|yara|female|mulher|vitória/i.test(name)) {
          score -= 120;
        }
      } else {
        // BELLA - Female Brazilian voices
        if (/francisca|leticia|luciana|helena|camila|maria|brenda|yara|female|mulher|vitória/i.test(name)) {
          score += 100;
        }
        // Penalize male voices for Bella
        if (/antonio|daniel|felipe|fabio|ricardo|luciano|thiago|nicolau|homem|male|mário/i.test(name)) {
          score -= 120;
        }
      }

      return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice || ptVoices[0];
  }

  // Speak with High-Fidelity Humanized Voice
  public async speak(
    text: string,
    options?: {
      voice?: VoicePersona;
      speed?: number;
      volume?: number;
      mode?: VoiceEngineMode;
      style?: string;
      onStart?: () => void;
      onEnd?: () => void;
    }
  ): Promise<boolean> {
    const selectedVoice = options?.voice || this.settings.voice;
    const speed = options?.speed ?? this.settings.speed;
    const volume = options?.volume ?? this.settings.volume;
    const engineMode = options?.mode ?? this.settings.engineMode;

    const speechText = this.cleanTextForSpeech(text);
    if (!speechText) return false;

    // Stop any existing playback
    this.stopSpeaking();

    this.isSpeaking = true;
    this.volumeLevel = 0.5;
    this.notifyState();
    options?.onStart?.();

    // 1. DEFAULT & RECOMMENDED: Humanized Natural Voice Engine
    // Produces the warmest, most natural conversational Brazilian Portuguese
    if (engineMode === 'instant') {
      return this.speakWithWebSpeech(speechText, selectedVoice, speed, volume, options?.onEnd);
    }

    // 2. ALTERNATIVE: Cloud Neural TTS (if specifically enabled)
    const cacheKey = `${selectedVoice}_${speechText}`;
    const localCached = this.clientAudioCache.get(cacheKey);

    if (localCached) {
      return await this.playBase64Audio(localCached, speed, volume, options?.onEnd);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), engineMode === 'humanized' ? 6500 : 8000);
    try {

      const response = await authenticatedApiFetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speechText,
          voice: selectedVoice,
          style: options?.style,
        }),
        signal: controller.signal,
      });


      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          if (this.clientAudioCache.size >= this.MAX_CLIENT_CACHE) {
            const firstKey = this.clientAudioCache.keys().next().value;
            if (firstKey) this.clientAudioCache.delete(firstKey);
          }
          this.clientAudioCache.set(cacheKey, data.audioBase64);

          return await this.playBase64Audio(data.audioBase64, speed, volume, options?.onEnd);
        }
      }
    } catch (e) {
      console.warn('[VoiceNarration] Cloud TTS unavailable; switching to local voice', e);
    } finally {
      clearTimeout(timeoutId);
    }

    // Seamless fallback to humanized Brazilian voice
    return this.speakWithWebSpeech(speechText, selectedVoice, speed, volume, options?.onEnd);
  }

  // Play High-Fidelity Audio
  private playBase64Audio(
    base64Data: string,
    speed: number,
    volume: number,
    onEnd?: () => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
        this.currentAudio = audio;
        audio.playbackRate = Math.max(0.75, Math.min(1.4, speed));
        audio.volume = Math.max(0, Math.min(1, volume));

        try {
          const ctx = this.getAudioContext();
          if (ctx && this.compressor && !this.audioSourceNode) {
            this.audioSourceNode = ctx.createMediaElementSource(audio);
            this.audioSourceNode.connect(this.compressor);
          }
        } catch {
          // Fallback if routing already connected
        }

        audio.onplay = () => {
          this.startFrequencyAnalysis();
        };

        audio.onended = () => {
          this.stopSpeaking();
          onEnd?.();
          resolve(true);
        };

        audio.onerror = (err) => {
          console.warn('[Audio Playback Error]', err);
          this.stopSpeaking();
          onEnd?.();
          resolve(false);
        };

        audio.play().catch((playErr) => {
          console.warn('[Audio Autoplay Blocked]', playErr);
          this.stopSpeaking();
          onEnd?.();
          resolve(false);
        });
      } catch (err) {
        console.warn('[Audio Playback Failed]', err);
        this.stopSpeaking();
        onEnd?.();
        resolve(false);
      }
    });
  }

  // Web Speech Synthesis with Calibrated Humanized Brazilian Voice
  public speakWithWebSpeech(
    text: string,
    voicePersona: VoicePersona,
    speed: number,
    volume: number,
    onEnd?: () => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.isSpeaking = false;
        this.volumeLevel = 0;
        this.notifyState();
        onEnd?.();
        return resolve(false);
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      utterance.lang = 'pt-BR';
      utterance.volume = volume;

      const isMasculine = voicePersona === 'masculino';
      const bestVoice = this.selectBestBrazilianVoice(isMasculine);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      // Voice Calibration for Humanized Warmth
      if (isMasculine) {
        // JARVIS: Warm, articulate, confident baritone. Not robotic, not high-pitched.
        utterance.pitch = 0.98;
        utterance.rate = Math.max(0.92, Math.min(1.15, speed));
      } else {
        // BELLA: Warm, friendly, welcoming feminine tone.
        utterance.pitch = 1.02;
        utterance.rate = Math.max(0.95, Math.min(1.18, speed));
      }

      // Simulated volume pulsing for visualizer
      let pulseInterval: any = null;
      utterance.onstart = () => {
        let toggle = false;
        pulseInterval = setInterval(() => {
          toggle = !toggle;
          this.volumeLevel = toggle ? 0.65 : 0.40;
          this.frequencyData = this.frequencyData.map(() => 0.2 + Math.random() * 0.6);
          this.notifyState();
        }, 110);
      };

      utterance.onend = () => {
        if (pulseInterval) clearInterval(pulseInterval);
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.volumeLevel = 0;
        this.frequencyData = new Array(12).fill(0);
        this.notifyState();
        onEnd?.();
        resolve(true);
      };

      utterance.onerror = (err) => {
        if (pulseInterval) clearInterval(pulseInterval);
        console.warn('[WebSpeech Error]', err);
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.volumeLevel = 0;
        this.frequencyData = new Array(12).fill(0);
        this.notifyState();
        onEnd?.();
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // Quick voice test
  public testVoice(persona?: VoicePersona) {
    const voiceToTest = persona || this.settings.voice;
    const isJarvis = voiceToTest === 'masculino';
    const sample = isJarvis
      ? 'Olá! Sou o Jarvis, seu assistente inteligente no BellaPDV. Minha voz agora está muito mais humanizada e natural, pronta para ajudar você em qualquer comando.'
      : 'Olá! Sou a Bella. Minha voz foi aprimorada para soar ainda mais humana, calorosa e agradável.';
    return this.speak(sample, { voice: voiceToTest });
  }

  // Speech Recognition
  public isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public startListening(callbacks: {
    onInterim?: (text: string) => void;
    onFinal?: (text: string) => void;
    onResult?: (text: string) => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  }): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      callbacks.onError?.('Reconhecimento de voz não suportado neste navegador.');
      return false;
    }

    this.stopSpeaking();
    this.stopListening();

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.isListening = true;
      this.interimTranscript = '';
      this.volumeLevel = 0.3;
      this.notifyState();

      this.playChime('start');

      let lastFinalTranscript = '';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentFinal += trans;
          } else {
            interim += trans;
          }
        }

        const activeInterim = interim || currentFinal;
        this.interimTranscript = activeInterim;
        this.volumeLevel = 0.7;
        this.notifyState();
        callbacks.onInterim?.(activeInterim);

        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        // Snappy 480ms silence detection for fast response
        this.silenceTimer = setTimeout(() => {
          const toSend = (currentFinal || interim || lastFinalTranscript).trim();
          if (toSend && toSend.length > 1) {
            this.playChime('success');
            callbacks.onFinal?.(toSend);
            callbacks.onResult?.(toSend);
            this.interimTranscript = '';
            this.notifyState();
          }
        }, 480);

        if (currentFinal) {
          lastFinalTranscript = currentFinal;
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('[SpeechRec Error]', event.error);
        callbacks.onError?.(event.error);
        this.stopListening();
      };

      this.recognition.onend = () => {
        callbacks.onEnd?.();
        if (this.settings.handsFree && this.isListening) {
          try {
            this.recognition?.start();
          } catch {
            this.isListening = false;
            this.notifyState();
          }
        } else {
          this.isListening = false;
          this.volumeLevel = 0;
          this.notifyState();
        }
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      console.error('[SpeechRec Init Error]', e);
      callbacks.onError?.(e?.message || 'Falha ao iniciar microfone');
      this.isListening = false;
      this.notifyState();
      return false;
    }
  }

  public stopListening() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // already stopped
      }
      this.recognition = null;
    }
    this.isListening = false;
    this.interimTranscript = '';
    this.volumeLevel = 0;
    this.playChime('stop');
    this.notifyState();
  }
}

export const voiceNarration = new VoiceNarrationService();
