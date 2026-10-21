import { trackConversion } from '../lib/conversionAnalytics';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, LockKeyhole, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';

const modules = [
  { title: 'Visão geral', subtitle: 'Indicadores, faturamento e atendimentos', metrics: ['Resumo de receitas', 'Ocupação de agenda', 'Indicadores de crescimento'] },
  { title: 'Frente de caixa', subtitle: 'PDV rápido com diferentes pagamentos', metrics: ['Venda e comanda', 'Pix, cartão e dinheiro', 'Emissão de comprovantes'] },
  { title: 'Agenda', subtitle: 'Gestão de horários e profissionais', metrics: ['Calendário de serviços', 'Status de agendamentos', 'Notificações'] },
  { title: 'Clientes / CRM', subtitle: 'Histórico e relacionamento', metrics: ['Cadastro de clientes', 'Funil de atendimento', 'Histórico e preferências'] },
  { title: 'Profissionais', subtitle: 'Equipe e produtividade', metrics: ['Escalas e comissões', 'Indicadores por profissional', 'Gestão de acessos'] },
  { title: 'Serviços e produtos', subtitle: 'Catálogo e estoque', metrics: ['Serviços e pacotes', 'Controle de produtos', 'Movimentação de estoque'] },
  { title: 'Financeiro', subtitle: 'Fluxo de caixa e contas', metrics: ['Entradas e saídas', 'Fechamento de caixa', 'Conciliação'] },
  { title: 'Relatórios', subtitle: 'Análise operacional', metrics: ['Vendas por período', 'Ticket médio', 'Exportação de relatórios'] },
  { title: 'Fidelidade', subtitle: 'Retenção de clientes', metrics: ['Pontos e cashback', 'Recorrência', 'Campanhas de relacionamento'] },
  { title: 'Marketing IA', subtitle: 'Campanhas e comunicação', metrics: ['Ideias de campanhas', 'Mensagens de divulgação', 'Segmentação'] },
  { title: 'Automações', subtitle: 'Rotinas automáticas', metrics: ['Regras de execução', 'Alertas', 'Acompanhamento'] },
  { title: 'Integrações', subtitle: 'Canais e conectores', metrics: ['WhatsApp', 'Integrações externas', 'Histórico de sincronização'] },
  { title: 'Catálogo e app', subtitle: 'Experiência do cliente', metrics: ['Catálogo digital', 'Aplicativo', 'Pedidos online'] },
  { title: 'Totem', subtitle: 'Atendimento autônomo', metrics: ['Check-in', 'Fila', 'Acompanhamento de espera'] },
  { title: 'Marketplace', subtitle: 'Soluções complementares', metrics: ['Produtos', 'Serviços parceiros', 'Novidades'] },
  { title: 'Configurações', subtitle: 'Personalização do negócio', metrics: ['Dados da empresa', 'Preferências', 'Permissões'] },
];

