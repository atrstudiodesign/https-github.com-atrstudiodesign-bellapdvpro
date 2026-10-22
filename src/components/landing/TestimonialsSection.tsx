import { ArrowRight, MapPin, MessageSquareQuote, ShieldCheck } from 'lucide-react';

const regions = [
 { region: 'Norte', place: 'Belém • Manaus • Palmas', sector:'Salões e estúdios de beleza', benefit:'Agenda e atendimento organizados em um só lugar', cta:'Leve a gestão inteligente para o Norte' },
 { region: 'Nordeste', place: 'Salvador • Recife • Fortaleza', sector:'Barbearias e clínicas de estética', benefit:'Atendimentos, clientes e caixa com mais controle', cta:'Transforme seu negócio no Nordeste' },
 { region: 'Centro-Oeste', place: 'Goiânia • Brasília • Cuiabá', sector:'Clínicas e profissionais autônomos', benefit:'Visibilidade financeira para decisões do dia a dia', cta:'Evolua sua operação no Centro-Oeste' },
 { region: 'Sudeste', place: 'São Paulo • Rio de Janeiro • Belo Horizonte', sector:'Consultórios, salões e barbearias', benefit:'PDV, agenda e relatórios em uma plataforma', cta:'Modernize seu atendimento no Sudeste' },
 { region: 'Sul', place: 'Curitiba • Florianópolis • Porto Alegre', sector:'Estúdios e redes de atendimento', benefit:'Mais organização para equipes e serviços', cta:'Profissionalize a gestão no Sul' },
];

export function TestimonialsSection() {
 return <section id="depoimentos" className="py-20 relative z-10 border-t border-white/5 bg-[#030817]">
  <div className="max-w-7xl mx-auto px-4 sm:px-6">
   <div className="max-w-4xl mx-auto text-center">
    <span className="text-xs tracking-widest font-bold text-[#00D9FF]">BELLA PDV PRO • BRASIL</span>
    <h2 className="mt-4 text-3xl sm:text-5xl font-black text-white">Seu negócio merece gestão profissional. Em qualquer região do Brasil.</h2>
    <p className="mt-5 text-slate-300">Do atendimento ao fechamento de caixa, conheça possibilidades para o seu tipo de negócio. Os exemplos abaixo representam segmentos e regiões atendíveis — não são depoimentos ou números de clientes.</p>
   </div>
   <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-12">
    {regions.map((item)=><article key={item.region} className="rounded-3xl p-6 border border-cyan-400/20 bg-gradient-to-br from-[#10264a] via-[#0b1731] to-[#180e33] flex flex-col gap-3">
      <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-2"><MapPin size={15}/>{item.region.toUpperCase()}</span>
      <h3 className="text-xl font-bold text-white">{item.sector}</h3>
      <p className="text-sm text-slate-300">{item.benefit}</p>
      <p className="text-xs text-slate-400">{item.place} — exemplos de cidades</p>
      <a href="/login?signup=true" className="mt-auto pt-4 text-sm font-bold text-[#00D9FF] hover:text-white flex items-center gap-2">{item.cta}<ArrowRight size={16}/></a>
    </article>)}
   </div>
   <div className="mt-10 rounded-3xl border border-[#E84BFF]/30 bg-[#0b1933] p-7 md:p-10 text-center">
    <MessageSquareQuote className="mx-auto text-[#E84BFF] w-9 h-9"/>
    <h3 className="text-2xl font-bold text-white mt-4">Depoimentos reais de clientes</h3>
    <p className="text-slate-300 mt-3 max-w-2xl mx-auto">Quer contar como o BellaPDV Pro ajudou sua empresa? Envie sua experiência e autorização de publicação. Depoimentos só serão exibidos após confirmação, sem nomes, fotos ou resultados inventados.</p>
    <a href="https://wa.me/5511939026928?text=Ol%C3%A1%21%20Quero%20enviar%20um%20depoimento%20real%20sobre%20o%20BellaPDV%20Pro." target="_blank" rel="noopener noreferrer" className="inline-flex gap-2 items-center mt-6 bg-gradient-to-r from-[#00D9FF] to-[#087CFF] text-[#041024] rounded-full px-6 py-3 font-extrabold text-sm">Enviar depoimento para avaliação <ArrowRight size={16}/></a>
    <p className="text-xs text-slate-400 mt-4 flex justify-center items-center gap-2"><ShieldCheck size={14}/> Publicação somente com consentimento</p>
   </div>
  </div>
 </section>;
}
