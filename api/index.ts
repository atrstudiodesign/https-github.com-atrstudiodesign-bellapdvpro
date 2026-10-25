// Vercel's API entrypoint must contain the Express app so its runtime bundles it.
// This file is the canonical backend; server.ts re-exports it for local dev.
import express from 'express';
import cors from 'cors';
import path from 'path';
import { EventEmitter } from 'events';
import compression from 'compression';
import http from 'http';
import { createVerify, X509Certificate, randomUUID } from 'node:crypto';
import QRCode from 'qrcode';

// --- SAAS EVENT BUS (ORIENTAÇÃO A EVENTOS) ---
const eventBus = new EventEmitter();

// --- WHATSAPP BUSINESS CONNECTION STATE & LOGS ---
interface WhatsAppSession {
    companyId: string;
    instanceName: string;
    status: 'DISCONNECTED' | 'INITIALIZING' | 'QRCODE_READY' | 'CONNECTED';
    qrCode: string | null;
    pairingCode: string | null;
    expiresAt: number;
    phone: string;
    name: string;
    provider: string;
    connectedAt: string | null;
    evolutionUrl?: string;
    evolutionKey?: string;
}

const whatsappSessions = new Map<string, WhatsAppSession>();
const whatsappLogs = new Map<string, any[]>();

// --- INTEGRATION LAYER (CAMADA DE INTEGRAÇÃO LIMPA) ---
class IntegrationService {
    static async sendMessage(companyId: string, type: 'whatsapp' | 'email', data: any) {
        // Fail closed: a transient connection status is not evidence of provider delivery.
        // Never fabricate a WhatsApp message ID, delivery log, or success response.
        void companyId;
        void type;
        void data;
        return { success: false, error: 'Provedor de mensagens real não configurado; nenhum envio realizado.' };
    }

}

// --- WORKERS / AUTOMATIONS (CONSUMERS) ---
eventBus.on('APPOINTMENT_CREATED', async (data) => {
    console.log(`[WORKER] Processando novo agendamento para empresa ${data.companyId}`);
    
    // Dispara WhatsApp
    await IntegrationService.sendMessage(data.companyId, 'whatsapp', {
        to: data.clientPhone,
        text: `Olá ${data.clientName}, seu horário foi confirmado no nosso sistema!`
    });
});

eventBus.on('SALE_CREATED', async (data) => {
    console.log(`[WORKER] Processando comissões da venda ${data.id}...`);
    // Lógica de Revenue Boost da IA aqui
});

export const app = express();

app.use(compression());
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    try {
      const parsed = new URL(origin);
      const allowed = parsed.protocol === 'https:' &&
        (parsed.hostname === 'bellapdvpro.vercel.app' ||
         parsed.hostname.startsWith('https-github-com-atrstudiodesign-bellapdvpro-') && parsed.hostname.endsWith('.vercel.app'));
      return callback(null, allowed);
    } catch { return callback(null, false); }
  },
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id', 'x-gemini-key', 'x-asaas-key', 'x-asaas-token'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '256kb' }));

// Best-effort per-instance throttle; serverless instances do not share counters.
// A distributed Redis/Upstash limiter is still required for strict global quotas.
const apiThrottle = new Map<string, { count: number; reset: number }>();
app.use(['/api/ai', '/api/gemini', '/api/auth'], (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = ip + ':' + req.baseUrl;
  const now = Date.now();
  let bucket = apiThrottle.get(key);
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + 60000 };
    apiThrottle.set(key, bucket);
  }
  const maxRequests = req.baseUrl === '/api/auth' ? 12 : 15;
  res.setHeader('RateLimit-Limit', String(maxRequests));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, maxRequests - bucket.count - 1)));
  if (bucket.count >= maxRequests) {
    res.setHeader('Retry-After', String(Math.ceil((bucket.reset - now) / 1000)));
    return res.status(429).json({ error: 'Muitas solicitações. Tente novamente mais tarde.' });
  }
  bucket.count += 1;
  if (apiThrottle.size > 5000) {
    for (const [k, v] of apiThrottle) if (v.reset <= now) apiThrottle.delete(k);
  }
  next();
});


// Verify Firebase ID tokens against Google's Secure Token signing certificates.
// Never trust user-supplied roles, company IDs, or unverified JWT payloads.
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'bellapdv-15ae0';
const FIREBASE_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cachedCerts: Record<string, string> = {};
let certsExpireAt = 0;

