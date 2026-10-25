import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronLeft, 
  MessageSquare, 
  Send,
  Building,
  User
} from 'lucide-react';
import { toast } from 'sonner';

export default function VerifiedReviews() {
  const [searchParams] = useSearchParams();
  const companyIdParam = searchParams.get('companyId') || '';
  const codeParam = searchParams.get('code') || '';
  const serviceParam = searchParams.get('service') || '';

  const [companyId, setCompanyId] = useState(companyIdParam);
  const [bookingCode, setBookingCode] = useState(codeParam);
  const [serviceName, setServiceName] = useState(serviceParam);
  const [clientName, setClientName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // List of public reviews
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (companyId) {
      setLoadingReviews(true);
      fetch(`/api/public/reviews?companyId=${encodeURIComponent(companyId)}`)
        .then((res) => res.json())
        .then((data) => {
          setReviews(data.reviews || []);
        })
        .catch(() => {})
        .finally(() => setLoadingReviews(false));
    }
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId.trim()) {
      toast.error('Identificador do estabelecimento é obrigatório.');
      return;
    }
    if (!clientName.trim() || clientName.trim().length < 2) {
      toast.error('Informe seu nome completo.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      toast.error('Escreva um comentário sobre seu atendimento (mínimo 5 caracteres).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/public/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId.trim(),
          clientName: clientName.trim(),
          rating,
          comment: comment.trim(),
          serviceName: serviceName.trim() || 'Atendimento Geral',
          bookingCode: bookingCode.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar avaliação');

      setSubmitted(true);
      toast.success('Sua avaliação foi enviada com sucesso!');
      if (data.review) {
        setReviews((prev) => [data.review, ...prev]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Falha ao registrar avaliação.');
    } finally {
      setSubmitting(false);
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
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <h1 className="font-bold text-sm sm:text-base text-white">Avaliações Verificadas</h1>
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
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Reputação e Avaliações Reais
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Apenas clientes com atendimentos realizados podem registrar avaliações para garantir a veracidade e transparência das notas.
          </p>
        </div>

        {/* Submit Review Box */}
        <div className="p-6 rounded-3xl bg-[#0B1120] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-base text-white">
              {submitted ? 'Avaliação Registrada!' : 'Avaliar Atendimento Realizado'}
            </h3>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">Obrigado pelo seu feedback!</p>
              <p className="text-xs text-slate-300">
                Sua avaliação ajuda outros consumidores a encontrarem os melhores profissionais.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setComment('');
                }}
                className="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-200 hover:text-white"
              >
                Enviar outra avaliação
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Código da Reserva (opcional)
                  </label>
                  <input
                    type="text"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    placeholder="Ex: BK123456"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-pink-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Como você prefere ser identificado"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Star Rating Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">
                  Sua Nota de Satisfação:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-amber-400 ml-2">
                    {rating} de 5 estrelas
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Comentário sobre o serviço e pontualidade *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Compartilhe os pontos fortes do atendimento, técnica e ambiente..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-pink-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Registrando...' : 'Publicar Avaliação'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Existing Reviews Feed */}
        {reviews.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-white">Comentários Recentes</h3>
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-pink-400">
                        {rev.clientName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-white block">{rev.clientName}</span>
                        <span className="text-[10px] text-slate-400">{rev.serviceName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-10">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
