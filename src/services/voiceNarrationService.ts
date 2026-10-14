// Service for Neural Humanized Voice Narration in Portuguese (BR)
// Supports both Instant Zero-Delay Web Speech and Gemini Neural TTS with automatic silence detection

export type VoicePersona = 'feminino' | 'masculino';
export type VoiceEngineMode = 'instant' | 'neural'; // 'instant' = 0ms latency, 'neural' = studio quality

export interface VoiceSettings {
  voice: VoicePersona;
  speed: number; // 0.8, 1.0, 1.25
  volume: number; // 0 to 1
  autoPlay: boolean;
  engineMode: VoiceEngineMode;
  handsFree: boolean; // Continuous listening for operator
}

type AudioStateListener = (state: { 
  isSpeaking: boolean; 
  isListening: boolean; 
  currentVoice: VoicePersona;
  interimTranscript: string;
}) => void;

class VoiceNarrationService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isListening = false;
  private interimTranscript = '';
  private recognition: any = null;
  private silenceTimer: any = null;
  private listeners: Set<AudioStateListener> = new Set();
  private settings: VoiceSettings = {
    voice: 'feminino',
    speed: 1.05, // slightly more agile for real-time cashier experience
    volume: 1.0,
    autoPlay: true,
    engineMode: 'instant', // default to instant for zero-wait response
    handsFree: false,
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
      interimTranscript: this.interimTranscript
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
        interimTranscript: this.interimTranscript
      });
    }
  }

  // Clean markdown for spoken pronunciation
  private cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/[*_#`~>\[\]]/g, '') // remove markdown symbols
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/R\$\s*(\d+)[,.](\d{2})/g, '$1 reais e $2 centavos')
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
    this.notifyState();
    options?.onStart?.();

    // Mode 1: Instant Web Speech (0ms latency, zero wait for cashier)
    if (engineMode === 'instant') {
      return this.speakWithWebSpeech(speechText, selectedVoice, speed, volume, options?.onEnd);
    }

    // Mode 2: Neural Studio TTS with ultra-fast 1.5s fallback to Web Speech
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

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
    } catch (e) {
      console.warn('[VoiceNarration] Neural TTS exceeded 1.5s, switching instantly to Web Speech', e);
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
        this.notifyState();
        onEnd?.();
        return resolve(false);
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      utterance.lang = 'pt-BR';
      utterance.rate = Math.max(0.8, Math.min(1.4, speed));
      utterance.volume = volume;

      const voices = window.speechSynthesis.getVoices();
      const ptBrVoices = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('pt'));

      if (voicePersona === 'feminino') {
        utterance.pitch = 1.08;
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
          this.notifyState();
          this.stopListening();
          callbacks.onResult(toSend);
        }
      };

      this.recognition.onstart = () => {
        this.isListening = true;
        this.interimTranscript = '';
        this.notifyState();
      };

      this.recognition.onresult = (event: any) => {
        // Reset silence timer on every new speech event
        if (this.silenceTimer) clearTimeout(this.silenceTimer);

        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            lastFinalTranscript += ' ' + text;
          } else {
            interim += text;
          }
        }

        activeInterim = interim;
        const currentFull = (lastFinalTranscript + ' ' + interim).trim();
        this.interimTranscript = currentFull;
        this.notifyState();
        callbacks.onInterim?.(currentFull);

        // Immediate silence detection (600ms of silence triggers instant execution!)
        if (currentFull.length > 2) {
          this.silenceTimer = setTimeout(() => {
            finalizeAndSend();
          }, 650);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('[SpeechRecognition Error]', event.error);
        if (event.error !== 'no-speech') {
          this.isListening = false;
          this.notifyState();
          callbacks.onError?.(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
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
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
    this.interimTranscript = '';
    this.notifyState();
  }
}

export const voiceNarration = new VoiceNarrationService();