export default function DemoShowcase() {
  const [selected, setSelected] = useState(0);
  const [leadOpen, setLeadOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => { trackConversion('demo_page_view', 'demo'); }, []);
  const requestAccess = () => { trackConversion('trial_cta_click', 'demo_unlock'); setLeadOpen(true); };
  const register = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams({ signup: 'true', email: email.trim(), company: company.trim(), source: 'demo' });
    trackConversion('trial_signup_started', 'demo_capture_form');
    navigate('/login?' + query.toString());
  };
  const current = modules[selected];
  return (
    <div className="min-h-screen bg-[#080f1b] text-slate-100">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0a1221]/95 px-5 py-4 backdrop-blur-lg lg:px-10">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-300"><Sparkles size={20}/></div>
          <div><strong className="text-base tracking-wide">Bella PDV Pro</strong><div className="text-xs text-cyan-300">Demonstração • Somente leitura</div></div>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden rounded-xl border border-cyan-500/30 px-4 py-2 text-sm font-semibold text-cyan-300 sm:block" onClick={requestAccess}>15 dias grátis</button>
          <Link to="/login" className="hidden text-sm text-slate-300 md:inline">Entrar</Link>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg border border-white/15 p-2 lg:hidden" aria-label="Abrir menu"><Menu size={20}/></button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className={`${mobileMenu ? 'block' : 'hidden'} fixed inset-x-0 top-[72px] bottom-0 z-10 w-full overflow-y-auto border-r border-white/10 bg-[#0e1828] p-4 lg:static lg:block lg:w-64 lg:min-h-[calc(100vh-72px)] lg:shrink-0`}>
          <p className="px-3 py-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Conheça os módulos</p>
          <nav className="space-y-1" aria-label="Módulos da demonstração">
            {modules.map((item, index) => (
              <button key={item.title} onClick={() => { setSelected(index); setMobileMenu(false); }} className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${selected === index ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                {item.title}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-5 lg:p-10">
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 p-5 sm:p-7">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-300"><Eye size={17}/> Ambiente demonstrativo • Dados ilustrativos</div>
            <h1 className="max-w-xl text-2xl font-bold leading-tight sm:text-3xl">Explore o Bella PDV Pro sem compromisso</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Visualize todos os módulos com segurança. Para cadastrar clientes, realizar vendas, editar dados e testar as funções completas, crie sua conta e ative 15 dias gratuitos.</p>
            <button onClick={requestAccess} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">Ativar 15 dias grátis <ArrowRight size={17}/></button>
          </div>

          <div className="mb-5 flex items-center justify-between gap-4">
            <div><p className="text-xs uppercase tracking-widest text-cyan-400">Módulo demonstrativo</p><h2 className="mt-1 text-2xl font-bold">{current.title}</h2><p className="mt-2 text-slate-400">{current.subtitle}</p></div>
            <span className="flex shrink-0 items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300"><LockKeyhole size={14}/> Read-only</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {current.metrics.map((metric, i) => <div key={metric} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300"><Check size={17}/></div>
              <p className="text-sm font-semibold">{metric}</p><p className="mt-2 text-xs leading-5 text-slate-500">Prévia ilustrativa do recurso {i+1}. Dados reais disponíveis após cadastro.</p>
            </div>)}
          </div>

          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <h3 className="text-lg font-semibold">Experimente uma ação deste módulo</h3>
            <p className="mt-2 text-sm text-slate-400">A demonstração não altera registros nem gera operações financeiras.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={requestAccess} className="rounded-lg bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">Criar novo registro <LockKeyhole size={14} className="ml-2 inline"/></button>
              <button onClick={requestAccess} className="rounded-lg bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">Editar informações <LockKeyhole size={14} className="ml-2 inline"/></button>
              <button onClick={requestAccess} className="rounded-lg bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">Testar funções completas <ArrowRight size={14} className="ml-2 inline"/></button>
            </div>
          </section>
          <p className="mt-6 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/> Acesso ilustrativo, sem conexão com dados de clientes ou painel Super Admin.</p>
        </main>
      </div>

      {leadOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="presentation" onClick={() => setLeadOpen(false)}>
        <section role="dialog" aria-modal="true" aria-label="Ativar teste grátis" onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-cyan-400/25 bg-[#101b2d] p-6 shadow-2xl">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold">15 dias para testar tudo</h2><button onClick={() => setLeadOpen(false)} aria-label="Fechar"><X size={19}/></button></div>
          <p className="mt-3 text-sm leading-6 text-slate-400">Informe os dados para continuar o cadastro e ativar o teste gratuito. O envio deste formulário não cria uma conta nem salva um lead até que o cadastro seja concluído.</p>
          <form className="mt-5 space-y-3" onSubmit={register}>
            <label className="block text-sm">Empresa<input value={company} onChange={e => setCompany(e.target.value)} required maxLength={100} placeholder="Nome da empresa" className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900 p-3 outline-none focus:border-cyan-400"/></label>
            <label className="block text-sm">E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={160} placeholder="voce@empresa.com.br" className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900 p-3 outline-none focus:border-cyan-400"/></label>
            <button type="submit" className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 hover:bg-cyan-300">Continuar cadastro gratuito <ArrowRight size={16} className="ml-2 inline"/></button>
          </form>
          <p className="mt-3 text-xs text-slate-500">15 dias gratuitos sujeitos à ativação da conta e às condições do serviço.</p>
        </section>
      </div>}
    </div>
  );
}
