import {useEffect,useState} from 'react';
import {doc,getDoc,setDoc,serverTimestamp} from 'firebase/firestore';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {auth,db} from '../lib/firebase';
import {useAuthStore} from '../store/auth';

type ListingForm={published:boolean;name:string;category:string;city:string;neighborhood:string;description:string;coverUrl:string;slug:string;bookingUrl:string};
const initial:ListingForm={published:false,name:'',category:'',city:'',neighborhood:'',description:'',coverUrl:'',slug:'',bookingUrl:''};
const validUrl=(raw:string)=>{if(!raw.trim())return true;try{const u=new URL(raw);return u.protocol==='https:';}catch{return false;}};
export default function PublishListing(){
 const currentUser=useAuthStore(x=>x.user);
 const [form,setForm]=useState<ListingForm>(initial);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const uid=auth.currentUser?.uid||'';
 const isEligible=Boolean(uid&&!auth.currentUser?.isAnonymous&&currentUser&&!currentUser.isDemo&&currentUser.role!=='employee');
 useEffect(()=>{let mounted=true;(async()=>{if(!uid||!isEligible){if(mounted)setLoading(false);return;}try{const snap=await getDoc(doc(db,'public_listings',uid));if(mounted&&snap.exists()){const x=snap.data();setForm({...initial,...Object.fromEntries(Object.keys(initial).map(k=>[k,x[k]??initial[k as keyof ListingForm]]))});}}catch(e){toast.error('Não foi possível carregar o perfil público.');}finally{if(mounted)setLoading(false)}})();return()=>{mounted=false};},[uid,isEligible]);
 const patch=(key:keyof ListingForm,value:any)=>setForm(x=>({...x,[key]:value}));
 const save=async()=>{if(!isEligible){toast.error('Entre com uma conta proprietária para publicar.');return;}if(form.name.trim().length<3||!form.city.trim()||!form.category.trim()){toast.error('Informe nome, categoria e cidade.');return;}if(!validUrl(form.coverUrl)||!validUrl(form.bookingUrl)){toast.error('Use URLs HTTPS válidas para imagem e agendamento.');return;}setSaving(true);try{
  await setDoc(doc(db,'public_listings',uid),{ownerId:uid,name:form.name.trim().slice(0,100),category:form.category.trim().slice(0,60),city:form.city.trim().slice(0,80),neighborhood:form.neighborhood.trim().slice(0,80),description:form.description.trim().slice(0,600),coverUrl:form.coverUrl.trim(),slug:uid,services:[],bookingUrl:form.bookingUrl.trim(),published:form.published,updatedAt:serverTimestamp()},{merge:false});
  toast.success(form.published?'Perfil enviado para o diretório público.':'Perfil salvo como privado.');
 }catch(e){console.error('public listing',e);toast.error('Não foi possível salvar. Verifique as regras publicadas no Firebase.');}finally{setSaving(false)}};
 if(loading)return <main className="min-h-screen bg-[#070b15] text-white p-12">Carregando...</main>;
 return <main className="min-h-screen bg-[#070b15] text-slate-100 px-5 py-10"><div className="mx-auto max-w-2xl space-y-5"><Link className="text-pink-300" to="/explorar">← Voltar à busca</Link><h1 className="text-3xl font-bold">Divulgar meu estabelecimento</h1><p className="text-slate-300">Seu anúncio é opcional. Ao publicar, nome, cidade, descrição e dados informados nesta página ficarão visíveis a qualquer visitante.</p>{!isEligible?<p role="alert" className="border border-amber-500 rounded-lg p-4">Apenas a conta proprietária de uma empresa real pode publicar.</p>:<><div className="grid gap-4">{([['name','Nome comercial'],['category','Categoria'],['city','Cidade'],['neighborhood','Bairro'],['coverUrl','URL HTTPS da foto de capa'],['bookingUrl','URL HTTPS de agendamento (opcional)']] as const).map(([field,label])=><label key={field} className="text-sm">{label}<input value={form[field]} onChange={e=>patch(field,e.target.value)} maxLength={field==='bookingUrl'||field==='coverUrl'?500:100} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-3"/></label>)}<label className="text-sm">Descrição<textarea value={form.description} onChange={e=>patch('description',e.target.value)} maxLength={600} className="mt-1 w-full min-h-28 rounded-lg border border-slate-700 bg-slate-900 p-3"/></label></div><label className="flex gap-3 items-start text-sm"><input type="checkbox" checked={form.published} onChange={e=>patch('published',e.target.checked)} className="mt-1"/>Autorizo a exibição pública das informações comerciais cadastradas no diretório Bella</label><button disabled={saving} onClick={save} className="rounded-lg bg-pink-600 px-6 py-3 font-semibold disabled:opacity-50">{saving?'Salvando...':'Salvar perfil público'}</button></>}</div></main>;
}