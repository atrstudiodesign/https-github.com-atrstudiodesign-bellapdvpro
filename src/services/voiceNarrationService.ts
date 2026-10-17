// Service for Neural Humanized Voice Narration in Portuguese (BR)
// Supports Instant Zero-Delay Web Speech with Natural Neural voices and Gemini TTS

export type VoicePersona = 'feminino' | 'masculino';
export type VoiceEngineMode = 'instant' | 'neural'; // 'instant' = 0ms latency, 'neural' = studio quality

export interface VoiceSettings {
  voice: VoicePersona;
  speed: number; // 0.8 to 1.3
  volume: number; // 0 to 1
  autoPlay: boolean;
  engineMode: VoiceEngineMode;
  handsFree: boolean; // Continuous conversational listening for operator
  soundEffects: boolean; // Subtle audio cues
}

type AudioStateListener = (state: { 
  isSpeaking: boolean; 
  isListening: boolean; 
  currentVoice: VoicePersona;
  interimTranscript: string;
  volumeLevel: number; // 0 to 1 for visualizer
}) => void;

class VoiceNarrationService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isListening = false;
  private interimTranscript = '';
  private volumeLevel = 0;
  private recognition: any = null;
  private silenceTimer: any = null;
  private listeners: Set<AudioStateListener> = new Set();
  private audioCtx: AudioContext | null = null;

  private settings: VoiceSettings = {
    voice: 'feminino',
    speed: 1.05, // slightly more agile for real-time cashier experience
    volume: 1.0,
    autoPlay: true,
    engineMode: 'instant', // default to instant for zero-wait response
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
    listener({ 
      isSpeaking: this.isSpeaking, 
      isListening: this.isListening, 
      currentVoice: this.settings.voice,
      interimTranscript: this.interimTranscript,
      volumeLevel: this.volumeLevel,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyState() {
    for (const listener of this.listeners) {
      listener({ 
        isSpeaking: this.isSpeaking, 
        isListening: this.isListening, 
        currentVoice: this.settings.voice,
        interimTranscript: this.interimTranscript,
        volumeLevel: this.volumeLevel,
      });
    }
  }

  // Soft Web Audio cues (synthesizer chimes with 0 external network requests)
  public playChime(type: 'start' | 'success' | 'stop') {
    if (!this.settings.soundEffects || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'start') {
        // High-tech two-tone listening beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(820, now + 0.1);
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
        gain.gain.setValueAtTime(0.06, now);
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
  private cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/[*_#`~>\[\]]/g, '') // remove markdown symbols
      .replace(/https?:\/\/\S+/g, 'link')
      // Humanize currency pronunciation
      .replace(/R\$\s*(\d{1,3}(?:\.\d{3})*),(\d{2})/g, (_m, intPart, decPart) => {
        const cleanInt = intPart.replace(/\./g, '');
        return decPart === '00' ? `${cleanInt} reais` : `${cleanInt} reais e ${parseInt(decPart, 10)} centavos`;
      })
      .replace(/R\$\s*(\d+)[,.](\d{2})/g, (_m, intPart, decPart) => {
        return decPart === '00' ? `${intPart} reais` : `${intPart} reais e ${parseInt(decPart, 10)} centavos`;
      })
      .replace(/R\$\s*(\d+)/g, '$1 reais')
      // Natural spoken abbreviations
      .replace(/\bPDV\b/gi, 'P.D.V.')
      .replace(/\bCRM\b/gi, 'C.R.M.')
      .replace(/\bIA\b/gi, 'I.A.')
      .replace(/\bPIX\b/gi, 'Pix')
      .replace(/\bWhatsApp\b/gi, 'WhatsApp')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public stopSpeaking() {
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
    this.notifyState();
  }

  // Speak immediately without delay
  public async speak(
    text: string,
    options?: {
      voice?: VoicePersona;
      speed?: number;
      volume?: number;
      mode?: VoiceEngineMode;
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

    // Stop previous audio
    this.stopSpeaking();

    this.isSpeaking = true;
    this.volumeLevel = 0.8;
    this.notifyState();
    options?.onStart?.();

    // Mode 1: Instant Web Speech (0ms latency, zero wait for operator)
    if (engineMode === 'instant') {
      return this.speakWithWebSpeech(speechText, selectedVoice, speed, volume, options?.onEnd);
    }

    // Mode 2: Neural Studio TTS with ultra-fast 1.2s fallback to Web Speech
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speechText,
          voice: selectedVoice,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          return await this.playBase64Audio(data.audioBase64, speed, volume, options?.onEnd);
        }
      }
    } catch {
      // Instant fallback to Web Speech with no disruption
    }

    // Fast fallback to Web Speech
    return this.speakWithWebSpeech(speechText, selectedVoice, speed, volume, options?.onEnd);
  }

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
        audio.playbackRate = speed;
        audio.volume = Math.max(0, Math.min(1, volume));

        audio.onended = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          this.volumeLevel = 0;
          this.notifyState();
          onEnd?.();
          resolve(true);
        };

        audio.onerror = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          this.volumeLevel = 0;
          this.notifyState();
          onEnd?.();
          resolve(false);
        };

        audio.play().catch(() => {
          this.isSpeaking = false;
          this.currentAudio = null;
          this.volumeLevel = 0;
          this.notifyState();
          onEnd?.();
          resolve(false);
        });
      } catch {
        this.isSpeaking = false;
        this.currentAudio = null;
        this.volumeLevel = 0;
        this.notifyState();
        onEnd?.();
        resolve(false);
      }
    });
  }

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

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.volumeLevel = 0;
        this.notifyState();
        onEnd?.();
        resolve(true);
      };

      utterance.onerror = (err) => {
        console.warn('[WebSpeech Error]', err);
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.volumeLevel = 0;
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
      this.recognition.continuous = true; // allow continuous stream so speech isn't cut prematurely
      this.recognition.interimResults = true; // live transcription as user speaks
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

        // Instant turn-taking:
        // If the browser already emitted a final result, finalize in 280ms
        // If interim, wait 480ms of silence to trigger instant execution!
        if (currentFull.length > 1) {
          const timeoutMs = hasFinal ? 280 : 480;
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
