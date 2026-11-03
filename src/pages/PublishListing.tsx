import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Store, 
  Sparkles, 
  ExternalLink, 
  Calendar, 
  Users, 
  Scissors, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronLeft 
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useAuthStore } from '../store/auth';

type ServiceEntry = { name: string; price: number; duration: number };
type ProfessionalEntry = { id: string; name: string; role: string };

type ListingForm = {
  services: ServiceEntry[];
  professionals: ProfessionalEntry[];
  published: boolean;
  name: string;
  category: string;
  city: string;
  neighborhood: string;
  address: string;
  phone: string;
  description: string;
  coverUrl: string;
  slug: string;
  bookingUrl: string;
  workingHours: { open: string; close: string };
};

const initial: ListingForm = {
  services: [],
  professionals: [],
  published: false,
  name: '',
  category: 'Barbearia',
  city: '',
  neighborhood: '',
  address: '',
  phone: '',
  description: '',
  coverUrl: '',
  slug: '',
  bookingUrl: '',
  workingHours: { open: '08:00', close: '19:00' }
};

const CATEGORIES = [
  'Barbearia',
  'Salão de Beleza',
  'Manicure & Pedicure',
  'Estética & Spa',
  'Sobrancelhas & Cílios',
  'Massoterapia',
  'Clínica & Consultório',
  'Outros Serviços'
];

