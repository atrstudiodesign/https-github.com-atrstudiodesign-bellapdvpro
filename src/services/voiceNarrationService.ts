// Service for High-Fidelity Humanized Voice Narration in Portuguese (BR)
// Integrates Gemini 3.8 Flash Lite TTS (24kHz studio audio) + Instant Web Speech fallback
// Features client/server audio caching, Web Audio compressor mastering, and real-time frequency analysis

export type VoicePersona = 'feminino' | 'masculino';
export type VoiceEngineMode = 'neural' | 'instant'; // 'neural' = High-fidelity Gemini Studio TTS, 'instant' = Web Speech

export interface VoiceSettings {
  voice: VoicePersona;
  speed: number; // 0.8 to 1.3
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

  // Client-side in-memory audio cache for 0ms replay of synthesized phrases
  private clientAudioCache: Map<string, string> = new Map();
  private readonly MAX_CLIENT_CACHE = 100;

  private settings: VoiceSettings = {
    voice: 'feminino',
    speed: 1.05,
    volume: 1.0,
    autoPlay: true,
    engineMode: 'neural', // Default to High-Fidelity Gemini TTS
    handsFree: false,
    soundEffects: true,
  };

  constructor() {
    try {
      const saved = localStorage.getItem('bella_voice_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not load voice settings from localStorage', e);
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

  // Initialize or resume the Web Audio mastering context
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
        
        // Studio Mastering: Dynamics Compressor Node (broadcast clarity)
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);

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

  // Soft high-tech acoustic cues via synthesized audio
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
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'success') {
        // Warm action confirmation chord
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
        osc.frequency.setValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Soft stop tone
        osc.type = 'sine';
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.1);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.13);
      }
    } catch {
      // Audio context may require user gesture on first interaction
    }
  }

  // Clean markdown and optimize for natural spoken Portuguese
  public cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/[*_#`~>\[\]]/g, '') // remove markdown symbols
      .replace(/https?:\/\/\S+/g, 'link')
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
      // Natural spoken abbreviations
      .replace(/\bPDV\b/gi, 'P. D. V.')
      .replace(/\bCRM\b/gi, 'C. R. M.')
      .replace(/\bIA\b/gi, 'I. A.')
      .replace(/\bPIX\b/gi, 'Pix')
      .replace(/\bNFC-e\b/gi, 'nota fiscal eletrônica')
      .replace(/\bWhatsApp\b/gi, 'WhatsApp')
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

  // Start real-time audio spectrum analysis loop
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

  // Speak with High-Fidelity Text-to-Speech
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

    // Mode: Instant Web Speech (if explicitly selected)
    if (engineMode === 'instant') {
      return this.speakWithWebSpeech(speechText, selectedVoice, speed, volume, options?.onEnd);
    }

    // Mode: High-Fidelity Studio Neural TTS (Gemini 3.8 Flash Lite TTS 24kHz)
    const cacheKey = `${selectedVoice}_${speechText.slice(0, 150).toLowerCase()}`;
    const localCached = this.clientAudioCache.get(cacheKey);

    // 1. FAST LOCAL CLIENT CACHE CHECK (0ms playback)
    if (localCached) {
      return await this.playBase64Audio(localCached, speed, volume, options?.onEnd);
    }

    // 2. SERVER TTS SYNTHESIS WITH SNAPPY 2.8s TIMEOUT
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speechText,
          voice: selectedVoice,
          style: options?.style,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          // Cache in client memory
          if (this.clientAudioCache.size >= this.MAX_CLIENT_CACHE) {
            const firstKey = this.clientAudioCache.keys().next().value;
            if (firstKey) this.clientAudioCache.delete(firstKey);
          }
          this.clientAudioCache.set(cacheKey, data.audioBase64);

          return await this.playBase64Audio(data.audioBase64, speed, volume, options?.onEnd);
        }
      }
    } catch (e) {
      console.warn('[VoiceNarration] Neural TTS exceeded timeout, switching smoothly to Web Speech', e);
    }

    // Graceful seamless fallback to Web Speech with Brazilian Portuguese neural voice
    return this.speakWithWebSpeech(speechText, selectedVoice, speed, volume, options?.onEnd);
  }

  // Play High-Fidelity Base64 WAV Audio through Web Audio mastering pipeline
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
        audio.playbackRate = Math.max(0.75, Math.min(1.5, speed));
        audio.volume = Math.max(0, Math.min(1, volume));

        // Connect audio to Web Audio API mastering chain
        try {
          const ctx = this.getAudioContext();
          if (ctx && this.compressor && !this.audioSourceNode) {
            this.audioSourceNode = ctx.createMediaElementSource(audio);
            this.audioSourceNode.connect(this.compressor);
          }
        } catch {
          // Fallback to standard audio output if routing is already connected
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

  // Fallback to Web Speech Synthesis with Brazilian Portuguese neural voice heuristics
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
      utterance.rate = Math.max(0.85, Math.min(1.3, speed));
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices();
      const ptBrVoices = voices.filter(v => {
        const lang = v.lang.replace('_', '-').toLowerCase();
        return lang.startsWith('pt-br') || lang.startsWith('pt');
      });

      if (voicePersona === 'feminino') {
        utterance.pitch = 1.04;
        // Prioritize natural neural Brazilian female voices
        const femaleVoice = ptBrVoices.find(v => 
          /francisca|leticia|luciana|helena|camila|maria|brenda|yara|female|mulher|google português/i.test(v.name)
        ) || ptBrVoices[0];
        if (femaleVoice) utterance.voice = femaleVoice;
      } else {
        // Masculino
        utterance.pitch = 0.94;
        // Prioritize natural neural Brazilian male voices
        const maleVoice = ptBrVoices.find(v => 
          /antonio|daniel|felipe|fabio|ricardo|luciano|male|homem/i.test(v.name)
        ) || ptBrVoices.find(v => !/francisca|leticia|luciana|helena|camila/i.test(v.name)) || ptBrVoices[0];
        if (maleVoice) utterance.voice = maleVoice;
      }

      // Simulated volume pulsing for visualizer during Web Speech
      let pulseInterval: any = null;
      utterance.onstart = () => {
        let toggle = false;
        pulseInterval = setInterval(() => {
          toggle = !toggle;
          this.volumeLevel = toggle ? 0.65 : 0.45;
          this.frequencyData = this.frequencyData.map(() => Math.random() * 0.7);
          this.notifyState();
        }, 120);
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

  // --- SPEECH RECOGNITION WITH ZERO DELAY & LIVE INTERIM ---
  public isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public startListening(callbacks: {
    onResult: (transcript: string) => void;
    onInterim?: (interim: string) => void;
    onError?: (error: any) => void;
    onEnd?: () => void;
  }): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      return false;
    }

    this.stopSpeaking();
    this.playChime('start');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      let lastFinalTranscript = '';
      let activeInterim = '';

      const finalizeAndSend = () => {
        const toSend = (lastFinalTranscript + ' ' + activeInterim).trim();
        if (toSend && toSend.length > 1) {
          this.interimTranscript = '';
          this.volumeLevel = 0;
          this.notifyState();
          this.stopListening();
          this.playChime('success');
          callbacks.onResult(toSend);
        }
      };

      this.recognition.onstart = () => {
        this.isListening = true;
        this.interimTranscript = '';
        this.volumeLevel = 0.5;
        this.notifyState();
      };

      this.recognition.onresult = (event: any) => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);

        let interim = '';
        let hasFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            lastFinalTranscript += ' ' + text;
            hasFinal = true;
          } else {
            interim += text;
          }
        }

        activeInterim = interim;
        const currentFull = (lastFinalTranscript + ' ' + interim).trim();
        this.interimTranscript = currentFull;
        this.volumeLevel = Math.min(1, 0.4 + (currentFull.length % 10) * 0.06);
        this.notifyState();
        callbacks.onInterim?.(currentFull);

        if (currentFull.length > 1) {
          const timeoutMs = hasFinal ? 280 : 450;
          this.silenceTimer = setTimeout(() => {
            finalizeAndSend();
          }, timeoutMs);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[SpeechRecognition Error]', event.error);
          this.isListening = false;
          this.volumeLevel = 0;
          this.notifyState();
          callbacks.onError?.(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.isListening = false;
        this.volumeLevel = 0;
        this.notifyState();
        callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Failed to start speech recognition', e);
      this.isListening = false;
      this.volumeLevel = 0;
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
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
    this.interimTranscript = '';
    this.volumeLevel = 0;
    this.notifyState();
  }
}

export const voiceNarration = new VoiceNarrationService();
