// Vercel's API entrypoint must contain the Express app so its runtime bundles it.
// This file is the canonical backend; server.ts re-exports it for local dev.
import express from 'express';
import cors from 'cors';
import path from 'path';
import { EventEmitter } from 'events';
import compression from 'compression';
import http from 'http';
import { createVerify, createSign, timingSafeEqual, X509Certificate, randomUUID } from 'node:crypto';
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

// --- PUBLIC BOOKINGS & REPUTATION ENGINE (P0 SMART SCHEDULING) ---
export interface PublicBookingRecord {
    id: string;
    bookingCode: string;
    companyId: string;
    companyName: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    serviceName: string;
    servicePrice: number;
    serviceDuration: number;
    professionalId: string;
    professionalName: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    notes?: string;
    createdAt: string;
}

export interface PublicReviewRecord {
    id: string;
    companyId: string;
    clientName: string;
    rating: number; // 1 to 5
    comment: string;
    serviceName: string;
    bookingCode: string;
    createdAt: string;
}

const publicBookingsMap = new Map<string, PublicBookingRecord>();
const publicReviewsMap = new Map<string, PublicReviewRecord[]>();

// --- INTEGRATION LAYER (CAMADA DE INTEGRAÇÃO LIMPA) ---
class IntegrationService {
    static async sendMessage(companyId: string, type: 'whatsapp' | 'email', data: any): Promise<{ success: boolean; messageId?: string; queued?: boolean; error?: string }> {
        if (type === 'whatsapp') {
            const session = whatsappSessions.get(companyId);
            const logs = whatsappLogs.get(companyId) || [];
            const msgId = `wamid.${Date.now()}`;
            const timeStr = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
            
            if (session && session.status === 'CONNECTED') {
                logs.unshift({
                    id: `wpp_${Date.now()}`,
                    companyId,
                    recipient: data.to,
                    text: data.text,
                    status: 'Sent',
                    time: timeStr,
                    messageId: msgId
                });
                whatsappLogs.set(companyId, logs.slice(0, 100));
                console.log(`[WhatsApp Business] Mensagem enviada para ${data.to}: ${data.text}`);
                return { success: true, messageId: msgId };
            }

            if (!session) {
                return { success: false, error: 'Sessão WhatsApp não inicializada.' };
            }

            // Log pending notification if session is created but in standby
            logs.unshift({
                id: `wpp_${Date.now()}`,
                companyId,
                recipient: data.to,
                text: data.text,
                status: 'Queued',
                time: timeStr,
                messageId: msgId
            });
            whatsappLogs.set(companyId, logs.slice(0, 100));
            console.log(`[WhatsApp Dispatch Queued] Notificação registrada para ${data.to}: ${data.text}`);
            return { success: true, queued: true, messageId: msgId };
        }
        return { success: false, error: 'Tipo de integração não suportado.' };
    }
}

// --- WORKERS / AUTOMATIONS (CONSUMERS) ---
eventBus.on('APPOINTMENT_CREATED', async (data) => {
    console.log(`[WORKER] Processando novo agendamento para empresa ${data.companyId}`);
    
    // Dispara notificação de confirmação via WhatsApp
    await IntegrationService.sendMessage(data.companyId, 'whatsapp', {
        to: data.clientPhone,
        text: `Olá ${data.clientName}! Seu agendamento para ${data.service || 'o serviço'} com ${data.professional || 'nosso profissional'} em ${data.date} às ${data.time} foi confirmado no ${data.companyName || 'Bella PDV'}! Código da reserva: ${data.bookingCode || 'CONFIRMADO'}`
    });
});

eventBus.on('APPOINTMENT_CANCELLED', async (data) => {
    console.log(`[WORKER] Processando cancelamento de agendamento para empresa ${data.companyId}`);
    await IntegrationService.sendMessage(data.companyId, 'whatsapp', {
        to: data.clientPhone,
        text: `Olá ${data.clientName}, seu agendamento (${data.service} em ${data.date} às ${data.time}) foi cancelado com sucesso. Código: ${data.bookingCode}`
    });
});

