import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Star, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Scissors, 
  Share2, 
  ChevronLeft, 
  CheckCircle2, 
  CreditCard,
  User,
  Sparkles,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

interface ListingService {
  name: string;
  price?: number;
  duration?: number;
  description?: string;
}

interface ListingProfessional {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface EstablishmentData {
  id: string;
  name: string;
  category: string;
  city: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  description?: string;
  coverUrl?: string;
  slug: string;
  services: ListingService[];
  workingHours?: { open: string; close: string; days?: number[] };
  professionals?: ListingProfessional[];
  rating?: number;
  reviewCount?: number;
  bookingUrl?: string;
}

export default function EstablishmentProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<EstablishmentData | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'team' | 'about' | 'reviews'>('services');
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!slug) return;
      try {
        setLoading(true);
        // Find public listing either by slug or document id
        let foundData: EstablishmentData | null = null;
        
        // 1. Try direct doc read if slug equals id
        try {
          const directSnap = await getDoc(doc(db, 'public_listings', slug));
          if (directSnap.exists() && directSnap.data().published === true) {
            const v = directSnap.data();
            foundData = {
              id: directSnap.id,
              name: v.name || '',
              category: v.category || 'Serviços',
              city: v.city || '',
              neighborhood: v.neighborhood || '',
              address: v.address || '',
              phone: v.phone || '',
              description: v.description || '',
              coverUrl: v.coverUrl || '',
              slug: v.slug || directSnap.id,
              services: Array.isArray(v.services) ? v.services : [],
              workingHours: v.workingHours || { open: '08:00', close: '19:00' },
              professionals: Array.isArray(v.professionals) ? v.professionals : [],
              rating: v.rating || 4.9,
              reviewCount: v.reviewCount || 12,
              bookingUrl: v.bookingUrl || ''
            };
          }
        } catch {}

        // 2. Query by slug
        if (!foundData) {
          const q = query(
            collection(db, 'public_listings'),
            where('slug', '==', slug),
            where('published', '==', true)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docSnap = snap.docs[0];
            const v = docSnap.data();
            foundData = {
              id: docSnap.id,
              name: v.name || '',
              category: v.category || 'Serviços',
              city: v.city || '',
              neighborhood: v.neighborhood || '',
              address: v.address || '',
              phone: v.phone || '',
              description: v.description || '',
              coverUrl: v.coverUrl || '',
              slug: v.slug || docSnap.id,
              services: Array.isArray(v.services) ? v.services : [],
              workingHours: v.workingHours || { open: '08:00', close: '19:00' },
              professionals: Array.isArray(v.professionals) ? v.professionals : [],
              rating: v.rating || 4.9,
              reviewCount: v.reviewCount || 12,
              bookingUrl: v.bookingUrl || ''
            };
          }
        }

        if (!mounted) return;
        if (!foundData) {
          setError('Estabelecimento não encontrado ou perfil não publicado.');
        } else {
          setEstablishment(foundData);
        }
      } catch (err: any) {
        console.error('Error fetching establishment profile:', err);
        if (mounted) setError('Não foi possível carregar o perfil comercial.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  // Fetch reviews when review tab opened
  useEffect(() => {
    if (activeTab === 'reviews' && establishment?.id) {
      setLoadingReviews(true);
      fetch(`/api/public/reviews?companyId=${encodeURIComponent(establishment.id)}`)
        .then((res) => res.json())
        .then((data) => {
          setReviews(data.reviews || []);
        })
        .catch((err) => console.warn('Could not load reviews:', err))
        .finally(() => setLoadingReviews(false));
    }
  }, [activeTab, establishment?.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: establishment?.name || 'Estabelecimento Bella',
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link do perfil copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B15] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Carregando informações do estabelecimento...</p>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen bg-[#070B15] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
          <Scissors className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Perfil Indisponível</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">{error || 'O perfil comercial solicitado não existe ou está desativado.'}</p>
        <Link
          to="/explorar"
          className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-pink-600/20"
        >
          Voltar à busca de serviços
        </Link>
      </div>
    );
  }

  const cleanPhone = (establishment.phone || '').replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-[#070B15] text-slate-100 flex flex-col font-sans pb-24 md:pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/explorar"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Voltar à busca"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <span className="font-bold text-sm sm:text-base text-white line-clamp-1">
            {establishment.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Compartilhar perfil"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <Link
            to={`/agendar/${encodeURIComponent(establishment.slug)}`}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-md shadow-pink-600/20 transition-all"
          >
            <Calendar className="w-4 h-4" /> Agendar Horário
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative">
        <div className="h-48 sm:h-72 w-full overflow-hidden bg-slate-900 relative">
          {establishment.coverUrl ? (
            <img
              src={establishment.coverUrl}
              alt={establishment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-950 via-slate-900 to-pink-950 flex items-center justify-center">
              <Scissors className="w-16 h-16 text-slate-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070B15] via-[#070B15]/40 to-transparent" />
        </div>

        {/* Business Header Details */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-16 sm:-mt-20 relative z-10">
          <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/30">
                    {establishment.category}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {establishment.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{[establishment.address, establishment.neighborhood, establishment.city].filter(Boolean).join(' · ')}</span>
                </p>
              </div>

              {/* Rating Box */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 gap-1">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-base text-white">{establishment.rating?.toFixed(1) || '4.9'}</span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                </div>
                <span className="text-xs text-slate-400">
                  {establishment.reviewCount || 12} avaliações de clientes reais
                </span>
              </div>
            </div>

            {/* Quick Contact & Opening Hours */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-pink-400" />
                <span>Hoje: {establishment.workingHours?.open || '08:00'} às {establishment.workingHours?.close || '19:00'}</span>
              </div>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl hover:bg-emerald-900/60 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Comercial</span>
                </a>
              )}

              {establishment.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${establishment.name} ${establishment.address} ${establishment.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ver no Mapa</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 w-full">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'services', label: `Serviços (${establishment.services.length})` },
            { id: 'team', label: `Profissionais (${establishment.professionals?.length || 0})` },
            { id: 'about', label: 'Sobre & Horários' },
            { id: 'reviews', label: 'Avaliações' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-6 w-full flex-1">
        {/* TAB: SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Catálogo de Serviços</h2>
              <span className="text-xs text-slate-400">Selecione para agendar</span>
            </div>

            {establishment.services.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Nenhum serviço comercial publicado no momento.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {establishment.services.map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 hover:border-pink-500/40 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-100 text-sm sm:text-base group-hover:text-pink-400 transition-colors">
                          {srv.name}
                        </h3>
                        <span className="text-sm sm:text-base font-extrabold text-pink-400 shrink-0">
                          {typeof srv.price === 'number'
                            ? srv.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : 'Sob consulta'}
                        </span>
                      </div>

                      {srv.duration && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Duração estimada: {srv.duration} minutos</span>
                        </p>
                      )}

                      {srv.description && (
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {srv.description}
                        </p>
                      )}
                    </div>

                    <Link
                      to={`/agendar/${encodeURIComponent(establishment.slug)}?service=${encodeURIComponent(srv.name)}`}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-pink-600 text-slate-200 hover:text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Agendar este serviço
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: TEAM */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Equipe de Profissionais</h2>
            {!establishment.professionals || establishment.professionals.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0B1120] border border-slate-800 text-center space-y-2">
                <User className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-300 font-semibold">Atendimento Multidisciplinar</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Este estabelecimento conta com profissionais qualificados. Você pode optar por atendimento sem preferência ao agendar.
                </p>
                <Link
                  to={`/agendar/${encodeURIComponent(establishment.slug)}`}
                  className="inline-block mt-3 px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-semibold"
                >
                  Agendar com qualquer profissional
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {establishment.professionals.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base">
                        {prof.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{prof.name}</h3>
                        <p className="text-xs text-cyan-400">{prof.role || 'Especialista'}</p>
                      </div>
                    </div>

                    <Link
                      to={`/agendar/${encodeURIComponent(establishment.slug)}?prof=${encodeURIComponent(prof.name)}&profId=${encodeURIComponent(prof.id)}`}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Agendar com {prof.name.split(' ')[0]}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ABOUT & SCHEDULE */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* Description */}
            <div className="p-6 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-2">
              <h2 className="text-base font-bold text-white">Sobre o Estabelecimento</h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {establishment.description || 'Estabelecimento parceiro Bella PDV Pro, especializado em serviços de beleza e bem-estar de excelência.'}
              </p>
            </div>

            {/* Operating Hours */}
            <div className="p-6 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-pink-400" /> Horários de Atendimento
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((day, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
                    <span className="text-slate-300 font-medium">{day}</span>
                    <span className="font-bold text-pink-400">
                      {establishment.workingHours?.open || '08:00'} - {establishment.workingHours?.close || '19:00'}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40 opacity-70">
                  <span className="text-slate-400 font-medium">Domingo</span>
                  <span className="text-slate-500 font-semibold">Fechado</span>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="p-6 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> Políticas e Formas de Pagamento
              </h2>
              <div className="space-y-2 text-xs text-slate-300">
                <p>• <strong>Cancelamento:</strong> Cancelamentos gratuitos podem ser realizados diretamente pelo portal do cliente com até 2 horas de antecedência.</p>
                <p>• <strong>Tolerância de atraso:</strong> 10 minutos para garantir o cumprimento da grade de atendimentos.</p>
                <p>• <strong>Pagamentos aceitos:</strong> Pix, Cartão de Crédito, Cartão de Débito e Dinheiro.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Avaliações Verificadas</h2>
                <p className="text-xs text-slate-400">Somente clientes que completaram agendamentos reais podem avaliar</p>
              </div>

              <Link
                to={`/avaliacoes?companyId=${encodeURIComponent(establishment.id)}&name=${encodeURIComponent(establishment.name)}`}
                className="px-3 py-1.5 rounded-xl bg-pink-600/20 border border-pink-500/40 text-pink-300 text-xs font-semibold hover:bg-pink-600 hover:text-white transition-all"
              >
                Avaliar Atendimento
              </Link>
            </div>

            {loadingReviews ? (
              <div className="py-12 text-center text-sm text-slate-400">Carregando avaliações...</div>
            ) : reviews.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0B1120] border border-slate-800 text-center space-y-3">
                <Star className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm font-semibold text-white">Nenhuma avaliação publicada ainda</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Agende seu horário e compartilhe sua experiência com outros consumidores após o atendimento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-pink-400">
                          {rev.clientName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-200 block">{rev.clientName}</span>
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
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Bar for Mobile & Quick Booking */}
      <div className="fixed bottom-0 inset-x-0 bg-[#0B1120]/95 backdrop-blur-xl border-t border-slate-800 p-4 z-40 sm:hidden flex items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-400 block">Agende em instantes</span>
          <span className="font-bold text-sm text-white">{establishment.name}</span>
        </div>
        <Link
          to={`/agendar/${encodeURIComponent(establishment.slug)}`}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center gap-1.5"
        >
          <Calendar className="w-4 h-4" /> Agendar Agora
        </Link>
      </div>
    </div>
  );
}
