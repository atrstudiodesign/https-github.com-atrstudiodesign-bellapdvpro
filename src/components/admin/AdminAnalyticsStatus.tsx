import { ExternalLink, Activity, MousePointerClick, Users, BarChart3 } from 'lucide-react';

const sources = [
  { title: 'Google Analytics 4', label: 'G-PSV5R007DR', href: 'https://analytics.google.com/', status: 'Tag adicionada ao site; relatório do GA4 não conectado ao BellaAdmin', icon: BarChart3 },
  { title: 'Vercel Web Analytics', label: 'Visitas e pageviews', href: 'https://vercel.com/', status: 'Integração de painel/API não conectada; verifique a ativação no projeto Vercel', icon: Activity },
  { title: 'Eventos de conversão', label: 'Trial e cadastros', href: 'https://analytics.google.com/', status: 'Eventos preparados em branches; recebimento e contagens reais não homologados', icon: MousePointerClick },
  { title: 'Firebase / Assinaturas', label: 'Clientes e licenças', href: 'https://console.firebase.google.com/project/bellapdv-15ae0/overview', status: 'O painel lê dados do Firestore; pagamentos exigem confirmação por webhook', icon: Users },
];

export function AdminAnalyticsStatus() {
  return <section className="space-y-4">
    <div>
      <h3 className="text-xl font-semibold text-white">Integrações de Analytics</h3>
      <p className="text-sm text-slate-400 mt-1">Status das fontes de dados. Números não verificados não são exibidos como métricas reais.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {sources.map(({ title, label, href, status, icon: Icon }) => <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-cyan-400" /><h4 className="font-semibold text-white">{title}</h4></div>
        <p className="text-xs text-slate-300">{label}</p>
        <p className="text-sm text-amber-300">{status}</p>
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:underline">Abrir fonte <ExternalLink className="h-4 w-4" /></a>
      </div>)}
    </div>
    <p className="text-xs text-slate-500">Para mostrar sessões, usuários, cliques e conversões no BellaAdmin, ainda é necessário integrar a API de relatórios GA4 com autenticação exclusivamente no servidor e validar permissões administrativas.</p>
  </section>;
}