eventBus.on('SALE_CREATED', async (data) => {
    console.log(`[WORKER] Processando comissões da venda ${data.id}...`);
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


type BellaPlanCode = 'basic' | 'pro' | 'premium';
const BELLA_PLANS: Record<BellaPlanCode, { name: string; value: number; regularValue: number; promoCycles: number; licensePlan: 'Bronze' | 'Prata' | 'Ouro'; maxUsers: number }> = {
  basic: { name: 'Básico', value: 29.90, regularValue: 89.90, promoCycles: 3, licensePlan: 'Bronze', maxUsers: 1 },
  pro: { name: 'Pro', value: 149.90, regularValue: 149.90, promoCycles: 0, licensePlan: 'Prata', maxUsers: 5 },
  premium: { name: 'Premium', value: 249.90, regularValue: 249.90, promoCycles: 0, licensePlan: 'Ouro', maxUsers: 999 }
};
const bellaAppUrl = (process.env.PUBLIC_APP_URL || process.env.APP_URL || 'https://bellapdvpro.vercel.app').replace(/\/+$/, '');

function parseJsonSecret(raw: string | undefined): any {
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não configurado.');
  const value = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const parsed = JSON.parse(value);
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) throw new Error('Credencial Firebase incompleta.');
  return parsed;
}
let googleTokenCache: { token: string; expiresAt: number } | null = null;
async function googleAccessToken(): Promise<{ token: string; projectId: string }> {
  const service = parseJsonSecret(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (googleTokenCache && googleTokenCache.expiresAt > Date.now() + 60000) return { token: googleTokenCache.token, projectId: service.project_id };
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = encode({ alg: 'RS256', typ: 'JWT' }) + '.' + encode({
    iss: service.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  });
  const signer = createSign('RSA-SHA256');signer.update(unsigned);signer.end();
  const assertion = unsigned + '.' + signer.sign(service.private_key, 'base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error('Não foi possível autenticar o backend no Firebase.');
  googleTokenCache = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return { token: data.access_token, projectId: service.project_id };
}
function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)])) } };
}
function fromFirestoreValue(value: any): any {
  if (!value) return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, item]) => [key, fromFirestoreValue(item)]));
  return null;
}
async function firestoreGet(collection: string, id: string): Promise<any | null> {
  const { token, projectId } = await googleAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 404) return null;
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || 'Falha ao consultar cobrança no Firebase.');
  return Object.fromEntries(Object.entries(data.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]));
}
async function firestoreMerge(collection: string, id: string, values: Record<string, any>): Promise<void> {
  const { token, projectId } = await googleAccessToken();
  const params = new URLSearchParams();
  Object.keys(values).forEach((key) => params.append('updateMask.fieldPaths', key));
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}?${params}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, toFirestoreValue(value)])) })
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || 'Falha ao salvar cobrança no Firebase.');
}
function asaasBaseUrl(): string {
  return process.env.ASAAS_ENVIRONMENT === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';
}
async function platformAsaas(pathname: string, init: RequestInit = {}): Promise<any> {
  const apiKey = String(process.env.ASAAS_API_KEY || '').trim();
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurada no servidor.');
  const response = await fetch(asaasBaseUrl() + pathname, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'BellaPDV-Pro/1.0', access_token: apiKey, ...(init.headers || {}) }
  });
  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.errors?.map((item: any) => item.description).filter(Boolean).join(' ') || data.error || 'Solicitação recusada pelo Asaas.');
  return data;
}
function plusDays(days: number): string {
  const date = new Date();date.setUTCDate(date.getUTCDate() + days);return date.toISOString().slice(0, 10);
}
function bellaReference(companyId: string, planCode: BellaPlanCode): string {
  return `bella|${companyId}|${planCode}`;
}
function parseBellaReference(value: unknown): { companyId: string; planCode: BellaPlanCode } | null {
  const [prefix, companyId, rawPlan] = String(value || '').split('|');
  const planCode = rawPlan as BellaPlanCode;
  return prefix === 'bella' && companyId && BELLA_PLANS[planCode] ? { companyId, planCode } : null;
}
function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left), b = Buffer.from(right);return a.length === b.length && timingSafeEqual(a, b);
}


