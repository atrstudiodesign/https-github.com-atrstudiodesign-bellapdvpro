import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { 
  Shield, 
  Search, 
  RefreshCw, 
  Users, 
  Crown, 
  Zap, 
  Sliders, 
  Calendar,
  Lock,
  ArrowLeft,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Company {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  expire: string;
  niche?: string;
}

interface CompanyLicense {
  id: string;
  plan: 'Bronze' | 'Prata' | 'Ouro' | string;
  status: 'active' | 'trial' | 'expired' | string;
  expireDate: string;
  maxUsers: number;
  aiUsage: number;
  waUsage: number;
  unitsCount: number;
  activeModules?: string[];
  usageLimits?: {
    maxUsers?: number;
    aiUsageLimit?: number;
    waUsageLimit?: number;
    unitsLimit?: number;
  };
}

export default function Licensing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [licenses, setLicenses] = useState<Record<string, CompanyLicense>>({});
  const [flags, setFlags] = useState<Record<string, Record<string, boolean>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats Counters
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [ouroCount, setOuroCount] = useState(0);
  const [prataCount, setPrataCount] = useState(0);
  const [bronzeCount, setBronzeCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Companies / Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const fetchedCompanies: Company[] = [];
      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        fetchedCompanies.push({
          id: docSnap.id,
          name: data.name || 'Empresa sem Nome',
          email: data.email || '',
          plan: data.plan || 'Trial',
          status: data.status || 'Trial',
          expire: data.expire || '2026-12-31',
          niche: data.niche
        });
      });
      setCompanies(fetchedCompanies);
      setTotalCompanies(fetchedCompanies.length);

      // 2. Fetch Licenses
      const licSnap = await getDocs(collection(db, 'company_licenses'));
      const fetchedLicenses: Record<string, CompanyLicense> = {};
      licSnap.forEach(docSnap => {
        const data = docSnap.data() as CompanyLicense;
        fetchedLicenses[docSnap.id] = {
          ...data,
          id: docSnap.id
        };
      });
      setLicenses(fetchedLicenses);

      // 3. Fetch Feature Flags (Active Modules)
      const flagsSnap = await getDocs(collection(db, 'feature_flags'));
      const fetchedFlags: Record<string, Record<string, boolean>> = {};
      flagsSnap.forEach(docSnap => {
        fetchedFlags[docSnap.id] = docSnap.data() as Record<string, boolean>;
      });
      setFlags(fetchedFlags);

      // Calculate state statistics
      let oro = 0;
      let srv = 0;
      let brz = 0;

      fetchedCompanies.forEach(c => {
        const currentLic = fetchedLicenses[c.id];
        const planStr = (currentLic?.plan || c.plan || 'Bronze').toLowerCase();
        if (planStr.includes('ouro') || planStr.includes('gold') || planStr.includes('premium')) {
          oro++;
        } else if (planStr.includes('prata') || planStr.includes('silver') || planStr.includes('pro')) {
          srv++;
        } else {
          brz++;
        }
      });

      setOuroCount(oro);
      setPrataCount(srv);
      setBronzeCount(brz);

      toast.success("Dados de licenciamento atualizados com sucesso!");
    } catch (error: any) {
      console.error("Erro ao ler dados do Firestore:", error);
      toast.error("Erro de permissão ou conexão ao carregar licenças.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update specific fields on the Company License document
  const handleUpdateLicenseField = async (companyId: string, updatedFields: Partial<CompanyLicense>) => {
    try {
      const licenseRef = doc(db, 'company_licenses', companyId);
      
      // Implement specific logic to dynamic load default usage limits if the plan changes
      let fieldsToSave = { ...updatedFields };
      if (updatedFields.plan) {
        const plan = updatedFields.plan;
        let usageLimits = {
          maxUsers: 5,
          aiUsageLimit: 100,
          waUsageLimit: 500,
          unitsLimit: 1,
        };

        if (plan === 'Prata') {
          usageLimits = {
            maxUsers: 15,
            aiUsageLimit: 500,
            waUsageLimit: 2000,
            unitsLimit: 3,
          };
        } else if (plan === 'Ouro') {
          usageLimits = {
            maxUsers: 999,
            aiUsageLimit: 5000,
            waUsageLimit: 10000,
            unitsLimit: 10,
          };
        }

        fieldsToSave = {
          ...fieldsToSave,
          maxUsers: usageLimits.maxUsers,
          usageLimits,
        };
      }

      // Write changes to Firestore using setDoc with merge to ensure doc exists
      await setDoc(licenseRef, fieldsToSave, { merge: true });

      // Update local state
      setLicenses(prev => ({
        ...prev,
        [companyId]: {
          ...(prev[companyId] || {
            id: companyId,
            plan: 'Bronze',
            status: 'trial',
            expireDate: '2026-12-31',
            maxUsers: 5,
            aiUsage: 0,
            waUsage: 0,
            unitsCount: 1,
          }),
          ...fieldsToSave
        }
      }));

      // Synchronize back to the target users collection for dual support
      const userUpdates: Record<string, any> = {};
      if (updatedFields.plan) userUpdates.plan = updatedFields.plan;
      if (updatedFields.status) {
        userUpdates.status = updatedFields.status === 'active' ? 'Ativo' : updatedFields.status === 'expired' ? 'Cancelado' : 'Trial';
      }
      if (updatedFields.expireDate) userUpdates.expire = updatedFields.expireDate;

      if (Object.keys(userUpdates).length > 0) {
        await updateDoc(doc(db, 'users', companyId), userUpdates);
        setCompanies(prev => prev.map(c => c.id === companyId ? {
          ...c,
          ...(userUpdates.plan ? { plan: userUpdates.plan } : {}),
          ...(userUpdates.status ? { status: userUpdates.status } : {}),
          ...(userUpdates.expire ? { expire: userUpdates.expire } : {})
        } : c));
      }

      toast.success("Licença atualizada inline com sucesso!");
    } catch (err: any) {
      console.error("Erro ao atualizar licença:", err);
      toast.error(`Falha ao salvar campo: ${err.message || String(err)}`);
    }
  };

  // Update specific usage limit fields nested inside custom objects
  const handleUpdateUsageLimitValue = async (
    companyId: string, 
    limitKey: 'maxUsers' | 'aiUsageLimit' | 'waUsageLimit' | 'unitsLimit', 
    val: number
  ) => {
    try {
      const licenseRef = doc(db, 'company_licenses', companyId);
      const currentLicense = licenses[companyId] || {};
      const updatedLimits = {
        ...((currentLicense as any).usageLimits || {
          maxUsers: 5,
          aiUsageLimit: 100,
          waUsageLimit: 500,
          unitsLimit: 1,
        }),
        [limitKey]: val
      };

      const fieldsToSave: Partial<CompanyLicense> = {
        usageLimits: updatedLimits,
        ...(limitKey === 'maxUsers' ? { maxUsers: val } : {}),
        ...(limitKey === 'unitsLimit' ? { unitsCount: val } : {})
      };

      await setDoc(licenseRef, fieldsToSave, { merge: true });

      setLicenses(prev => ({
        ...prev,
        [companyId]: {
          ...(prev[companyId] || {
            id: companyId,
            plan: 'Bronze',
            status: 'trial',
            expireDate: '2026-12-31',
            maxUsers: 5,
            aiUsage: 0,
            waUsage: 0,
            unitsCount: 1,
          }),
          ...fieldsToSave
        }
      }));

      toast.success("Limite de uso atualizado!");
    } catch (err: any) {
      console.error("Erro ao atualizar limites:", err);
      toast.error(`Falha ao salvar limites: ${err.message || String(err)}`);
    }
  };

  // Turn Module activation flag toggles on/off inside Firestore and store locally
  const handleToggleModuleAndSyncLicense = async (companyId: string, moduleKey: string, newValue: boolean) => {
    try {
      const flagsRef = doc(db, 'feature_flags', companyId);
      const flagsUpdateData = {
        [moduleKey]: newValue,
        companyId: companyId
      };
      
      await setDoc(flagsRef, flagsUpdateData, { merge: true });

      // Update local state for flags
      setFlags(prev => ({
        ...prev,
        [companyId]: {
          ...(prev[companyId] || {}),
          [moduleKey]: newValue
        }
      }));

      // Gather ALL active module keys to insert/sync to company_licenses activeModules array
      const currentFlags = {
        ...(flags[companyId] || {}),
        [moduleKey]: newValue
      };

      const activeModuleKeys = Object.entries(currentFlags)
        .filter(([key, val]) => val === true && key !== 'companyId')
        .map(([key]) => key);

      const licenseRef = doc(db, 'company_licenses', companyId);
      await setDoc(licenseRef, { activeModules: activeModuleKeys }, { merge: true });

      // Update licenses local state
      setLicenses(prev => ({
        ...prev,
        [companyId]: {
          ...(prev[companyId] || {
            id: companyId,
            plan: 'Bronze',
            status: 'trial',
            expireDate: '2026-12-31',
            maxUsers: 5,
            aiUsage: 0,
            waUsage: 0,
            unitsCount: 1,
          }),
          activeModules: activeModuleKeys
        }
      }));

      toast.success(`Módulo '${moduleKey}' ${newValue ? 'habilitado' : 'desabilitado'}!`);
    } catch (err: any) {
      console.error("Erro ao atualizar módulo de recurso:", err);
      toast.error(`Falha ao alterar módulo: ${err.message || String(err)}`);
    }
  };

  // Filter companies based on search input
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#05070F] text-slate-100 p-6 md:p-8 font-sans">
      <div className="max-w-[1300px] mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin')} 
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer border border-white/5 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 font-extrabold tracking-widest uppercase px-2 py-0.5 rounded border border-cyan-500/20">ADMIN PANEL</span>
              </div>
              <h1 className="text-3xl font-display font-black text-white tracking-tight flex items-center gap-2.5 mt-1">
                <Shield className="w-7 h-7 text-cyan-400" /> Painel de Licenciamento
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Editador avançado em lote de licenças, cotas de limites operacionais detalhadas e seleção granular de módulos ativos por empresa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Filtrar por nome ou e-mail..." 
                className="bg-[#0C1222] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-72 transition-all font-medium"
              />
            </div>
            <button 
              onClick={fetchData}
              title="Recarregar dados do Firestore"
              className="p-2.5 rounded-xl bg-[#0C1222] border border-white/10 text-slate-300 hover:text-white hover:bg-[#151D2F] transition-all cursor-pointer flex items-center justify-center shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Cards Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#0B101E] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/20 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-colors"></div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" /> Total de Empresas
            </span>
            <h3 className="text-3xl font-black text-white mt-2.5">{totalCompanies}</h3>
          </div>

          <div className="bg-[#0B101E] border border-cyan-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/35 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl"></div>
            <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-cyan-400" /> Premium / Ouro (R$ 249,90)
            </span>
            <h3 className="text-3xl font-black text-cyan-400 mt-2.5">{ouroCount}</h3>
          </div>

          <div className="bg-[#0B101E] border border-purple-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/35 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl"></div>
            <span className="text-[10px] text-purple-400 font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Pro / Prata (R$ 149,90)
            </span>
            <h3 className="text-3xl font-black text-purple-400 mt-2.5">{prataCount}</h3>
          </div>

          <div className="bg-[#0B101E] border border-amber-500/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/35 transition-all">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl"></div>
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Básico / Promo (R$ 29,90)
            </span>
            <h3 className="text-3xl font-black text-amber-400 mt-2.5">{bronzeCount}</h3>
          </div>
        </div>

        {/* Searchable Data Table Card */}
        {loading ? (
          <div className="bg-[#070B14] border border-white/5 rounded-2xl p-20 flex flex-col items-center justify-center gap-4 text-center">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
            <div>
              <p className="text-white font-semibold text-base">Alinhando dados do Firestore...</p>
              <p className="text-xs text-slate-500 font-mono mt-1">Carregando usuários, company_licenses e permissões.</p>
            </div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="bg-[#070B14] border border-white/10 rounded-2xl p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-slate-600" />
            <p className="text-sm font-medium">Nenhuma empresa encontrada com o filtro "{searchTerm}".</p>
          </div>
        ) : (
          <div className="bg-[#070B14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                <thead className="bg-[#0D1426] border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold tracking-widest font-mono">
                  <tr>
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4">Status & Expiração</th>
                    <th className="px-6 py-4">Licença / Plano</th>
                    <th className="px-6 py-4">Limites Operacionais</th>
                    <th className="px-6 py-4">Módulos Ativos (Feature Flags)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCompanies.map(c => {
                    const companyLic = licenses[c.id] || {
                      plan: c.plan || 'Bronze',
                      status: c.status?.toLowerCase() === 'ativo' ? 'active' : 'trial',
                      expireDate: c.expire || '2026-12-31',
                      maxUsers: 5,
                      aiUsage: 0,
                      waUsage: 0,
                      unitsCount: 1,
                    };
                    const compFlags = flags[c.id] || {};

                    return (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        
                        {/* Company Identity */}
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-white text-base leading-tight">{c.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1.5 select-all">
                            <span>ID:</span> <span className="text-slate-400">{c.id}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">{c.email}</div>
                          {c.niche && (
                            <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#14223A] text-slate-300 border border-white/5">
                              {c.niche}
                            </span>
                          )}
                        </td>

                        {/* Status Select & Expire Date Input */}
                        <td className="px-6 py-4 font-sans">
                          <div className="space-y-2.5 max-w-[150px]">
                            {/* License Status */}
                            <select
                              value={companyLic.status || 'trial'}
                              onChange={(e) => handleUpdateLicenseField(c.id, { status: e.target.value })}
                              className="w-full bg-[#0D1527] border border-white/10 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-bold cursor-pointer transition-colors"
                            >
                              <option value="active">✓ Ativo / Pago</option>
                              <option value="trial">⚡ Teste Grátis (15 dias)</option>
                              <option value="expired">✗ Bloqueado</option>
                            </select>
                            
                            {/* Expire Date Selection */}
                            <div className="flex items-center gap-1 w-full">
                              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <input
                                type="date"
                                value={companyLic.expireDate || '2026-12-31'}
                                onChange={(e) => handleUpdateLicenseField(c.id, { expireDate: e.target.value })}
                                className="w-full bg-[#0D1527] border border-white/10 rounded-lg py-1 px-2 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-400 font-mono transition-colors"
                              />
                            </div>
                          </div>
                        </td>

                        {/* License Plan Select */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 max-w-[140px]">
                            <select
                              value={companyLic.plan || 'Bronze'}
                              onChange={(e) => handleUpdateLicenseField(c.id, { plan: e.target.value })}
                              className="w-full bg-[#0D1527] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-extrabold cursor-pointer transition-colors"
                            >
                              <option value="Bronze">Básico (R$ 89,90)</option>
                              <option value="Prata">Pro (R$ 149,90)</option>
                              <option value="Ouro">Premium (R$ 249,90)</option>
                            </select>
                            <span className="text-[8px] text-slate-500 font-mono text-center tracking-wider uppercase mt-1">
                              Alteração atualiza limites padrão
                            </span>
                          </div>
                        </td>

                        {/* Usage Limits Inline Inputs */}
                        <td className="px-6 py-4 text-xs font-mono">
                          <div className="space-y-1.5 w-44 bg-[#090F1E]/60 border border-white/5 rounded-xl p-3 font-mono text-[10px]">
                            {/* Max Users */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 uppercase tracking-tight text-[9px] font-bold">Max Users:</span>
                              <input
                                type="number"
                                value={(companyLic as any).usageLimits?.maxUsers ?? companyLic.maxUsers ?? 5}
                                onChange={(e) => handleUpdateUsageLimitValue(c.id, 'maxUsers', parseInt(e.target.value) || 0)}
                                className="bg-[#0C1222] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-slate-300 w-16 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            {/* Units Limits */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 uppercase tracking-tight text-[9px] font-bold">Filiais:</span>
                              <input
                                type="number"
                                value={(companyLic as any).usageLimits?.unitsLimit ?? companyLic.unitsCount ?? 1}
                                onChange={(e) => handleUpdateUsageLimitValue(c.id, 'unitsLimit', parseInt(e.target.value) || 0)}
                                className="bg-[#0C1222] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-slate-300 w-16 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            {/* AI Limit */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 uppercase tracking-tight text-[9px] font-bold">Cota IA:</span>
                              <input
                                type="number"
                                value={(companyLic as any).usageLimits?.aiUsageLimit ?? 100}
                                onChange={(e) => handleUpdateUsageLimitValue(c.id, 'aiUsageLimit', parseInt(e.target.value) || 0)}
                                className="bg-[#0C1222] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-cyan-400 font-bold w-16 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                            {/* WA Limit */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500 uppercase tracking-tight text-[9px] font-bold">Cota WA:</span>
                              <input
                                type="number"
                                value={(companyLic as any).usageLimits?.waUsageLimit ?? 500}
                                onChange={(e) => handleUpdateUsageLimitValue(c.id, 'waUsageLimit', parseInt(e.target.value) || 0)}
                                className="bg-[#0C1222] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-emerald-400 font-bold w-16 text-center focus:outline-none focus:border-cyan-500 transition-colors"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Module Enablement/Feature Flags Active Toggles */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {[
                              { key: 'whatsapp', label: 'WA-API', colorActive: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-extrabold', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                              { key: 'aiAssistant', label: 'IA ASSIST', colorActive: 'bg-purple-500/15 border-purple-500/30 text-purple-400 font-extrabold', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                              { key: 'crm', label: 'CRM', colorActive: 'bg-blue-500/15 border-blue-500/30 text-blue-400 font-extrabold', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                              { key: 'pdv', label: 'PDV', colorActive: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 font-extrabold', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                              { key: 'agenda', label: 'AGENDA', colorActive: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400 font-extrabold', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                              { key: 'whiteLabel', label: 'WHITE LABEL', colorActive: 'bg-pink-500/15 border-pink-500/30 text-pink-400 font-extrabold', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                              { key: 'cashback', label: 'CASHBACK', colorActive: 'bg-rose-500/15 border-rose-500/30 text-rose-400 font-extrabold', colorInactive: 'bg-white/5 border-white/5 text-slate-600' },
                              { key: 'marketplace', label: 'MARKETPLACE', colorActive: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400 font-extrabold', colorInactive: 'bg-white/5 border-white/5 text-slate-600' }
                            ].map((m) => {
                              const isActive = !!compFlags[m.key];
                              return (
                                <button
                                  key={m.key}
                                  onClick={() => handleToggleModuleAndSyncLicense(c.id, m.key, !isActive)}
                                  className={`px-2 py-1 rounded text-[9px] border font-mono tracking-tight transition-all uppercase hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                                    isActive ? m.colorActive : m.colorInactive
                                  }`}
                                  title={`Clique para ${isActive ? 'desabilitar' : 'habilitar'} ${m.label}`}
                                >
                                  {m.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
