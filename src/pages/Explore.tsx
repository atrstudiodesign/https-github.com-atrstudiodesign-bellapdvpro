import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import { db } from '../lib/firebase';

type Listing = { id:string; name:string; category:string; city:string; neighborhood?:string; description?:string; coverUrl?:string; slug:string; services?: {name:string;price?:number;duration?:number}[]; bookingUrl?:string; };
const clean=(value:unknown)=>String(value||'').trim();
function safeBooking(url?:string){ if(!url)return ''; try { const u=new URL(url,window.location.origin); return (u.protocol==='https:'||u.origin===window.location.origin)?u.href:''; } catch{return '';} }
export default function Explore(){
 const { slug }=useParams();
 const [listings,setListings]=useState<Listing[]>([]);
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('');
 const [city,setCity]=useState('');
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  let live=true;
  (async()=>{try{
   // Explicitly published records only. Never read private users, CRM or appointments.
   const snap=await getDocs(query(collection(db,'public_listings'),where('published','==',true),limit(100)));
   if(!live)return;
   setListings(snap.docs.map(d=>{const v=d.data();return {id:d.id,name:clean(v.name),category:clean(v.category),city:clean(v.city),neighborhood:clean(v.neighborhood),description:clean(v.description),coverUrl:clean(v.coverUrl),slug:clean(v.slug)||d.id,services:Array.isArray(v.services)?v.services.slice(0,30).map((x:any)=>({name:clean(x.name),price:typeof x.price==='number'?x.price:undefined,duration:typeof x.duration==='number'?x.duration:undefined})):[],bookingUrl:clean(v.bookingUrl)};}).filter(x=>x.name&&x.city));
  }catch(e){if(live)setError('Ainda não foi possível consultar os estabelecimentos publicados.');}finally{if(live)setLoading(false)}})();
  return()=>{live=false};
 },[]);
 const filtered=useMemo(()=>listings.filter(x=>(!search||[x.name,x.description,x.neighborhood].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))&&(!category||x.category===category)&&(!city||x.city.toLocaleLowerCase('pt-BR').includes(city.toLocaleLowerCase('pt-BR')))),[listings,search,category,city]);
 const categories=[...new Set(listings.map(x=>x.category).filter(Boolean))].sort();
 const selected=slug?listings.find(x=>x.slug===slug):null;
 return <main className="min-h-screen bg-[#070b15] text-slate-100"><header className="mx-auto max-w-6xl px-5 py-7 flex items-center justify-between border-b border-slate-800"><Link to="/landing" className="font-bold tracking-wide text-xl">Bella <span className="text-pink-400">PDV Pro</span></Link><Link to="/explorar" className="text-sm text-slate-300 hover:text-white">Explorar serviços</Link></header><div className="mx-auto max-w-6xl px-5 py-12">
  {slug?(!loading&&!selected?<div><h1 className="text-2xl font-bold">Estabelecimento não encontrado</h1><Link className="underline mt-4 block" to="/explorar">Voltar à busca</Link></div>:selected?<div className="max-w-3xl space-y-6"><Link className="text-pink-300" to="/explorar">← Voltar</Link>{selected.coverUrl&&<img src={selected.coverUrl} alt="" className="w-full max-h-72 object-cover rounded-2xl" loading="lazy"/>}<h1 className="text-3xl font-bold">{selected.name}</h1><p className="text-slate-300">{[selected.category,selected.neighborhood,selected.city].filter(Boolean).join(' · ')}</p><p>{selected.description}</p><h2 className="font-bold text-xl">Serviços</h2>{selected.services?.length?selected.services.map((item,i)=><div key={i} className="border border-slate-700 rounded-xl p-4 flex justify-between gap-3"><span>{item.name}{item.duration? ` · ${item.duration} min`:''}</span><strong>{typeof item.price==='number'?item.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'Consulte o valor'}</strong></div>):<p className="text-slate-400">Serviços ainda não publicados.</p>}{safeBooking(selected.bookingUrl)?<a href={safeBooking(selected.bookingUrl)} className="inline-block bg-pink-500 text-white font-semibold rounded-xl px-5 py-3">Agendar com o estabelecimento</a>:<p className="text-amber-200 text-sm">Reservas online ainda não habilitadas para este estabelecimento.</p>}</div>:<p>Carregando perfil...</p>):<><h1 className="text-3xl sm:text-4xl font-bold mb-3">Encontre serviços e profissionais</h1><p className="text-slate-300 mb-8">Explore estabelecimentos participantes. Somente perfis autorizados aparecem aqui.</p><div className="grid gap-3 md:grid-cols-3 mb-9"><input aria-label="Buscar estabelecimentos" placeholder="Buscar por nome ou serviço" value={search} onChange={e=>setSearch(e.target.value)} className="rounded-lg bg-slate-900 border border-slate-700 p-3"/><select aria-label="Categoria" value={category} onChange={e=>setCategory(e.target.value)} className="rounded-lg bg-slate-900 border border-slate-700 p-3"><option value="">Todas as categorias</option>{categories.map(x=><option key={x}>{x}</option>)}</select><input aria-label="Cidade" placeholder="Cidade" value={city} onChange={e=>setCity(e.target.value)} className="rounded-lg bg-slate-900 border border-slate-700 p-3"/></div>{loading?<p>Carregando estabelecimentos...</p>:error?<p role="alert">{error}</p>:filtered.length===0?<p className="text-slate-300">Nenhum estabelecimento publicado corresponde à busca.</p>:<div className="grid gap-5 md:grid-cols-3">{filtered.map(x=><Link key={x.id} to={`/estabelecimento/${encodeURIComponent(x.slug)}`} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-pink-400 transition-colors">{x.coverUrl?<img src={x.coverUrl} alt="" loading="lazy" className="w-full h-40 object-cover"/>:<div className="h-40 bg-gradient-to-br from-fuchsia-950 to-slate-800"/>}<div className="p-5 space-y-2"><h2 className="font-bold text-lg">{x.name}</h2><p className="text-sm text-pink-300">{x.category}</p><p className="text-sm text-slate-400">{[x.neighborhood,x.city].filter(Boolean).join(' · ')}</p><span className="inline-block text-sm font-semibold">Ver serviços</span></div></Link>)}</div>}</>}
 </div></main>;
}
