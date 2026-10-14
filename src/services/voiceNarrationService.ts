// Service for Neural Humanized Voice Narration in Portuguese (BR)
// Supports both Gemini 3.8 Neural TTS and Brazilian Portuguese Web Speech Synthesis fallback

export type VoicePersona = 'feminino' | 'masculino';

export interface VoiceSettings {
  voice: VoicePersona;
  speed: number; // 0.8, 1.0, 1.25
  volume: number; // 0 to 1
  autoPlay: boolean;
}

type AudioStateListener = (state: { isSpeaking: boolean; isListening: boolean; currentVoice: VoicePersona }) => void;

class VoiceNarrationService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isListening = false;
  private recognition: any = null;
  private listeners: Set<AudioStateListener> = new Set();
  private settings: VoiceSettings = {
    voice: 'feminino',
    speed: 1.0,
    volume: 1.0,
    autoPlay: true,
  };

  constructor() {
    // Load persisted settings if available
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
    listener({ isSpeaking: this.isSpeaking, isListening: this.isListening, currentVoice: this.settings.voice });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyState() {
    for (const listener of this.listeners) {
      listener({ isSpeaking: this.isSpeaking, isListening: this.isListening, currentVoice: this.settings.voice });
    }
  }

  // Sanitize markdown text for clean speech pronunciation
  private cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/[*_#`~>\[\]]/g, '') // remove markdown symbols
      .replace(/https?:\/\/\S+/g, 'link') // replace links
      .replace(/R\$\s*(\d+)[,.](\d{2})/g, '$1 reais e $2 centavos') // natural currency reading
      .replace(/R\$\s*(\d+)/g, '$1 reais')
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
    this.notifyState();
  }

  public async speak(
    text: string,
    options?: {
      voice?: VoicePersona;
      speed?: number;
      volume?: number;
      onStart?: () => void;
      onEnd?: () => void;
    }
  ): Promise<boolean> {
    const selectedVoice = options?.voice || this.settings.voice;
    const speed = options?.speed ?? this.settings.speed;
    const volume = options?.volume ?? this.settings.volume;

    const speechText = this.cleanTextForSpeech(text);
    if (!speechText) return false;

    // Stop any current playback
    this.stopSpeaking();

    this.isSpeaking = true;
    this.notifyState();
    options?.onStart?.();

    // 1. Try Gemini Neural TTS Backend
    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speechText,
          voice: selectedVoice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          return await this.playBase64Audio(data.audioBase64, speed, volume, options?.onEnd);
        }
      }
    } catch (e) {
      console.warn('[VoiceNarration] Backend TTS unavailable, falling back to Web Speech API', e);
    }

    // 2. Fallback to Browser Speech Synthesis (Brazilian Portuguese)
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
          this.notifyState();
          onEnd?.();
          resolve(true);
        };

        audio.onerror = (err) => {
          console.warn('[Audio Playback Error]', err);
          this.isSpeaking = false;
          this.currentAudio = null;
          this.notifyState();
          onEnd?.();
          resolve(false);
        };

        audio.play().catch((playErr) => {
          console.warn('[Audio Autoplay Blocked]', playErr);
          this.isSpeaking = false;
          this.currentAudio = null;
          this.notifyState();
          onEnd?.();
          resolve(false);
        });
      } catch (err) {
        this.isSpeaking = false;
        this.currentAudio = null;
        this.notifyState();
        onEnd?.();
        resolve(false);
      }
    });
  }

  private speakWithWebSpeech(
    text: string,
    voicePersona: VoicePersona,
    speed: number,
    volume: number,
    onEnd?: () => void
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.isSpeaking = false;
        this.notifyState();
        onEnd?.();
        return resolve(false);
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      utterance.lang = 'pt-BR';
      utterance.rate = speed;
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices();
      const ptBrVoices = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('pt'));

      if (voicePersona === 'feminino') {
        utterance.pitch = 1.1;
        const femaleVoice = ptBrVoices.find(v => 
          /francisca|maria|luciana|leticia|helena|camila|female|mulher|brasil/i.test(v.name)
        ) || ptBrVoices[0];
        if (femaleVoice) utterance.voice = femaleVoice;
      } else {
        // Masculino
        utterance.pitch = 0.88;
        const maleVoice = ptBrVoices.find(v => 
          /antonio|daniel|felipe|luciano|ricardo|male|homem|google português/i.test(v.name)
        ) || ptBrVoices.find(v => !/francisca|maria|luciana|helena/i.test(v.name)) || ptBrVoices[0];
        if (maleVoice) utterance.voice = maleVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notifyState();
        onEnd?.();
        resolve(true);
      };

      utterance.onerror = (err) => {
        console.warn('[WebSpeech Error]', err);
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notifyState();
        onEnd?.();
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // --- SPEECH RECOGNITION (Falar em Português) ---
  public isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public startListening(callbacks: {
    onResult: (transcript: string) => void;
    onError?: (error: any) => void;
    onEnd?: () => void;
  }): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      return false;
    }

    this.stopSpeaking();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.notifyState();
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          callbacks.onResult(transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('[SpeechRecognition Error]', event.error);
        this.isListening = false;
        this.notifyState();
        callbacks.onError?.(event.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notifyState();
        callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Failed to start speech recognition', e);
      this.isListening = false;
      this.notifyState();
      return false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
    this.notifyState();
  }
}

export const voiceNarration = new VoiceNarrationService();