const validUrl = (raw: string) => {
  if (!raw.trim()) return true;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function PublishListing() {
  const currentUser = useAuthStore((x) => x.user);
  const [form, setForm] = useState<ListingForm>(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isAlreadyPublished, setIsAlreadyPublished] = useState(false);

  const uid = auth.currentUser?.uid || '';
  const isEligible = Boolean(
    uid && !auth.currentUser?.isAnonymous && currentUser && !currentUser.isDemo && currentUser.role !== 'employee'
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uid || !isEligible) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const [snap, licenseSnap] = await Promise.all([
          getDoc(doc(db, 'public_listings', uid)),
          getDoc(doc(db, 'company_licenses', uid))
        ]);
        if (mounted) setHasSubscription(licenseSnap.exists() && licenseSnap.data()?.status === 'active');
        if (mounted && snap.exists()) {
          const x = snap.data();
          setIsAlreadyPublished(x.published === true);
          setForm({
            ...initial,
            name: x.name || currentUser?.name || '',
            category: x.category || 'Barbearia',
            city: x.city || '',
            neighborhood: x.neighborhood || '',
            address: x.address || '',
            phone: x.phone || '',
            description: x.description || '',
            coverUrl: x.coverUrl || '',
            slug: x.slug || uid,
            bookingUrl: x.bookingUrl || '',
            services: Array.isArray(x.services) ? x.services : [],
            professionals: Array.isArray(x.professionals) ? x.professionals : [],
            workingHours: x.workingHours || { open: '08:00', close: '19:00' },
            published: x.published === true
          });
        } else if (mounted && currentUser) {
          // Pre-populate with company info
          setForm((prev) => ({
            ...prev,
            name: currentUser.name || '',
            slug: uid
          }));
        }
      } catch (e) {
        toast.error('Não foi possível carregar o perfil público.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [uid, isEligible, currentUser]);

  const patch = (key: keyof ListingForm, value: any) => setForm((x) => ({ ...x, [key]: value }));

  const importCatalog = async () => {
    if (!isEligible) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'catalog'), where('ownerId', '==', uid)));
      const incoming = snapshot.docs
        .map((d) => d.data())
        .filter((v) => v.type === 'service' && typeof v.name === 'string' && v.name.trim())
        .slice(0, 30)
        .map((v) => ({
          name: String(v.name).slice(0, 100),
          price: Math.max(0, Number(v.price) || 0),
          duration: Math.max(1, Math.min(720, Number.parseInt(String(v.duration || '30'), 10) || 30))
        }));

      if (!incoming.length) {
        toast.info('Nenhum serviço disponível no catálogo para importar.');
        return;
      }

      setForm((x) => ({ ...x, services: incoming }));
      toast.success(`${incoming.length} serviço(s) importados do catálogo!`);
    } catch (e) {
      toast.error('Não foi possível consultar o catálogo desta empresa.');
    }
  };

  const importProfessionals = async () => {
    if (!isEligible) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'professionals'), where('ownerId', '==', uid)));
      const incoming: ProfessionalEntry[] = snapshot.docs
        .map((d) => {
          const v = d.data();
          return {
            id: d.id,
            name: String(v.name || '').trim().slice(0, 80),
            role: String(v.role || 'Especialista').trim().slice(0, 60)
          };
        })
        .filter((p) => p.name.length > 0);

      if (!incoming.length) {
        toast.info('Nenhum profissional cadastrado na equipe.');
        return;
      }

      setForm((x) => ({ ...x, professionals: incoming }));
      toast.success(`${incoming.length} profissional(is) importados da equipe!`);
    } catch (e) {
      toast.error('Não foi possível consultar a equipe.');
    }
  };

  const updateService = (index: number, key: keyof ServiceEntry, value: string) => {
    setForm((x) => ({
      ...x,
      services: x.services.map((v, i) =>
        i === index ? { ...v, [key]: key === 'name' ? value : Math.max(0, Number(value) || 0) } : v
      )
    }));
  };

  const save = async () => {
    if (!isEligible) {
      toast.error('Entre com uma conta proprietária para publicar.');
      return;
    }
    if (form.name.trim().length < 3 || !form.city.trim() || !form.category.trim()) {
      toast.error('Informe nome comercial, categoria e cidade.');
      return;
    }
    if (
      form.services.length > 30 ||
      form.services.some(
        (s) => !s.name.trim() || s.name.length > 100 || !Number.isFinite(s.price) || !Number.isFinite(s.duration)
      )
    ) {
      toast.error('Revise o nome, preço e duração dos serviços cadastrados.');
      return;
    }
    if (!hasSubscription && (form.services.length > 3 || form.professionals.length > 0 || form.bookingUrl.trim())) {
      toast.error('Cadastro gratuito: até 3 serviços, sem equipe pública ou agendamento integrado.');
      return;
    }
    if (!validUrl(form.coverUrl) || !validUrl(form.bookingUrl)) {
      toast.error('Use URLs HTTPS válidas para imagem e agendamento.');
      return;
    }

    setSaving(true);
    try {
      const record = {
        ownerId: uid,
        name: form.name.trim().slice(0, 100),
        category: form.category.trim().slice(0, 60),
        city: form.city.trim().slice(0, 80),
        neighborhood: form.neighborhood.trim().slice(0, 80),
        address: form.address.trim().slice(0, 120),
        phone: form.phone.trim().slice(0, 30),
        description: form.description.trim().slice(0, 800),
        coverUrl: form.coverUrl.trim(),
        slug: uid,
        services: form.services.map((x) => ({
          name: x.name.trim().slice(0, 100),
          price: x.price,
          duration: x.duration
        })),
        professionals: form.professionals.map((p) => ({
          id: p.id,
          name: p.name.trim().slice(0, 80),
          role: p.role.trim().slice(0, 60)
        })),
        workingHours: form.workingHours,
        bookingUrl: form.bookingUrl.trim(),
        published: isAlreadyPublished,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'public_listings', uid), record, { merge: false });
      toast.success(isAlreadyPublished ? 'Perfil atualizado.' : 'Cadastro recebido para análise. A publicação depende de aprovação.');
    } catch (e: any) {
      console.error('Save public listing error:', e);
      toast.error('Não foi possível salvar o perfil público.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070B15] text-white flex items-center justify-center p-6">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B15] text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A0F1D]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/explorar"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-pink-400" />
            <h1 className="font-bold text-sm sm:text-base text-white">Publicação Comercial & Marketplace</h1>
          </div>
        </div>

        {form.published && (
          <div className="flex items-center gap-2">
            <Link
              to={`/estabelecimento/${uid}`}
              target="_blank"
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <span>Ver Perfil</span>
              <ExternalLink className="w-3 h-3 text-pink-400" />
            </Link>
            <Link
              to={`/agendar/${uid}`}
              target="_blank"
              className="text-xs px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold flex items-center gap-1 shadow-md shadow-pink-600/30 transition-all"
            >
              <span>Testar Agendamento</span>
              <Calendar className="w-3 h-3" />
            </Link>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 w-full space-y-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-white">Configurar Meu Perfil no Marketplace</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Cadastre seu negócio gratuitamente, mesmo sem assinatura. O perfil gratuito inclui até 3 serviços, sem equipe pública nem agendamento integrado. A primeira publicação depende de validação pela equipe Bella. Informações financeiras e privadas não são exibidas.
          </p>
        </div>

        {!isEligible ? (
          <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm space-y-2">
            <p className="font-bold">Crie sua conta Bella gratuitamente para divulgar sua empresa</p>
            <p>
              Não é necessário assinar um plano. Cadastre uma conta de proprietário para solicitar sua vitrine pública.
            </p>
            <Link to="/login?signup=true" className="inline-block rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white">Cadastrar empresa gratuitamente</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Business Information Section */}
            <div className="p-6 rounded-3xl bg-[#0B1120] border border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-pink-400" /> Dados Comerciais
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Nome Comercial *</label>
                  <input
                    value={form.name}
                    onChange={(e) => patch('name', e.target.value)}
                    placeholder="Nome visível aos clientes"
                    maxLength={100}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Categoria Principal *</label>
                  <select
                    value={form.category}
                    onChange={(e) => patch('category', e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Cidade *</label>
                  <input
                    value={form.city}
                    onChange={(e) => patch('city', e.target.value)}
                    placeholder="Ex: São Paulo"
                    maxLength={80}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Bairro</label>
                  <input
                    value={form.neighborhood}
                    onChange={(e) => patch('neighborhood', e.target.value)}
                    placeholder="Ex: Pinheiros"
                    maxLength={80}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Endereço Comercial Completo</label>
                  <input
                    value={form.address}
                    onChange={(e) => patch('address', e.target.value)}
                    placeholder="Ex: Rua dos Pinheiros, 120 - Sala 3"
                    maxLength={120}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">WhatsApp Comercial de Contato</label>
                  <input
                    value={form.phone}
                    onChange={(e) => patch('phone', e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    maxLength={30}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">URL HTTPS da Imagem de Capa</label>
                  <input
                    value={form.coverUrl}
                    onChange={(e) => patch('coverUrl', e.target.value)}
                    placeholder="https://exemplo.com/foto-capa.jpg"
                    maxLength={500}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Descrição Comercial</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => patch('description', e.target.value)}
                    rows={3}
                    placeholder="Apresente os diferenciais, instalações, especialidades e ambiente do seu negócio..."
                    maxLength={800}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Business Hours Section */}
            <div className="p-6 rounded-3xl bg-[#0B1120] border border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Horário de Funcionamento
              </h3>
              <p className="text-xs text-slate-400">
                Determina o intervalo para o cálculo automático dos horários vagos no agendamento online.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Abertura</label>
                  <input
                    type="time"
                    value={form.workingHours.open}
                    onChange={(e) => patch('workingHours', { ...form.workingHours, open: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Fechamento</label>
                  <input
                    type="time"
                    value={form.workingHours.close}
                    onChange={(e) => patch('workingHours', { ...form.workingHours, close: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Published Services Section */}
            <div className="p-6 rounded-3xl bg-[#0B1120] border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-pink-400" /> Serviços Disponíveis para Agendamento
                  </h3>
                  <p className="text-xs text-slate-400">{hasSubscription ? 'Até 30 serviços na vitrine.' : 'Cadastro gratuito: até 3 serviços. Assine para ampliar sua vitrine.'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={importCatalog}
                    className="px-3 py-1.5 rounded-xl border border-pink-500/40 text-pink-300 hover:bg-pink-600/10 text-xs font-semibold transition-colors"
                  >
                    Importar do Catálogo Bella
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((x) => ({
                        ...x,
                        services: [...x.services, { name: '', price: 0, duration: 30 }]
                      }))
                    }
                    disabled={form.services.length >= (hasSubscription ? 30 : 3)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                  >
                    + Novo Serviço
                  </button>
                </div>
              </div>

              {form.services.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Nenhum serviço listado. Clique em "Importar do Catálogo Bella" para carregar automaticamente seus serviços.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.services.map((service, i) => (
                    <div
                      key={i}
                      className="grid gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 sm:grid-cols-[1fr_120px_120px_auto] items-center text-xs"
                    >
                      <input
                        placeholder="Nome do Serviço"
                        maxLength={100}
                        value={service.name}
                        onChange={(e) => updateService(i, 'name', e.target.value)}
                        className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                      />
                      <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2">
                        <span className="text-slate-400 text-[11px]">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={service.price}
                          onChange={(e) => updateService(i, 'price', e.target.value)}
                          className="w-full p-2 bg-transparent text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2">
                        <input
                          type="number"
                          min="5"
                          max="720"
                          value={service.duration}
                          onChange={(e) => updateService(i, 'duration', e.target.value)}
                          className="w-full p-2 bg-transparent text-white focus:outline-none"
                        />
                        <span className="text-slate-400 text-[11px]">min</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((x) => ({
                            ...x,
                            services: x.services.filter((_, j) => j !== i)
                          }))
                        }
                        className="text-red-400 hover:text-red-300 p-2 text-xs font-semibold"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Published Staff Section */}
            {hasSubscription && <div className="p-6 rounded-3xl bg-[#0B1120] border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" /> Profissionais da Equipe
                  </h3>
                  <p className="text-xs text-slate-400">Exibidos na seleção de profissionais no agendamento.</p>
                </div>

                <button
                  type="button"
                  onClick={importProfessionals}
                  className="px-3 py-1.5 rounded-xl border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/10 text-xs font-semibold transition-colors"
                >
                  Importar Equipe de Profissionais
                </button>
              </div>

              {form.professionals.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Nenhum profissional listado individualmente. O agendamento operará no modo "Sem Preferência".
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {form.professionals.map((prof, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <strong className="text-white block">{prof.name}</strong>
                        <span className="text-cyan-400 text-[11px]">{prof.role}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((x) => ({
                            ...x,
                            professionals: x.professionals.filter((_, j) => j !== i)
                          }))
                        }
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            }

            {/* Publish Toggle & Save */}
            <div className="p-6 rounded-3xl bg-[#0B1120] border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div>
                  <span className="font-bold text-sm text-white block">
                    Solicitar divulgação da minha empresa no Bella Market
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    A primeira publicação exige aprovação da equipe Bella. O cadastro gratuito oferece divulgação básica; agendamento integrado depende de assinatura ativa.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={saving}
                  onClick={save}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-pink-600/30 transition-all disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar cadastro / solicitar análise'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}