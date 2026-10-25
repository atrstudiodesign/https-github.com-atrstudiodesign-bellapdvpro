import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  User, 
  Scissors, 
  MapPin, 
  Star, 
  Calendar, 
  ChevronLeft, 
  Sparkles,
  Building,
  CheckCircle2
} from 'lucide-react';
import { db } from '../lib/firebase';

interface ProfessionalProfileData {
  id: string;
  name: string;
  role: string;
  companyName: string;
  companySlug: string;
  city: string;
  neighborhood?: string;
  services: { name: string; price?: number; duration?: number }[];
  rating?: number;
}

export default function PublicProfessional() {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ProfessionalProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!slug) return;
      try {
        setLoading(true);
        // Find public listing containing this professional or whose slug matches
        const snap = await getDocs(
          query(collection(db, 'public_listings'), where('published', '==', true))
        );
        if (!mounted) return;

        let foundProf: ProfessionalProfileData | null = null;
        for (const docSnap of snap.docs) {
          const v = docSnap.data();
          const profs = Array.isArray(v.professionals) ? v.professionals : [];
          
          // Match by professional id or name slug
          const match = profs.find(
            (p: any) => p.id === slug || p.name.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
          );

          if (match) {
            foundProf = {
              id: match.id || slug,
              name: match.name,
              role: match.role || 'Especialista',
              companyName: v.name || 'Estabelecimento Parceiro',
              companySlug: v.slug || docSnap.id,
              city: v.city || '',
              neighborhood: v.neighborhood || '',
              services: Array.isArray(v.services) ? v.services : [],
              rating: typeof v.rating === 'number' ? v.rating : 4.9
            };
            break;
          }
        }

        setProfile(foundProf);
      } catch (err) {
        console.warn('Error fetching professional:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B15] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-400">Carregando perfil do profissional...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#070B15] text-white flex flex-col items-center justify-center p-6 text-center">
        <User className="w-12 h-12 text-slate-600 mb-3" />
        <h1 className="text-xl font-bold mb-2">Profissional não encontrado</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          O perfil público deste profissional não está disponível ou foi desvinculado.
        </p>
        <Link
          to="/explorar"
          className="px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold"
        >
          Explorar outros serviços
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B15] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          to={`/estabelecimento/${encodeURIComponent(profile.companySlug)}`}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <span className="font-bold text-sm text-white">{profile.name}</span>
        <Link to="/explorar" className="text-xs text-pink-400 font-semibold">
          Explorar
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-8 py-8 w-full space-y-6">
        {/* Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1120] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-cyan-600/20">
              {profile.name.charAt(0)}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Profissional Verificado
              </div>
              <h1 className="text-2xl font-extrabold text-white">{profile.name}</h1>
              <p className="text-xs sm:text-sm text-cyan-300 font-medium">{profile.role}</p>
              
              <Link
                to={`/estabelecimento/${encodeURIComponent(profile.companySlug)}`}
                className="text-xs text-slate-400 hover:text-pink-400 transition-colors flex items-center justify-center sm:justify-start gap-1.5 pt-1"
              >
                <Building className="w-3.5 h-3.5 text-pink-400" />
                <span>{profile.companyName} · {[profile.neighborhood, profile.city].filter(Boolean).join(', ')}</span>
              </Link>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-extrabold text-sm text-white">{profile.rating?.toFixed(1) || '4.9'}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Link
              to={`/agendar/${encodeURIComponent(profile.companySlug)}?prof=${encodeURIComponent(profile.name)}&profId=${encodeURIComponent(profile.id)}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-pink-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Agendar Atendimento com {profile.name.split(' ')[0]}
            </Link>
          </div>
        </div>

        {/* Services Showcase */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Serviços Disponíveis</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.services.map((srv, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="font-bold text-white text-sm">{srv.name}</h3>
                  <span className="text-xs text-slate-400">{srv.duration || 30} min</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-pink-400 text-sm block">
                    {typeof srv.price === 'number'
                      ? srv.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : 'Sob consulta'}
                  </span>
                  <Link
                    to={`/agendar/${encodeURIComponent(profile.companySlug)}?service=${encodeURIComponent(srv.name)}&prof=${encodeURIComponent(profile.name)}`}
                    className="text-[11px] text-cyan-400 hover:underline font-semibold"
                  >
                    Agendar este
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