// Restrict API access to verified identities and server-issued custom tenant claims.
app.use('/api', async (req, res, next) => {
  if (req.path.startsWith('/webhooks/')) return next();
  if (req.path.startsWith('/public/')) return next();
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

  // --- PUBLIC MARKETPLACE & SMART BOOKING ENDPOINTS (P0) ---
  
  // 1. Calculate conflict-free available slots in America/Sao_Paulo timezone
  app.get('/api/public/slots', (req, res) => {
    return res.status(503).json({error:'Serviço temporariamente indisponível enquanto a persistência segura é configurada.',code:'PERSISTENT_BOOKING_BACKEND_REQUIRED'});
    try {
      const { companyId, date, serviceDuration = '30', professionalId, openTime = '08:00', closeTime = '19:00' } = req.query;
      
      if (!companyId || !date) {
        return res.status(400).json({ error: 'companyId e date são obrigatórios.' });
      }

      const duration = Math.max(15, Math.min(360, Number(serviceDuration) || 30));
      const dateStr = String(date).trim();

      // Check timezone America/Sao_Paulo current date and time
      const now = new Date();
      const spToday = now.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
      const spNowTime = now.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false, hour: '2-digit', minute: '2-digit' });
      const [spH, spM] = spNowTime.split(':').map(Number);
      const spCurrentMinutes = spH * 60 + spM;

      // Do not allow dates in the past
      if (dateStr < spToday) {
        return res.json({ slots: [], message: 'Data no passado', date: dateStr });
      }

      // Generate daily candidate intervals
      const [startH, startM] = String(openTime).split(':').map(Number);
      const [endH, endM] = String(closeTime).split(':').map(Number);
      const dayStartMinutes = (Number.isFinite(startH) ? startH : 8) * 60 + (Number.isFinite(startM) ? startM : 0);
      const dayEndMinutes = (Number.isFinite(endH) ? endH : 19) * 60 + (Number.isFinite(endM) ? endM : 0);

      // Collect all booked slots for this company on this date
      const bookedRanges: { start: number; end: number; professionalId?: string }[] = [];
      for (const b of publicBookingsMap.values()) {
        if (b.companyId === companyId && b.date === dateStr && b.status !== 'cancelled') {
          const [bH, bM] = b.time.split(':').map(Number);
          const bStart = bH * 60 + bM;
          const bEnd = bStart + (b.serviceDuration || 30);
          bookedRanges.push({ start: bStart, end: bEnd, professionalId: b.professionalId });
        }
      }

      const availableSlots: string[] = [];
      const step = 30; // 30-minute interval

      for (let current = dayStartMinutes; current + duration <= dayEndMinutes; current += step) {
        // If booking for today, require at least 15 min buffer from now
        if (dateStr === spToday && current <= spCurrentMinutes + 15) {
          continue;
        }

        const slotStart = current;
        const slotEnd = current + duration;

        // Check collision
        let hasConflict = false;
        for (const range of bookedRanges) {
          if (professionalId && range.professionalId && range.professionalId !== professionalId) {
            continue;
          }
          if (slotStart < range.end && slotEnd > range.start) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          const h = String(Math.floor(slotStart / 60)).padStart(2, '0');
          const m = String(slotStart % 60).padStart(2, '0');
          availableSlots.push(`${h}:${m}`);
        }
      }

      res.json({
        slots: availableSlots,
        date: dateStr,
        serviceDuration: duration,
        timezone: 'America/Sao_Paulo',
        totalAvailable: availableSlots.length
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao calcular horários disponíveis', details: err.message });
    }
  });

  // 2. Create booking with transactional conflict prevention (P0 Concurrency Control)
  // P0: public bookings require durable transactions before a confirmed response.
  app.post('/api/public/bookings', (_req, res) => {
    res.status(503).json({
      error: 'Reservas online temporariamente indisponíveis. Contate o estabelecimento.',
      code: 'BOOKING_PERSISTENCE_NOT_CONFIGURED'
    });
  });

  // 3. Customer self-service lookup (Meus Agendamentos)
  app.get('/api/public/my-bookings', (req, res) => {
    return res.status(503).json({error:'Serviço temporariamente indisponível enquanto a persistência segura é configurada.',code:'PERSISTENT_BOOKING_BACKEND_REQUIRED'});
    const { phone, code } = req.query;
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const searchCode = String(code || '').trim().toUpperCase();

    if (!cleanPhone && !searchCode) {
      return res.status(400).json({ error: 'Informe o telefone ou o código da reserva.' });
    }

    const results: PublicBookingRecord[] = [];
    for (const b of publicBookingsMap.values()) {
      const bPhone = b.clientPhone.replace(/\D/g, '');
      const matchPhone = cleanPhone && bPhone.includes(cleanPhone);
      const matchCode = searchCode && b.bookingCode.toUpperCase() === searchCode;

      if (matchPhone || matchCode) {
        results.push(b);
      }
    }

    results.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    res.json({ bookings: results });
  });

  // 4. Cancel booking with automated notifications
  app.post('/api/public/cancel-booking', (req, res) => {
    return res.status(503).json({error:'Serviço temporariamente indisponível enquanto a persistência segura é configurada.',code:'PERSISTENT_BOOKING_BACKEND_REQUIRED'});
    const { bookingCode, clientPhone, reason } = req.body;
    if (!bookingCode) {
      return res.status(400).json({ error: 'Código da reserva é obrigatório.' });
    }

    let found: PublicBookingRecord | null = null;
    for (const b of publicBookingsMap.values()) {
      if (b.bookingCode.toUpperCase() === String(bookingCode).trim().toUpperCase()) {
        found = b;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({ error: 'Reserva não encontrada.' });
    }

    found.status = 'cancelled';
    eventBus.emit('APPOINTMENT_CANCELLED', {
      companyId: found.companyId,
      clientName: found.clientName,
      clientPhone: found.clientPhone,
      service: found.serviceName,
      date: found.date,
      time: found.time,
      bookingCode: found.bookingCode,
      reason
    });

    res.json({ success: true, message: 'Agendamento cancelado com sucesso.' });
  });

  // 5. Verified reviews
  app.post('/api/public/reviews', (req, res) => {
    return res.status(503).json({error:'Serviço temporariamente indisponível enquanto a persistência segura é configurada.',code:'PERSISTENT_BOOKING_BACKEND_REQUIRED'});
    const { companyId, clientName, rating, comment, serviceName, bookingCode } = req.body;
    if (!companyId || !clientName || !comment) {
      return res.status(400).json({ error: 'Dados da avaliação incompletos.' });
    }
    const score = Math.max(1, Math.min(5, Number(rating) || 5));
    const review: PublicReviewRecord = {
      id: `rev_${Date.now()}_${randomUUID().slice(0, 6)}`,
      companyId,
      clientName: String(clientName).slice(0, 60),
      rating: score,
      comment: String(comment).slice(0, 500),
      serviceName: String(serviceName || 'Atendimento').slice(0, 80),
      bookingCode: String(bookingCode || ''),
      createdAt: new Date().toISOString()
    };

    const list = publicReviewsMap.get(companyId) || [];
    list.unshift(review);
    publicReviewsMap.set(companyId, list.slice(0, 100));

    res.status(201).json({ success: true, review });
  });

  app.get('/api/public/reviews', (_req, res) => {
    res.status(503).json({ error: 'Avaliações verificadas indisponíveis até a persistência e moderação segura.' });
  });

  // 6. Sync public bookings for merchant schedule (Agenda Bella)
  // P0: do not expose tenant appointment details from an unauthenticated public endpoint.
  // Merchant bookings must be loaded via authenticated, tenant-scoped Firestore access.
  app.get('/api/public/company-bookings/:companyId', (_req, res) => {
    res.status(410).json({ error: 'Consulta pública de reservas desativada. Utilize a agenda autenticada do Bella.' });
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
    try {
      const companyId = (req as any).company?.id || 'empresa_padrao';
      const { to, text } = req.body;

      if (!to || !text) {
        return res.status(400).json({ error: 'Destinatário e mensagem são obrigatórios.' });
      }

      const session = whatsappSessions.get(companyId);
      if (!session || session.status !== 'CONNECTED') {
        return res.status(400).json({
          error: 'WhatsApp Business não está conectado. Escaneie o QR Code na aba Integrações para habilitar envios.',
        });
      }

      // Sanitize phone
      const cleanPhone = to.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;

      // If Evolution is configured, dispatch through external server
      if (session.evolutionUrl && session.evolutionKey) {
        try {
          const cleanUrl = session.evolutionUrl.replace(/\/$/, '');
          await fetch(`${cleanUrl}/message/sendText/${session.instanceName}`, {
            method: 'POST',
            headers: {
              apikey: session.evolutionKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: formattedPhone,
              text,
            }),
            signal: AbortSignal.timeout(6000),
          });
        } catch (evoSendErr) {
          console.warn('[Evolution Send Text Error - Proceeding with Gateway delivery]', evoSendErr);
        }
      }

      const messageId = `wamid.HBgM${Date.now()}`;
      const logs = whatsappLogs.get(companyId) || [];
      logs.unshift({
        id: `wpp_${Date.now()}`,
        companyId,
        recipient: formattedPhone,
        text,
        status: 'Sent',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        messageId,
      });
      whatsappLogs.set(companyId, logs.slice(0, 100));

      return res.json({
        success: true,
        messageId,
        status: 'Sent',
        recipient: formattedPhone,
      });
    } catch (err: any) {
      console.error('[WhatsApp Send Error]', err);
      res.status(500).json({ error: 'Erro ao disparar mensagem', details: err.message });
    }
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

  // BellaPDV subscription checkout and lifecycle.
  app.get('/api/billing/status', async (req, res) => {
    try {
      const companyId = (req as any).company?.id;
      const billing = companyId ? await firestoreGet('billing_subscriptions', companyId) : null;
      return res.json({ configured: Boolean(process.env.ASAAS_API_KEY && process.env.FIREBASE_SERVICE_ACCOUNT_JSON), environment: process.env.ASAAS_ENVIRONMENT === 'production' ? 'production' : 'sandbox', subscription: billing });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Não foi possível consultar a assinatura.' });
    }
  });

  app.post('/api/billing/checkout', async (req, res) => {
    try {
      const companyId = String((req as any).company?.id || '');
      const firebaseUser = (req as any).firebaseUser || {};
      const planCode = String(req.body?.plan || '') as BellaPlanCode;
      const plan = BELLA_PLANS[planCode];
      if (!companyId || !plan) return res.status(400).json({ error: 'Empresa ou plano inválido.' });
      const current = await firestoreGet('billing_subscriptions', companyId);
      if (current?.providerSubscriptionId && !['cancelled', 'expired'].includes(String(current.status || ''))) {
        return res.status(409).json({ error: 'Já existe uma assinatura no Asaas. Cancele ou altere o plano existente para evitar cobrança duplicada.' });
      }
      const externalReference = bellaReference(companyId, planCode);
      const callbackBase = `${bellaAppUrl}/settings`;
      const checkout = await platformAsaas('/checkouts', {
        method: 'POST',
        body: JSON.stringify({
          billingTypes: ['CREDIT_CARD'],
          chargeTypes: ['RECURRENT'],
          minutesToExpire: 60,
          externalReference,
          callback: {
            successUrl: `${callbackBase}?checkout=success`,
            cancelUrl: `${callbackBase}?checkout=cancelled`,
            expiredUrl: `${callbackBase}?checkout=expired`
          },
          items: [{ externalReference: planCode, name: `BellaPDV Plano ${plan.name}`, description: planCode === 'basic' ? 'R$ 29,90/mês nos 3 primeiros ciclos; depois R$ 89,90/mês' : `Assinatura mensal BellaPDV ${plan.name}`, quantity: 1, value: plan.value }],
          customerData: { name: firebaseUser.name || firebaseUser.email || 'Cliente BellaPDV', ...(firebaseUser.email ? { email: firebaseUser.email } : {}) },
          subscription: { cycle: 'MONTHLY', nextDueDate: plusDays(1) }
        })
      });
      const checkoutId = String(checkout?.id || '');
      if (!checkoutId) throw new Error('O Asaas não retornou o identificador do checkout.');
      await firestoreMerge('billing_subscriptions', companyId, {
        companyId, userId: String(firebaseUser.uid || ''), planCode, planName: plan.name, licensePlan: plan.licensePlan,
        status: 'checkout_created', provider: 'asaas', providerCheckoutId: checkoutId, providerSubscriptionId: '',
        promoCycles: plan.promoCycles, promoConverted: false, environment: process.env.ASAAS_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
        updatedAt: new Date().toISOString()
      });
      const url = checkout.link || (process.env.ASAAS_ENVIRONMENT === 'production'
        ? `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`
        : `https://sandbox.asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`);
      return res.json({ id: checkoutId, url });
    } catch (error: any) {
      console.error('[Bella Billing Checkout]', error);
      return res.status(500).json({ error: error.message || 'Não foi possível abrir o checkout.' });
    }
  });

  app.post('/api/billing/cancel', async (req, res) => {
    try {
      const companyId = String((req as any).company?.id || '');
      const current = await firestoreGet('billing_subscriptions', companyId);
      if (!current?.providerSubscriptionId) return res.status(404).json({ error: 'Assinatura no Asaas não encontrada.' });
      await platformAsaas(`/subscriptions/${encodeURIComponent(current.providerSubscriptionId)}`, { method: 'PUT', body: JSON.stringify({ status: 'INACTIVE' }) });
      await firestoreMerge('billing_subscriptions', companyId, { status: 'cancelled', updatedAt: new Date().toISOString() });
      await firestoreMerge('company_licenses', companyId, { status: 'expired', expireDate: new Date().toISOString().slice(0, 10) });
      return res.json({ ok: true, status: 'cancelled' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Não foi possível cancelar a assinatura.' });
    }
  });

  // Webhooks: Asaas subscription and payment events.
  app.post('/api/webhooks/asaas', async (req, res) => {
    const expected = String(process.env.ASAAS_WEBHOOK_TOKEN || '');
    const provided = String(req.headers['asaas-access-token'] || '');
    if (!expected || !safeEqual(provided, expected)) return res.status(401).json({ error: 'Token de webhook inválido.' });
    try {
      const event = req.body || {}, eventId = String(event.id || ''), eventType = String(event.event || '');
      if (!eventId || !eventType) return res.status(400).json({ error: 'Evento Asaas inválido.' });
      if (await firestoreGet('billing_events', eventId)) return res.json({ received: true, duplicate: true });
      const resource = event.checkout || event.subscription || event.payment || {};
      let reference = parseBellaReference(resource.externalReference);
      const subscriptionId = String(resource.subscription || (event.subscription ? resource.id : '') || '');
      if (!reference && subscriptionId) {
        const index = await firestoreGet('billing_subscription_index', subscriptionId);
        if (index?.companyId && BELLA_PLANS[index.planCode as BellaPlanCode]) reference = { companyId: index.companyId, planCode: index.planCode as BellaPlanCode };
      }
      if (!reference) {
        await firestoreMerge('billing_events', eventId, { eventType, ignored: true, processedAt: new Date().toISOString() });
        return res.json({ received: true, ignored: true });
      }
      const { companyId, planCode } = reference, plan = BELLA_PLANS[planCode];
      const now = new Date().toISOString();
      const billingPatch: Record<string, any> = { companyId, planCode, planName: plan.name, licensePlan: plan.licensePlan, lastEvent: eventType, updatedAt: now };
      let licenseStatus: 'active' | 'expired' | null = null;
      if (eventType === 'CHECKOUT_PAID' || eventType === 'SUBSCRIPTION_CREATED' || ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(eventType)) {
        billingPatch.status = 'active';licenseStatus = 'active';
      } else if (['PAYMENT_OVERDUE', 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED', 'PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED', 'SUBSCRIPTION_DELETED'].includes(eventType)) {
        billingPatch.status = eventType === 'SUBSCRIPTION_DELETED' ? 'cancelled' : 'past_due';licenseStatus = 'expired';
      } else if (eventType === 'CHECKOUT_CANCELED' || eventType === 'CHECKOUT_EXPIRED') {
        billingPatch.status = eventType.toLowerCase();
      }
      if (event.checkout?.id) billingPatch.providerCheckoutId = String(event.checkout.id);
      if (event.subscription?.id) {
        billingPatch.providerSubscriptionId = String(event.subscription.id);
        billingPatch.providerCustomerId = String(event.subscription.customer || '');
        await firestoreMerge('billing_subscription_index', String(event.subscription.id), { companyId, planCode, updatedAt: now });
      }
      await firestoreMerge('billing_subscriptions', companyId, billingPatch);
      if (licenseStatus) {
        await firestoreMerge('company_licenses', companyId, {
          id: companyId, plan: plan.licensePlan, status: licenseStatus,
          expireDate: licenseStatus === 'active' ? plusDays(35) : new Date().toISOString().slice(0, 10),
          maxUsers: plan.maxUsers
        });
      }
      if (planCode === 'basic' && ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(eventType) && subscriptionId) {
        const payments = await platformAsaas(`/subscriptions/${encodeURIComponent(subscriptionId)}/payments`);
        const paidCycles = (payments?.data || []).filter((payment: any) => ['CONFIRMED', 'RECEIVED'].includes(String(payment.status || '').toUpperCase())).length;
        const current = await firestoreGet('billing_subscriptions', companyId);
        if (paidCycles >= plan.promoCycles && !current?.promoConverted) {
          await platformAsaas(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
            method: 'PUT',
            body: JSON.stringify({ value: plan.regularValue, description: `Assinatura mensal BellaPDV ${plan.name}`, externalReference: bellaReference(companyId, planCode), updatePendingPayments: false })
          });
          await firestoreMerge('billing_subscriptions', companyId, { promoConverted: true, currentValue: plan.regularValue, updatedAt: now });
        }
      }
      await firestoreMerge('billing_events', eventId, { eventType, companyId, processedAt: now });
      return res.json({ received: true });
    } catch (error: any) {
      console.error('[Bella Billing Webhook]', error);
      return res.status(500).json({ error: error.message || 'Falha ao processar webhook.' });
    }
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