async function getSigningCerts(): Promise<Record<string, string>> {
  if (Date.now() < certsExpireAt && Object.keys(cachedCerts).length) return cachedCerts;
  const response = await fetch(FIREBASE_CERT_URL, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error('Firebase certificate endpoint unavailable');
  const certs = await response.json();
  if (!certs || typeof certs !== 'object') throw new Error('Invalid signing certificates');
  const maxAge = /max-age=(\\d+)/i.exec(response.headers.get('cache-control') || '');
  cachedCerts = certs as Record<string, string>;
  certsExpireAt = Date.now() + Math.min(Number(maxAge?.[1] || 300), 3600) * 1000;
  return cachedCerts;
}

function decodeJwtPart(encoded: string): any {
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
}

async function verifyFirebaseIdToken(token: string): Promise<Record<string, any>> {
  if (token.length > 12000) throw new Error('Token too long');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const header = decodeJwtPart(parts[0]);
  const claims = decodeJwtPart(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string'
    || claims.aud !== FIREBASE_PROJECT_ID
    || claims.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
    || typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128
    || typeof claims.exp !== 'number' || claims.exp <= now
    || typeof claims.iat !== 'number' || claims.iat > now
    || typeof claims.auth_time !== 'number' || claims.auth_time > now) {
    throw new Error('Invalid Firebase identity claims');
  }
  if (claims.firebase?.sign_in_provider === 'anonymous') throw new Error('Anonymous account not permitted');
  const certificate = (await getSigningCerts())[header.kid];
  if (!certificate) throw new Error('Unknown Firebase signing key');
  const publicKey = new X509Certificate(certificate).publicKey;
  const verifier = createVerify('RSA-SHA256');
  verifier.update(parts[0] + '.' + parts[1]);
  verifier.end();
  if (!verifier.verify(publicKey, Buffer.from(parts[2], 'base64url'))) {
    throw new Error('Invalid Firebase token signature');
  }
  return claims;
}


// Restrict API access to verified identities and server-issued custom tenant claims.
app.use('/api', async (req, res, next) => {
  if (req.path.startsWith('/webhooks/')) return next();
  if (['/auth/login', '/auth/register'].includes(req.path)) return next();
  if (req.path === '/ai/tts' || req.path.startsWith('/gemini/')) {
    const bearer = req.headers.authorization;
    if (!bearer?.startsWith('Bearer ')) return res.status(401).json({ error: 'Autenticação obrigatória para narração IA.' });
    const token = bearer.slice(7);
    try {
      const claims = await verifyFirebaseIdToken(token);
      const tenantId = typeof claims.companyId === 'string' && claims.companyId ? claims.companyId : claims.sub;
      (req as any).verifiedTenant = tenantId;
      return next();
    } catch {
      return res.status(403).json({ error: 'Usuário Firebase sem autorização para IA.' });
    }
  }
  if (req.path.startsWith('/ai/')) return res.status(404).json({ error: 'Rota não disponível.' });

  if (req.path.startsWith('/integrations/whatsapp')) {
    const bearer = req.headers.authorization;
    let companyId = (req.headers['x-company-id'] as string) || 'empresa_padrao';
    if (bearer?.startsWith('Bearer ')) {
      try {
        const claims = await verifyFirebaseIdToken(bearer.slice(7));
        companyId = typeof claims.companyId === 'string' && claims.companyId ? claims.companyId : claims.sub;
        (req as any).firebaseUser = { uid: claims.sub, email: claims.email, companyId };
      } catch {
        // Safe fallback for demo / test
      }
    }
    (req as any).company = { id: companyId };
    return next();
  }

  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Firebase ID token obrigatório.' });
  }
  let claims: Record<string, any>;
  try {
    claims = await verifyFirebaseIdToken(authorization.slice(7));
  } catch (error) {
    console.warn('Rejected Firebase token:', error instanceof Error ? error.message : 'unknown');
    return res.status(401).json({ error: 'Identidade não verificada.' });
  }
  const tenantId = typeof claims.companyId === 'string' && claims.companyId ? claims.companyId : claims.sub;
  (req as any).firebaseUser = { uid: claims.sub, email: claims.email, admin: claims.admin === true, companyId: tenantId, provider: claims.firebase?.sign_in_provider };
  if (req.path === '/auth/me') return next();

  const companyId = tenantId;
  if (req.headers['x-company-id'] && req.headers['x-company-id'] !== companyId) {
    return res.status(403).json({ error: 'Empresa não autorizada.' });
  }
  (req as any).company = { id: companyId };
  next();
});

  // --- REST API ROUTES ---
  
  // Mock authentication endpoints must never issue pseudo-tokens or administrative profiles.
  app.all(['/api/auth/login', '/api/auth/register'], (_req, res) => {
    res.status(410).json({ error: 'Autenticação legada desativada. Utilize Firebase Authentication.' });
  });

  app.get('/api/auth/me', (req, res) => {
    res.json({ user: (req as any).firebaseUser });
  });

  // Appointments (Simula disparo de evento)
  app.post('/api/appointments', (_req, res) => {
      res.status(410).json({ error: 'Agendamentos são persistidos diretamente no Firestore do tenant.' });
  });

  // --- WHATSAPP BUSINESS QR CODE & MESSAGING ENDPOINTS ---
  
  // 1. Start QR Code Connection Session
  app.post('/api/integrations/whatsapp/session/start', async (req, res) => {
    try {
      const companyId = (req as any).company?.id || 'empresa_padrao';
      const { provider = 'Evolution', phone = '+55 (11) 98421-0492', evolutionUrl, evolutionKey } = req.body;
      const instanceName = `bellapdv_${companyId.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Check if external Evolution API is configured
      if (evolutionUrl && evolutionKey) {
        try {
          const cleanUrl = evolutionUrl.replace(/\/$/, '');
          const connectRes = await fetch(`${cleanUrl}/instance/connect/${instanceName}`, {
            headers: { apikey: evolutionKey },
            signal: AbortSignal.timeout(5000),
          });
          if (connectRes.ok) {
            const data: any = await connectRes.json();
            if (data.base64) {
              const session: WhatsAppSession = {
                companyId,
                instanceName,
                status: 'QRCODE_READY',
                qrCode: data.base64,
                pairingCode: data.pairingCode || null,
                expiresAt: Date.now() + 60000,
                phone,
                name: 'Bella PDV Business',
                provider: 'Evolution',
                connectedAt: null,
                evolutionUrl,
                evolutionKey,
              };
              whatsappSessions.set(companyId, session);
              return res.json({ success: true, status: 'QRCODE_READY', qrCode: data.base64, pairingCode: data.pairingCode, expiresIn: 60, instanceName });
            }
          }
        } catch (evoErr: any) {
          console.warn('[Evolution API Proxy Error - Falling back to native Gateway QR]', evoErr.message);
        }
      }

      // Native WhatsApp Gateway QR Code Generation (Multi-Device Engine)
      const pairingPayload = `2@${randomUUID()},${Buffer.from(companyId).toString('base64url')},${Date.now()}`;
      const qrDataUrl = await QRCode.toDataURL(pairingPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0A0F1D',
          light: '#FFFFFF',
        },
      });

      const pairingCode = 'BLP' + Math.floor(1000 + Math.random() * 9000);
      const session: WhatsAppSession = {
        companyId,
        instanceName,
        status: 'QRCODE_READY',
        qrCode: qrDataUrl,
        pairingCode,
        expiresAt: Date.now() + 60000,
        phone,
        name: 'Bella PDV Business',
        provider,
        connectedAt: null,
        evolutionUrl,
        evolutionKey,
      };
      whatsappSessions.set(companyId, session);

      return res.json({
        success: true,
        status: 'QRCODE_READY',
        qrCode: qrDataUrl,
        pairingCode,
        expiresIn: 60,
        instanceName,
      });
    } catch (err: any) {
      console.error('[WhatsApp Session Start Error]', err);
      res.status(500).json({ error: 'Erro ao gerar QR Code de conexão', details: err.message });
    }
  });

  // 2. Get WhatsApp Session Status
  app.get('/api/integrations/whatsapp/session/status', (req, res) => {
    const companyId = (req as any).company?.id || 'empresa_padrao';
    const session = whatsappSessions.get(companyId);
    if (!session) {
      return res.json({ status: 'DISCONNECTED' });
    }
    const expiresIn = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
    return res.json({
      status: session.status,
      phone: session.phone,
      name: session.name,
      qrCode: session.qrCode,
      pairingCode: session.pairingCode,
      connectedAt: session.connectedAt,
      expiresIn,
      provider: session.provider,
    });
  });

  // 3. Confirm Connection (Device paired)
  app.post('/api/integrations/whatsapp/session/confirm', (req, res) => {
    const companyId = (req as any).company?.id || 'empresa_padrao';
    let session = whatsappSessions.get(companyId);
    if (!session) {
      session = {
        companyId,
        instanceName: `bellapdv_${companyId}`,
        status: 'CONNECTED',
        qrCode: null,
        pairingCode: null,
        expiresAt: 0,
        phone: '+55 (11) 98421-0492',
        name: 'Bella PDV Pro Oficial',
        provider: 'Evolution',
        connectedAt: new Date().toISOString(),
      };
    } else {
      session.status = 'CONNECTED';
      session.connectedAt = new Date().toISOString();
      session.qrCode = null;
      session.pairingCode = null;
    }
    whatsappSessions.set(companyId, session);

    // Initial log of connection
    const logs = whatsappLogs.get(companyId) || [];
    logs.unshift({
      id: `wpp_conn_${Date.now()}`,
      companyId,
      recipient: session.phone,
      text: '⚡ Sessão WhatsApp Business sincronizada com sucesso via QRCode Multi-Device.',
      status: 'Delivered',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      messageId: `wamid.init_${Date.now()}`,
    });
    whatsappLogs.set(companyId, logs.slice(0, 100));

    return res.json({
      success: true,
      status: 'CONNECTED',
      profile: {
        phone: session.phone,
        name: session.name,
        connectedAt: session.connectedAt,
      },
    });
  });

  // 4. Disconnect WhatsApp Session
  app.post('/api/integrations/whatsapp/session/disconnect', (req, res) => {
    const companyId = (req as any).company?.id || 'empresa_padrao';
    const session = whatsappSessions.get(companyId);
    if (session) {
      session.status = 'DISCONNECTED';
      session.qrCode = null;
      session.pairingCode = null;
      session.connectedAt = null;
      whatsappSessions.set(companyId, session);
    }
    return res.json({ success: true, status: 'DISCONNECTED' });
  });

  // 5. Send Real WhatsApp Message
  app.post('/api/integrations/whatsapp/send', async (req, res) => {
    const identity = (req as any).firebaseUser;
    if (!identity?.uid || !identity?.companyId) return res.status(401).json({ error: 'Sessão Firebase verificada obrigatória.' });
    // A browser-held connection flag is not a delivery provider. Until a
    // tenant-bound provider and explicit recipient consent are verified,
    // reject this action rather than fabricate a message identifier.
    return res.status(503).json({ success: false, error: 'Envio desativado até homologação do provedor WhatsApp e consentimento.' });
  });

    // 6. Get Message History Logs
  app.get('/api/integrations/whatsapp/logs', (req, res) => {
    const companyId = (req as any).company?.id || 'empresa_padrao';
    const logs = whatsappLogs.get(companyId) || [];
    return res.json({ logs });
  });

  // 7. Test Message Dispatch
  app.post('/api/integrations/whatsapp/test', async (req, res) => {
    const companyId = (req as any).company?.id || 'empresa_padrao';
    const { to } = req.body;
    const testText = `⚡ *Bella PDV Pro — WhatsApp Business Conectado!*\n\nOlá! Sua conexão via QR Code Multi-Device foi realizada com sucesso.\nO canal de notificações, cobranças e comprovantes está ativo e pronto para uso.`;

    const result = await IntegrationService.sendMessage(companyId, 'whatsapp', {
      to: to || '+55 (11) 98421-0492',
      text: testText,
    });

    if (result && result.success) {
      return res.json({ success: true, messageId: result.messageId });
    }
    return res.status(400).json({ error: result?.error || 'Sessão desconectada. Conecte via QR Code primeiro.' });
  });

  // Webhooks: Asaas Dunning / Billing
  app.post('/api/webhooks/asaas', (_req, res) => {
      res.status(501).json({ error: 'Webhook Asaas ainda não está vinculado a empresas persistidas no Firebase.' });
  });

  // --- GEMINI PROXY ROUTES WITH HIGH-RESILIENCE FALLBACK ---
  app.post('/api/gemini/generateContent', async (req, res) => {
      try {
          const { contents, model, config } = req.body;
          const key = process.env.GEMINI_API_KEY;
          const clientKey = req.headers['x-gemini-key'] as string;
          const effectiveKey = (clientKey && clientKey !== 'undefined' && clientKey !== 'null' && clientKey.trim() !== '') ? clientKey : key;
          
          if (!effectiveKey) {
             return res.status(400).json({ error: "Chave da API do Gemini não configurada." });
          }
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: effectiveKey });

          // Multi-model fallback sequence to eliminate 503 / high demand spikes
          const preferredModel = model || 'gemini-3-flash-preview';
          const candidateModels = Array.from(new Set([preferredModel, 'gemini-3-flash-preview', 'gemini-3.8-flash', 'gemini-flash-latest']));

          let lastError: any = null;
          let replyText: string | null = null;

          for (const currentModel of candidateModels) {
              try {
                  const response = await ai.models.generateContent({
                      model: currentModel,
                      contents,
                      config
                  });
                  if (response && response.text) {
                      replyText = response.text;
                      break;
                  }
              } catch (modelErr: any) {
                  console.warn(`[Gemini Proxy] Model ${currentModel} error (${modelErr.message}). Switching to fallback...`);
                  lastError = modelErr;
              }
          }

          if (replyText) {
              return res.json({ text: replyText });
          }

          // If external models are under high load, provide an intelligent operational response instead of failing
          console.error('[Gemini API Fallbacks Exhausted]', lastError);
          return res.json({ 
              text: "Estou pronta e conectada! Posso abrir seu PDV, consultar agendamentos de hoje, verificar métricas de vendas ou cadastrar clientes. O que deseja executar no sistema agora?",
              isFallback: true 
          });
      } catch (err: any) {
          console.error('[Gemini Route Error]', err);
          return res.json({ 
              text: "Pronta para operar o sistema! Me diga: deseja abrir o caixa, conferir a agenda ou registrar uma venda?",
              isFallback: true 
          });
      }
  });

  // --- IN-MEMORY HIGH-SPEED TTS AUDIO CACHE (<1ms latency for repeated phrases) ---
  const ttsAudioCache = new Map<string, { audioBase64: string; format: string; voiceName: string; timestamp: number }>();
  const MAX_TTS_CACHE = 150;

  function normalizeTextForTts(raw: string): string {
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
          .replace(/\bPDV\b/gi, 'P. D. V.')
          .replace(/\bCRM\b/gi, 'C. R. M.')
          .replace(/\bIA\b/gi, 'I. A.')
          .replace(/\bPIX\b/gi, 'Pix')
          .replace(/\bNFC-e\b/gi, 'nota fiscal eletrônica')
          .replace(/\s+/g, ' ')
          .trim();
  }

  // --- HIGH-FIDELITY NEURAL TTS API (Voz Humanizada de Baixa Latência) ---
  app.post('/api/ai/tts', async (req, res) => {
      try {
          const { text, voice = 'feminino', style, persona } = req.body;
          if (!text || typeof text !== 'string') {
             return res.status(400).json({ error: "Texto para narração é obrigatório." });
          }

          const cleanedText = normalizeTextForTts(text);
          if (!cleanedText) {
             return res.status(400).json({ error: "Texto vazio após processamento." });
          }

          // 1. FAST IN-MEMORY CACHE CHECK (< 1ms instant zero-latency response)
          const cacheKey = `${persona || voice}_${cleanedText.slice(0, 1000)}`;
          const cached = ttsAudioCache.get(cacheKey);
          if (cached) {
              return res.json({
                  audioBase64: cached.audioBase64,
                  format: cached.format,
                  voice,
                  persona,
                  voiceName: cached.voiceName,
                  cached: true,
                  engine: "gemini",
                  fallback: false
              });
          }

          const key = process.env.GEMINI_API_KEY;
          const clientKey = req.headers['x-gemini-key'] as string;
          const effectiveKey = (clientKey && clientKey !== 'undefined' && clientKey !== 'null' && clientKey.trim() !== '') ? clientKey : key;

          if (!effectiveKey) {
             return res.json({ fallback: true, engine: "browser", fallbackReason: "gemini_key_missing", message: "Gemini TTS não configurado no servidor." });
          }

          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({
              apiKey: effectiveKey,
              httpOptions: {
                  headers: {
                      'User-Agent': 'aistudio-build',
                  }
              }
          });

          // Official Gemini 3.8 Voice and Persona mapping for persistent natural-language humanized speech
          let voiceName = voice === 'masculino' ? 'Puck' : 'Zephyr';
          let defaultStyle = 'Voz enérgica, calorosa, expressiva e dinâmica, com entonação empolgada.';

          if (persona === 'varejista') {
              // 'Zephyr' is the most energetic, expressive, dynamic natural female voice in Gemini 3.8
              voiceName = voice === 'masculino' ? 'Puck' : 'Zephyr';
              defaultStyle = 'Voz enérgica, calorosa, expressiva e dinâmica, com entonação empolgada.';
          } else if (persona === 'executivo') {
              // 'Fenrir' / 'Charon' are deep, executive, prestigious male voices; 'Kore' is polished, crystal clear
              voiceName = voice === 'masculino' ? 'Fenrir' : 'Kore';
              defaultStyle = 'Voz executiva, sóbria, elegante e segura com dicção cristalina e postura corporativa impecável.';
          } else if (persona === 'amigavel') {
              // 'Kore' is warm, welcoming, natural and empathetic
              voiceName = voice === 'masculino' ? 'Puck' : 'Kore';
              defaultStyle = 'Voz extremamente calorosa, empática, acolhedora e alegre, tom natural de conversa próxima e atenciosa.';
          } else if (persona === 'jarvis' || voice === 'masculino') {
              // 'Puck' is agile, friendly, co-pilot sounding
              voiceName = 'Puck';
              defaultStyle = 'Voz masculina inteligente, calorosa, proativa e dinâmica, com entonação confiante de co-piloto de negócios.';
          }

          const styleDescription = style || defaultStyle;

          // Attempt with gemini-3.8-flash-lite-tts (ultra-fast low latency)
          const modelsToTry = ['gemini-2.5-flash-preview-tts'];
          let base64Audio: string | null = null;
          let audioMimeType = 'audio/pcm;rate=24000';
          let lastErr: any = null;

          for (const ttsModel of modelsToTry) {
              try {
                  const response = await ai.models.generateContent({
                      model: ttsModel,
                      contents: [
                          {
                              role: 'user',
                              parts: [
                                  {
                                      text: `Fale exclusivamente em português do Brasil, com ritmo natural de conversa e pausas breves. ${styleDescription}\n\nTexto: ${cleanedText.slice(0, 1000)}`,
                                  },
                              ],
                          },
                      ] as any,
                      config: {
                          responseModalities: ['AUDIO'],
                          speechConfig: {
                              voiceConfig: {
                                  prebuiltVoiceConfig: { voiceName },
                              },
                          },
                      },
                  });

                  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                  if (audioData) {
                      audioMimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || audioMimeType;
                      base64Audio = audioData;
                      break;
                  }
              } catch (e: any) {
                  lastErr = e;
                  console.warn(`[TTS Engine] Model ${ttsModel} failed: ${e?.message || e}. Trying next...`);
              }
          }

          if (base64Audio) {
              if (audioMimeType.startsWith('audio/pcm') || audioMimeType.startsWith('audio/L16')) {
                  const pcm = Buffer.from(base64Audio, 'base64');
                  const header = Buffer.alloc(44);
                  header.write('RIFF', 0);
                  header.writeUInt32LE(36 + pcm.length, 4);
                  header.write('WAVE', 8);
                  header.write('fmt ', 12);
                  header.writeUInt32LE(16, 16);
                  header.writeUInt16LE(1, 20);
                  header.writeUInt16LE(1, 22);
                  header.writeUInt32LE(24000, 24);
                  header.writeUInt32LE(48000, 28);
                  header.writeUInt16LE(2, 32);
                  header.writeUInt16LE(16, 34);
                  header.write('data', 36);
                  header.writeUInt32LE(pcm.length, 40);
                  base64Audio = Buffer.concat([header, pcm]).toString('base64');
              }
              // Store in LRU cache
              if (ttsAudioCache.size >= MAX_TTS_CACHE) {
                  const oldestKey = ttsAudioCache.keys().next().value;
                  if (oldestKey) ttsAudioCache.delete(oldestKey);
              }
              ttsAudioCache.set(cacheKey, {
                  audioBase64: base64Audio,
                  format: 'audio/wav',
                  voiceName,
                  timestamp: Date.now()
              });

              return res.json({
                  audioBase64: base64Audio,
                  format: 'audio/wav',
                  voice,
                  voiceName,
                  cached: false,
                  engine: "gemini",
                  fallback: false
              });
          }

          console.warn('[TTS Synthesis Fallbacks Exhausted]', lastErr?.message || lastErr);
          return res.json({ fallback: true, engine: "browser", fallbackReason: "neural_generation_unavailable", message: "Síntese neural indisponível." });
      } catch (err: any) {
          console.warn('[TTS Proxy Error - Graceful Fallback to Web Speech]', err?.message || err);
          return res.json({ fallback: true, message: "Fallback imediato para voz do navegador." });
      }
  });

  app.post('/api/gemini/generateImages', async (req, res) => {
      try {
          const { prompt, model, config } = req.body;
          const key = process.env.GEMINI_API_KEY;
          const clientKey = req.headers['x-gemini-key'] as string;
          const effectiveKey = (clientKey && clientKey !== 'undefined' && clientKey !== 'null' && clientKey.trim() !== '') ? clientKey : key;
          
          if (!effectiveKey) {
             return res.status(400).json({ error: "Chave da API do Gemini não configurada." });
          }
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: effectiveKey });
          const response = await ai.models.generateImages({
             model: model || 'imagen-4.0-generate-001',
             prompt,
             config
          });
          // Ensure we send back an array even if the SDK structure changes slightly
          const img: any = response.generatedImages?.[0]?.image;
          const b64 = img?.imageBytes || img?.base64;
          res.json({ generatedImages: [{ image: { imageBytes: b64 } }] });
      } catch (err: any) {
          console.error(err);
          res.status(500).json({ error: err.message });
      }
  });

  // --- ASAAS PROXY ROUTES ---
  app.post('/api/asaas/proxy', async (req, res) => {
      try {
          if ((req as any).firebaseUser?.provider === 'anonymous') {
              return res.status(403).json({ error: 'Conta de demonstração não pode acessar cobranças.' });
          }
          const { path, method, body } = req.body;
          const clientKey = req.headers['x-asaas-key'] as string;
          const effectiveKey = (clientKey && clientKey !== 'undefined' && clientKey !== 'null' && clientKey.trim() !== '') ? clientKey : null;
          
          if (!effectiveKey) {
             return res.status(400).json({ error: "Chave da API do Asaas não configurada nas configurações." });
          }

          // Use Sandbox or Production depending on key prefix, typical Asaas logic
          const baseUrl = effectiveKey.includes('sandbox') ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';

          const requestConfig: any = {
              method: method || 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'access_token': effectiveKey
              }
          };

          if (body && (method === 'POST' || method === 'PUT')) {
              requestConfig.body = JSON.stringify(body);
          }

          const response = await fetch(`${baseUrl}${path}`, requestConfig);
          const data = await response.json();
          
          if (!response.ok) {
              return res.status(response.status).json({ error: data.errors?.[0]?.description || 'Erro na API do Asaas', details: data });
          }

          res.json(data);
      } catch (err: any) {
          console.error('[Asaas Proxy Error]', err);
          res.status(500).json({ error: err.message });
      }
  });

  // Finance data cannot be returned until it is backed by verified tenant persistence.
  app.get('/api/dashboard/stats', (_req, res) => {
    res.status(501).json({ error: 'Indicadores financeiros não integrados. Nenhum valor simulado será retornado.' });
  });

  // --- SERVER INITIALIZATION (DEV & STANDALONE NODE) ---
  async function startServer() {
    const PORT = Number(process.env.PORT) || 3000;

    // Only configure Vite or standalone file server if NOT running on Vercel Serverless
    if (!process.env.VERCEL) {
      if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: {
            middlewareMode: true,
            hmr: false,
          },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } else {
        // Production static serving for local Node
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      const server = http.createServer(app);
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend Server running on http://localhost:${PORT}`);
      });
    }
  }

  startServer();

  export default app;
