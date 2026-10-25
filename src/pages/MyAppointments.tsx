import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarCheck2, 
  Search, 
  Clock, 
  MapPin, 
  Scissors, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  ChevronLeft,
  Star,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface BookingItem {
  id: string;
  bookingCode: string;
  companyId: string;
  companyName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  professionalName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
}

export default function MyAppointments() {
  const [phoneSearch, setPhoneSearch] = useState(() => localStorage.getItem('bella_customer_phone') || '');
  const [codeSearch, setCodeSearch] = useState('');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Cancellation modal
  const [cancelModalBooking, setCancelModalBooking] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Automatic search if phone is stored in localStorage
  useEffect(() => {
    if (phoneSearch.trim().length >= 8) {
      handleSearch(phoneSearch);
    }
  }, []);

  const handlePhoneMask = (val: string) => {
    let clean = val.replace(/\D/g, '').slice(0, 11);
    if (clean.length > 10) {
      clean = clean.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length > 6) {
      clean = clean.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (clean.length > 2) {
      clean = clean.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    setPhoneSearch(clean);
  };

  const handleSearch = async (overridePhone?: string) => {
    const p = (overridePhone ?? phoneSearch).replace(/\D/g, '');
    const c = codeSearch.trim().toUpperCase();

    if (!p && !c) {
      toast.info('Informe seu telefone ou código de reserva.');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      if (p) localStorage.setItem('bella_customer_phone', p);

      const params = new URLSearchParams();
      if (p) params.set('phone', p);
      if (c) params.set('code', c);

      const res = await fetch(`/api/public/my-bookings?${params.toString()}`);
      const data = await res.json();

      if (Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      toast.error('Não foi possível consultar os agendamentos.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/public/cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingCode: cancelModalBooking.bookingCode,
          clientPhone: cancelModalBooking.clientPhone,
          reason: cancelReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar');

      toast.success('Agendamento cancelado com sucesso.');
      setCancelModalBooking(null);
      setCancelReason('');
      // Refresh list
      handleSearch();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao cancelar reserva.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B15] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/explorar"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-cyan-400" />
            <h1 className="font-bold text-sm sm:text-base text-white">Meus Agendamentos</h1>
          </div>
        </div>

        <Link
          to="/explorar"
          className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
        >
          Explorar Serviços
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-8 w-full space-y-8">
        {/* Search Panel */}
        <div className="p-6 rounded-3xl bg-[#0B1120] border border-slate-800 space-y-4 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Consultar Reservas</h2>
            <p className="text-xs text-slate-400">
              Digite o número de WhatsApp usado no agendamento ou o código da reserva.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">WhatsApp de Contato</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus-within:border-cyan-500">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="tel"
                  value={phoneSearch}
                  onChange={(e) => handlePhoneMask(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Código da Reserva (opcional)</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus-within:border-cyan-500">
                <input
                  type="text"
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value.toUpperCase())}
                  placeholder="Ex: BK123456"
                  className="w-full bg-transparent text-sm text-white focus:outline-none uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-600/20"
            >
              {loading ? 'Consultando...' : 'Buscar Minhas Reservas'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white">Histórico de Atendimentos</h3>
            {searched && (
              <span className="text-xs text-slate-400">
                {bookings.length} {bookings.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Buscando suas reservas...</div>
          ) : searched && bookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0B1120] border border-slate-800 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">Nenhum agendamento encontrado</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não encontramos agendamentos para os dados informados. Verifique se o DDD do telefone está correto.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((item) => {
                const isCancelled = item.status === 'cancelled';
                const isConfirmed = item.status === 'confirmed';

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isCancelled
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        : 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[11px] font-bold text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-md border border-pink-500/20 mr-2">
                          {item.bookingCode}
                        </span>
                        <strong className="text-white text-base">{item.companyName}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : isConfirmed
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {isCancelled ? 'Cancelado' : isConfirmed ? 'Confirmado' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Serviço</span>
                        <strong className="text-white">{item.serviceName}</strong>
                        <span className="text-slate-400 block text-[10px]">({item.serviceDuration} min)</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Profissional</span>
                        <strong className="text-white">{item.professionalName}</strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Data & Horário</span>
                        <strong className="text-pink-400 font-bold">
                          {item.date.split('-').reverse().join('/')} às {item.time}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 block">Valor</span>
                        <strong className="text-white">
                          {typeof item.servicePrice === 'number'
                            ? item.servicePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : 'Sob consulta'}
                        </strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!isCancelled && (
                      <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800/80">
                        <button
                          onClick={() => setCancelModalBooking(item)}
                          className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Cancelar Reserva
                        </button>

                        <Link
                          to={`/avaliacoes?companyId=${encodeURIComponent(item.companyId)}&code=${encodeURIComponent(item.bookingCode)}&service=${encodeURIComponent(item.serviceName)}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Avaliar Atendimento
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C1627] border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Cancelar Agendamento</h3>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Você está cancelando a reserva <strong className="text-white">{cancelModalBooking.bookingCode}</strong> no estabelecimento <strong className="text-white">{cancelModalBooking.companyName}</strong> agendada para <strong className="text-pink-400">{cancelModalBooking.date} às {cancelModalBooking.time}</strong>.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Motivo do cancelamento (opcional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: imprevisto pessoal, necessidade de remarcar..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-all"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
