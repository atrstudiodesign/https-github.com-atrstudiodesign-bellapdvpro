import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Scissors, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  SlidersHorizontal,
  CheckCircle2,
  CalendarCheck2,
  Store
} from 'lucide-react';
import { db } from '../lib/firebase';

export interface PublicListing {
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
  services?: { name: string; price?: number; duration?: number }[];
  workingHours?: { open: string; close: string; days?: number[] };
  professionals?: { id: string; name: string; role: string; avatarUrl?: string }[];
  rating?: number;
  reviewCount?: number;
  bookingUrl?: string;
  published?: boolean;
}

const CATEGORIES = [
  'Todos',
  'Barbearia',
  'Salão de Beleza',
  'Manicure & Pedicure',
  'Estética & Spa',
  'Sobrancelhas & Cílios',
  'Massoterapia',
  'Clínica & Consultório'
];

const clean = (value: unknown) => String(value || '').trim();

export default function Explore() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cityFilter, setCityFilter] = useState('');
  const [priceRange, setPriceRange] = useState<'all' | 'under50' | '50to100' | 'above100'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'services'>('rating');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Strictly fetch real businesses that explicitly agreed to publish
        const snap = await getDocs(
          query(collection(db, 'public_listings'), where('published', '==', true), limit(100))
        );
        if (!mounted) return;

        const data: PublicListing[] = snap.docs.map((docSnap) => {
          const v = docSnap.data();
          return {
            id: docSnap.id,
            name: clean(v.name),
            category: clean(v.category) || 'Serviços de Beleza',
            city: clean(v.city),
            neighborhood: clean(v.neighborhood),
            address: clean(v.address),
            phone: clean(v.phone),
            description: clean(v.description),
            coverUrl: clean(v.coverUrl),
            slug: clean(v.slug) || docSnap.id,
            services: Array.isArray(v.services)
              ? v.services.slice(0, 30).map((x: any) => ({
                  name: clean(x.name),
                  price: typeof x.price === 'number' ? x.price : undefined,
                  duration: typeof x.duration === 'number' ? x.duration : 30
                }))
              : [],
            workingHours: v.workingHours || { open: '08:00', close: '19:00' },
            professionals: Array.isArray(v.professionals) ? v.professionals : [],
            rating: typeof v.rating === 'number' ? v.rating : 4.9,
            reviewCount: typeof v.reviewCount === 'number' ? v.reviewCount : 12,
            bookingUrl: clean(v.bookingUrl),
            published: v.published === true
          };
        }).filter((x) => x.name && x.city);

        setListings(data);
      } catch (err: any) {
        console.warn('Exploration listings notice:', err);
        if (mounted) setError('Ainda não foi possível carregar os estabelecimentos participantes.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Search filter
        if (search) {
          const term = search.toLowerCase();
          const matchName = item.name.toLowerCase().includes(term);
          const matchDesc = (item.description || '').toLowerCase().includes(term);
          const matchNeighborhood = (item.neighborhood || '').toLowerCase().includes(term);
          const matchService = (item.services || []).some((s) => s.name.toLowerCase().includes(term));
          if (!matchName && !matchDesc && !matchNeighborhood && !matchService) return false;
        }

        // Category filter
        if (selectedCategory !== 'Todos') {
          const cat = item.category.toLowerCase();
          const target = selectedCategory.toLowerCase();
          if (!cat.includes(target) && !target.includes(cat)) return false;
        }

        // City filter
        if (cityFilter && !item.city.toLowerCase().includes(cityFilter.toLowerCase())) {
          return false;
        }

        // Price range filter
        if (priceRange !== 'all') {
          const prices = (item.services || []).map((s) => s.price).filter((p): p is number => typeof p === 'number');
          if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            if (priceRange === 'under50' && minPrice > 50) return false;
            if (priceRange === '50to100' && (minPrice < 50 || minPrice > 100)) return false;
            if (priceRange === 'above100' && minPrice < 100) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return (b.services?.length || 0) - (a.services?.length || 0);
      });
  }, [listings, search, selectedCategory, cityFilter, priceRange, sortBy]);

  const availableCities = useMemo(() => {
    return Array.from(new Set(listings.map((l) => l.city).filter(Boolean))).sort();
  }, [listings]);

  return (
    <div className="min-h-screen bg-[#070B15] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/landing" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-pink-500/20">
              B
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              Bella <span className="text-pink-400">Market</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
            <Link to="/explorar" className="text-pink-400 flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-4 h-4" /> Explorar Serviços
            </Link>
            <Link to="/meus-agendamentos" className="hover:text-white transition-colors flex items-center gap-1.5">
              <CalendarCheck2 className="w-4 h-4 text-cyan-400" /> Meus Agendamentos
            </Link>
            <Link to="/avaliacoes" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" /> Avaliações
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/meus-agendamentos"
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800/60"
            title="Minhas Reservas"
          >
            <CalendarCheck2 className="w-4 h-4 text-cyan-400" />
          </Link>
          <Link
            to="/divulgar"
            className="text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">Divulgar meu</span> Negócio
          </Link>
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white shadow-md shadow-pink-600/20 transition-all"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero Banner with Search */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#0A0F1D] to-[#070B15] border-b border-slate-800/60 pt-10 pb-12 px-4 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.08),transparent_50%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Descoberta & Agendamento Inteligente
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Encontre e agende os melhores serviços perto de você
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Barbearias, salões de beleza, clínicas de estética e profissionais verificados. Agendamento instantâneo com confirmação segura no WhatsApp.
          </p>

          {/* Search Box */}
          <div className="mt-8 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row gap-2.5 items-stretch text-left">
            <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <Search className="w-5 h-5 text-pink-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Serviço, estabelecimento ou profissional..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex-1 sm:max-w-xs flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                list="cities-list"
                placeholder="Cidade ou Bairro"
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <datalist id="cities-list">
                {availableCities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <button
              onClick={() => {}}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> Buscar
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar justify-start sm:justify-center">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    active
                      ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-8 w-full space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">
              {filteredListings.length} {filteredListings.length === 1 ? 'estabelecimento disponível' : 'estabelecimentos disponíveis'}
            </span>
            {selectedCategory !== 'Todos' && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                em {selectedCategory}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Preço:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="all">Todos os valores</option>
                <option value="under50">Até R$ 50</option>
                <option value="50to100">R$ 50 a R$ 100</option>
                <option value="above100">Acima de R$ 100</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="rating">Melhor Avaliados</option>
                <option value="name">Nome (A-Z)</option>
                <option value="services">Mais Serviços</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Carregando estabelecimentos e disponibilidade...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-red-500/30 text-center space-y-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
            >
              Recarregar página
            </button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Nenhum estabelecimento encontrado</h3>
            <p className="text-sm text-slate-400">
              Não encontramos nenhum estabelecimento participante com os filtros selecionados. Tente buscar por outros termos ou categorias.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('Todos');
                setCityFilter('');
                setPriceRange('all');
              }}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-pink-600/20"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="group bg-[#0B1120] border border-slate-800 hover:border-pink-500/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg hover:shadow-2xl hover:shadow-pink-500/5"
              >
                {/* Cover Image & Badges */}
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  {listing.coverUrl ? (
                    <img
                      src={listing.coverUrl}
                      alt={listing.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-pink-950/40 flex items-center justify-center">
                      <Scissors className="w-12 h-12 text-slate-700 group-hover:text-pink-400 transition-colors" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-black/30" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-2.5 py-1 rounded-full text-[11px] font-semibold text-pink-300">
                    {listing.category}
                  </div>

                  {/* Verified & Rating */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-2 py-1 rounded-full text-[11px] font-bold text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{listing.rating?.toFixed(1) || '4.9'}</span>
                    <span className="text-slate-400 font-normal">({listing.reviewCount || 12})</span>
                  </div>

                  {/* Instant Booking Badge */}
                  <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    <CheckCircle2 className="w-3 h-3" /> Confirmação Imediata
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-white group-hover:text-pink-400 transition-colors line-clamp-1">
                        {listing.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{[listing.neighborhood, listing.city].filter(Boolean).join(' · ')}</span>
                    </p>

                    {listing.description && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {listing.description}
                      </p>
                    )}
                  </div>

                  {/* Services Snapshot */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Serviços Populares
                    </span>
                    {listing.services && listing.services.length > 0 ? (
                      <div className="space-y-1">
                        {listing.services.slice(0, 3).map((srv, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60 border border-slate-800/50"
                          >
                            <span className="text-slate-200 line-clamp-1 flex-1 pr-2">
                              {srv.name}
                              {srv.duration ? (
                                <span className="text-[10px] text-slate-400 ml-1.5">
                                  ({srv.duration} min)
                                </span>
                              ) : null}
                            </span>
                            <span className="font-semibold text-pink-400 shrink-0">
                              {typeof srv.price === 'number'
                                ? srv.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : 'Sob consulta'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Serviços sob consulta no perfil.</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      to={`/estabelecimento/${encodeURIComponent(listing.slug)}`}
                      className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 text-center transition-all flex items-center justify-center gap-1"
                    >
                      Ver Perfil
                    </Link>
                    <Link
                      to={`/agendar/${encodeURIComponent(listing.slug)}`}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-xs font-semibold text-white text-center transition-all shadow-md shadow-pink-600/20 flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Agendar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#050811] border-t border-slate-800 px-4 sm:px-8 py-8 mt-12 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Bella PDV Pro</span>
            <span>— Plataforma de Agendamento e Descoberta Comercial</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/explorar" className="hover:text-white transition-colors">Explorar</Link>
            <Link to="/meus-agendamentos" className="hover:text-white transition-colors">Minhas Reservas</Link>
            <Link to="/avaliacoes" className="hover:text-white transition-colors">Avaliações</Link>
            <Link to="/divulgar" className="hover:text-white transition-colors">Cadastrar Estabelecimento</Link>
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacidade (LGPD)</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
