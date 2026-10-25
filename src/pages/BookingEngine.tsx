import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where, addDoc } from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  FileText,
  CalendarCheck2,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

interface ServiceItem {
  name: string;
  price?: number;
  duration?: number;
  description?: string;
}

interface ProfessionalItem {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface EstablishmentInfo {
  id: string;
  name: string;
  category: string;
  city: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  slug: string;
  services: ServiceItem[];
  professionals: ProfessionalItem[];
  workingHours?: { open: string; close: string };
}

export default function BookingEngine() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Wizard state: 1: Service, 2: Professional, 3: Date & Slot, 4: Customer Details, 5: Confirmation Success
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Business Data
  const [establishment, setEstablishment] = useState<EstablishmentInfo | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [errorBusiness, setErrorBusiness] = useState('');

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<{ id: string; name: string } | null>(null);
  
  // Date & Slot Selection
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Current date in America/Sao_Paulo
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotPeriodFilter, setSlotPeriodFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Customer Contact Info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Load Establishment Information
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!slug) return;
      try {
        setLoadingBusiness(true);
        let found: EstablishmentInfo | null = null;

        // Try direct doc read by ID
        try {
          const directSnap = await getDoc(doc(db, 'public_listings', slug));
          if (directSnap.exists() && directSnap.data().published === true) {
            const v = directSnap.data();
            found = {
              id: directSnap.id,
              name: v.name || '',
              category: v.category || 'Serviços',
              city: v.city || '',
              neighborhood: v.neighborhood || '',
              address: v.address || '',
              phone: v.phone || '',
              slug: v.slug || directSnap.id,
              services: Array.isArray(v.services) ? v.services : [],
              professionals: Array.isArray(v.professionals) ? v.professionals : [],
              workingHours: v.workingHours || { open: '08:00', close: '19:00' }
            };
          }
        } catch {}

        // Query by slug
        if (!found) {
          const q = query(
            collection(db, 'public_listings'),
            where('slug', '==', slug),
            where('published', '==', true)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            const v = docSnap.data();
            found = {
              id: docSnap.id,
              name: v.name || '',
              category: v.category || 'Serviços',
              city: v.city || '',
              neighborhood: v.neighborhood || '',
              address: v.address || '',
              phone: v.phone || '',
              slug: v.slug || docSnap.id,
              services: Array.isArray(v.services) ? v.services : [],
              professionals: Array.isArray(v.professionals) ? v.professionals : [],
              workingHours: v.workingHours || { open: '08:00', close: '19:00' }
            };
          }
        }

        if (!mounted) return;
        if (!found) {
          setErrorBusiness('Estabelecimento não encontrado ou reservas online desativadas.');
        } else {
          setEstablishment(found);

          // Handle initial URL queries for pre-selection
          const preService = searchParams.get('service');
          if (preService) {
            const matchSrv = found.services.find(
              (s) => s.name.toLowerCase() === preService.toLowerCase()
            );
            if (matchSrv) {
              setSelectedService(matchSrv);
              setStep(2);
            }
          }

          const preProf = searchParams.get('prof');
          const preProfId = searchParams.get('profId');
          if (preProf) {
            setSelectedProfessional({
              id: preProfId || '',
              name: preProf
            });
            if (preService) setStep(3);
          }
        }
      } catch (err: any) {
        if (mounted) setErrorBusiness('Não foi possível carregar o sistema de agendamento.');
      } finally {
        if (mounted) setLoadingBusiness(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug, searchParams]);

  // Phone number mask (BR)
  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/\D/g, '').slice(0, 11);
    if (clean.length > 10) {
      clean = clean.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length > 6) {
      clean = clean.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (clean.length > 2) {
      clean = clean.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    setClientPhone(clean);
  };

  // Fetch Available Slots for selected date & professional from backend
  useEffect(() => {
    let mounted = true;
    if (!establishment || !selectedDate) return;

    (async () => {
      try {
        setLoadingSlots(true);
        setSelectedSlot('');
        const duration = selectedService?.duration || 30;
        const profId = selectedProfessional?.id || '';
        const open = establishment.workingHours?.open || '08:00';
        const close = establishment.workingHours?.close || '19:00';

        const res = await fetch(
          `/api/public/slots?companyId=${encodeURIComponent(establishment.id)}&date=${encodeURIComponent(selectedDate)}&serviceDuration=${duration}&professionalId=${encodeURIComponent(profId)}&openTime=${encodeURIComponent(open)}&closeTime=${encodeURIComponent(close)}`
        );
        const data = await res.json();
        if (!mounted) return;

        if (Array.isArray(data.slots)) {
          setAvailableSlots(data.slots);
        } else {
          setAvailableSlots([]);
        }
      } catch (err) {
        console.warn('Error fetching slots:', err);
        if (mounted) setAvailableSlots([]);
      } finally {
        if (mounted) setLoadingSlots(false);
      }
    })();

    return () => { mounted = false; };
  }, [establishment, selectedDate, selectedService, selectedProfessional]);

  // Filter slots by period
  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => {
      const hour = parseInt(slot.split(':')[0], 10);
      if (slotPeriodFilter === 'morning') return hour < 12;
      if (slotPeriodFilter === 'afternoon') return hour >= 12 && hour < 18;
      if (slotPeriodFilter === 'evening') return hour >= 18;
      return true;
    });
  }, [availableSlots, slotPeriodFilter]);

  // Next 14 days dates generator for calendar bar
  const calendarDays = useMemo(() => {
    const days: { dateStr: string; label: string; weekDay: string; isToday: boolean }[] = [];
    const now = new Date();

    for (let i = 0; i < 21; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const weekDay = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).replace('.', '');
      const dayNum = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' });

      days.push({
        dateStr,
        label: dayNum,
        weekDay: weekDay.toUpperCase(),
        isToday: i === 0
      });
    }
    return days;
  }, []);

  // Submit Booking Transaction (P0 Concurrency Control)
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishment || !selectedService || !selectedDate || !selectedSlot) {
      toast.error('Preencha todas as etapas anteriores.');
      return;
    }
    if (clientName.trim().length < 2) {
      toast.error('Informe seu nome completo.');
      return;
    }
    const cleanDigits = clientPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      toast.error('Informe um número de WhatsApp válido com DDD.');
      return;
    }
    if (!acceptTerms) {
      toast.error('É necessário aceitar os termos e política de cancelamento.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        companyId: establishment.id,
        companyName: establishment.name,
        serviceName: selectedService.name,
        servicePrice: selectedService.price || 0,
        serviceDuration: selectedService.duration || 30,
        professionalId: selectedProfessional?.id || '',
        professionalName: selectedProfessional?.name || 'Qualquer profissional disponível',
        date: selectedDate,
        time: selectedSlot,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        notes: clientNotes.trim()
      };

      // 1. Transactional backend call
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast.error(data.error || 'Horário acabou de ser ocupado. Por favor, selecione outro horário.');
          setStep(3);
          return;
        }
        throw new Error(data.error || 'Erro ao processar reserva');
      }

      // 2. Also write to secured Firestore public_bookings collection for real-time sync with merchant
      try {
        await addDoc(collection(db, 'public_bookings'), {
          id: data.booking?.id || `pbk_${Date.now()}`,
          ownerId: establishment.id,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim(),
          serviceName: selectedService.name,
          servicePrice: selectedService.price || 0,
          serviceDuration: selectedService.duration || 30,
          professionalName: selectedProfessional?.name || 'Qualquer profissional',
          professionalId: selectedProfessional?.id || '',
          date: selectedDate,
          time: selectedSlot,
          status: 'confirmed',
          bookingCode: data.booking?.bookingCode || 'BK000000',
          notes: clientNotes.trim(),
          createdAt: new Date().toISOString()
        });
      } catch (fsErr) {
        console.warn('Notice: Firestore public write synced via API gateway');
      }

      setConfirmedBooking(data.booking);
      setStep(5);
      toast.success('Agendamento confirmado com sucesso!');
    } catch (err: any) {
      console.error('Booking Error:', err);
      toast.error(err.message || 'Falha ao concluir agendamento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBusiness) {
    return (
      <div className="min-h-screen bg-[#070B15] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Iniciando motor de agendamento online...</p>
      </div>
    );
  }

  if (errorBusiness || !establishment) {
    return (
      <div className="min-h-screen bg-[#070B15] text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
        <h1 className="text-xl font-bold mb-2">Agendamento Indisponível</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">{errorBusiness}</p>
        <Link
          to="/explorar"
          className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold"
        >
          Voltar para busca
        </Link>
      </div>
    );
  }

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!confirmedBooking) return '';
    try {
      const [h, m] = confirmedBooking.time.split(':').map(Number);
      const startDateTime = new Date(`${confirmedBooking.date}T${confirmedBooking.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (confirmedBooking.serviceDuration || 30) * 60000);
      
      const formatGCal = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
      const title = encodeURIComponent(`${confirmedBooking.serviceName} - ${establishment.name}`);
      const details = encodeURIComponent(`Agendamento confirmado no ${establishment.name}.\nProfissional: ${confirmedBooking.professionalName}\nCódigo da Reserva: ${confirmedBooking.bookingCode}`);
      const location = encodeURIComponent(`${establishment.name}, ${establishment.address || ''} ${establishment.city}`);

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCal(startDateTime)}/${formatGCal(endDateTime)}&details=${details}&location=${location}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#070B15] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/estabelecimento/${encodeURIComponent(establishment.slug)}`}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Voltar ao estabelecimento"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white line-clamp-1">{establishment.name}</h1>
            <p className="text-[11px] text-pink-400">Agendamento Online Booksy Concept</p>
          </div>
        </div>

        <Link
          to="/meus-agendamentos"
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
        >
          <CalendarCheck2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Minhas Reservas</span>
        </Link>
      </header>

      {/* Progress Wizard Steps */}
      {step < 5 && (
        <div className="bg-[#0B1120] border-b border-slate-800 px-4 sm:px-8 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            {[
              { num: 1, label: 'Serviço' },
              { num: 2, label: 'Profissional' },
              { num: 3, label: 'Horário' },
              { num: 4, label: 'Confirmar' }
            ].map((s) => {
              const active = step === s.num;
              const done = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done
                        ? 'bg-emerald-500 text-white'
                        : active
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/40 ring-2 ring-pink-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {done ? '✓' : s.num}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${active ? 'text-white' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Wizard Step Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-8 py-6 w-full">
        {/* STEP 1: SELECT SERVICE */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">1. Escolha o Serviço Desejado</h2>
              <p className="text-xs text-slate-400 mt-1">
                Selecione o procedimento para consultar os horários reais disponíveis.
              </p>
            </div>

            <div className="grid gap-3">
              {establishment.services.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Nenhum serviço comercial publicado.</p>
              ) : (
                establishment.services.map((srv, idx) => {
                  const isSelected = selectedService?.name === srv.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedService(srv)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        isSelected
                          ? 'bg-pink-600/10 border-pink-500 ring-1 ring-pink-500'
                          : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm sm:text-base text-white">{srv.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{srv.duration || 30} minutos</span>
                        </p>
                        {srv.description && (
                          <p className="text-xs text-slate-300 pt-1 line-clamp-1">{srv.description}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold text-pink-400 block">
                          {typeof srv.price === 'number'
                            ? srv.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : 'Sob consulta'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {isSelected ? '✓ Selecionado' : 'Clique para selecionar'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                disabled={!selectedService}
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 flex items-center gap-2"
              >
                Continuar para Profissional <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT PROFESSIONAL */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white">2. Escolha o Profissional</h2>
              <p className="text-xs text-slate-400 mt-1">
                Serviço selecionado: <strong className="text-pink-400">{selectedService?.name}</strong>
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Option: Any Professional */}
              <div
                onClick={() => setSelectedProfessional({ id: '', name: 'Qualquer profissional' })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                  selectedProfessional?.name === 'Qualquer profissional'
                    ? 'bg-pink-600/10 border-pink-500 ring-1 ring-pink-500'
                    : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-pink-600/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Sem Preferência</h3>
                  <p className="text-xs text-emerald-400">Qualquer profissional disponível (Mais rápido)</p>
                </div>
              </div>

              {/* Specific Staff */}
              {establishment.professionals.map((prof) => {
                const isSelected = selectedProfessional?.id === prof.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => setSelectedProfessional({ id: prof.id, name: prof.name })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-pink-600/10 border-pink-500 ring-1 ring-pink-500'
                        : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-base shrink-0">
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{prof.name}</h3>
                      <p className="text-xs text-cyan-400">{prof.role || 'Especialista'}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                disabled={!selectedProfessional}
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 flex items-center gap-2"
              >
                Escolher Data e Horário <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DATE & TIME SELECTION */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">3. Selecione a Data e Horário</h2>
              <p className="text-xs text-slate-400 mt-1">
                Disponibilidade calculada em tempo real com controle de conflito e intervalo.
              </p>
            </div>

            {/* Horizontal Date Picker */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Escolha o dia
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {calendarDays.map((day) => {
                  const active = selectedDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`min-w-[68px] py-3 px-2 rounded-2xl text-center border transition-all flex flex-col items-center justify-center gap-1 ${
                        active
                          ? 'bg-pink-600 text-white border-pink-500 shadow-lg shadow-pink-600/30'
                          : 'bg-[#0B1120] text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-[10px] font-bold opacity-80">{day.weekDay}</span>
                      <span className="text-sm font-extrabold">{day.label}</span>
                      {day.isToday && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                          Hoje
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Period Filter for Slots */}
            <div className="flex items-center gap-2 pt-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'morning', label: 'Manhã (< 12h)' },
                { id: 'afternoon', label: 'Tarde (12h - 18h)' },
                { id: 'evening', label: 'Noite (> 18h)' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSlotPeriodFilter(p.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                    slotPeriodFilter === p.id
                      ? 'bg-slate-800 text-pink-400 border-pink-500/40'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Slots Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Horários Livres
                </span>
                <span className="text-xs text-slate-400">Fuso America/Sao_Paulo</span>
              </div>

              {loadingSlots ? (
                <div className="py-12 text-center text-sm text-slate-400">Consultando grade disponível...</div>
              ) : filteredSlots.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0B1120] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">Nenhum horário livre nesta data</p>
                  <p className="text-xs text-slate-400">
                    Todos os horários estão preenchidos para esta data ou o estabelecimento está fechado. Selecione outro dia acima.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {filteredSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                            : 'bg-[#0B1120] text-slate-200 border-slate-800 hover:border-pink-500/40 hover:bg-slate-800'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                disabled={!selectedSlot}
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 flex items-center gap-2"
              >
                Confirmar Dados do Cliente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CUSTOMER DETAILS & SUMMARY */}
        {step === 4 && (
          <form onSubmit={handleConfirmBooking} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">4. Seus Dados para Confirmação</h2>
              <p className="text-xs text-slate-400 mt-1">
                Você receberá o comprovante com o código de reserva diretamente no seu WhatsApp.
              </p>
            </div>

            {/* Booking Summary Card */}
            <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs text-slate-400">Estabelecimento</span>
                  <p className="font-bold text-white text-base">{establishment.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total a pagar</span>
                  <p className="font-extrabold text-pink-400 text-base">
                    {typeof selectedService?.price === 'number'
                      ? selectedService.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'Sob consulta'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Serviço:</span>
                  <strong className="text-slate-200">{selectedService?.name} ({selectedService?.duration} min)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Profissional:</span>
                  <strong className="text-slate-200">{selectedProfessional?.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Data:</span>
                  <strong className="text-slate-200">{selectedDate.split('-').reverse().join('/')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Horário:</span>
                  <strong className="text-pink-400 text-sm font-bold">{selectedSlot}</strong>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Seu Nome Completo *
                </label>
                <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 focus-within:border-pink-500">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  WhatsApp para Confirmação *
                </label>
                <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 focus-within:border-pink-500">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Enviaremos o lembrete e a confirmação com link de cancelamento se precisar.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  E-mail (opcional)
                </label>
                <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700/80 focus-within:border-pink-500">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Observações ou Requisitos Especiais (opcional)
                </label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Ex: alergia a algum produto, preferência por corte específico, etc."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded text-pink-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span>
                  Concordo com os termos de atendimento e política de cancelamento do estabelecimento, e autorizo o envio do comprovante da reserva por WhatsApp.
                </span>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Confirmando no backend...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: SUCCESS CONFIRMATION */}
        {step === 5 && confirmedBooking && (
          <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Reserva Confirmada com Sucesso!
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {confirmedBooking.clientName}, seu horário está garantido!
              </h2>
            </div>

            {/* Voucher Card */}
            <div className="p-6 rounded-3xl bg-[#0B1120] border border-slate-800 text-left space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs text-slate-400">Código de Agendamento</span>
                <span className="text-lg font-black tracking-widest text-pink-400 bg-pink-500/10 px-3 py-1 rounded-xl border border-pink-500/30">
                  {confirmedBooking.bookingCode}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estabelecimento:</span>
                  <strong className="text-white">{confirmedBooking.companyName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Serviço:</span>
                  <strong className="text-white">{confirmedBooking.serviceName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Profissional:</span>
                  <strong className="text-white">{confirmedBooking.professionalName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data e Horário:</span>
                  <strong className="text-pink-400 font-bold">
                    {confirmedBooking.date.split('-').reverse().join('/')} às {confirmedBooking.time}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telefone do cliente:</span>
                  <strong className="text-white">{confirmedBooking.clientPhone}</strong>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <CalendarIcon className="w-4 h-4 text-cyan-400" />
                Adicionar ao Google Agenda
              </a>

              <Link
                to="/meus-agendamentos"
                className="py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition-all"
              >
                <CalendarCheck2 className="w-4 h-4" />
                Acessar Meus Agendamentos
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              Caso precise reagendar ou cancelar, use seu código <strong className="text-slate-200">{confirmedBooking.bookingCode}</strong> ou seu número de telefone em <Link to="/meus-agendamentos" className="text-pink-400 underline">Meus Agendamentos</Link>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
