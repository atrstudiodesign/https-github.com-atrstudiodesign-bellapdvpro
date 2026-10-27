import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {useClientStore, type Client} from '../store/clients';
import {useAuthStore} from '../store/auth';
import {auth} from '../lib/firebase';
import {currentFirebaseTenantId} from '../lib/firebaseTenant';

const parseCSV=(raw:string):string[][]=>{
 const rows:string[][]=[];let row:string[]=[],part='',quoted=false;
 for(let i=0;i<raw.length;i++){const c=raw[i];if(c==='"'){if(quoted&&raw[i+1]==='"'){part+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===','||c===';'||c==='\t')){row.push(part.trim());part='';}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&raw[i+1]==='\n')i++;row.push(part.trim());if(row.some(Boolean))rows.push(row);row=[];part='';}else part+=c;}
 if(quoted)throw new Error('CSV com aspas não fechadas.');
 row.push(part.trim());if(row.some(Boolean))rows.push(row);return rows;
};
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
type Imported={name:string;phone:string;email:string;birthday:string};
export default function ClientImport(){
 const user=useAuthStore(s=>s.user);
 const clients=useClientStore(s=>s.clients);
 const addClient=useClientStore(s=>s.addClient);
 const [rows,setRows]=useState<Imported[]>([]);
 const [busy,setBusy]=useState(false);
 const tenant=currentFirebaseTenantId();
 const allowed=Boolean(auth.currentUser&&!auth.currentUser.isAnonymous&&user&&!user.isDemo&&user.role!=='employee'&&tenant===auth.currentUser.uid);
 const read=async(file:File|undefined)=>{setRows([]);if(!file)return;if(file.size>2_000_000){toast.error('Arquivo deve ter no máximo 2 MB.');return;}try{
 const all=parseCSV((await file.text()).replace(/^\uFEFF/,''));if(all.length<2)throw new Error('Planilha sem registros.');
 const head=all.shift()!.map(norm);const idx=(...keys:string[])=>head.findIndex(x=>keys.includes(x));
 const ni=idx('nome','name','cliente'),pi=idx('telefone','celular','whatsapp','phone'),ei=idx('email','emailaddress'),bi=idx('nascimento','aniversario','birthday');
 if(ni<0)throw new Error('Coluna Nome não encontrada.');
 const clean=all.slice(0,500).map(r=>({name:(r[ni]||'').trim().slice(0,120),phone:(r[pi]||'').replace(/[^\d+]/g,'').slice(0,30),email:(r[ei]||'').trim().toLowerCase().slice(0,200),birthday:(r[bi]||'').trim().slice(0,20)})).filter(x=>x.name.length>=2);
 setRows(clean);toast.success(`${clean.length} clientes preparados para revisão.`);
 }catch(e:any){toast.error(e?.message||'Não foi possível ler o CSV.');}};
 const save=async()=>{if(!allowed)return;setBusy(true);let saved=0,skipped=0;const known=new Set(clients.flatMap(c=>[c.phone?'p:'+c.phone.replace(/\D/g,''):'',c.email?'e:'+c.email.toLowerCase():''].filter(Boolean)));
 const seen=new Set<string>();for(const item of rows){const keys=[item.phone?'p:'+item.phone.replace(/\D/g,''):'',item.email?'e:'+item.email:''].filter(Boolean);if(keys.some(k=>known.has(k)||seen.has(k))){skipped++;continue;}const client:Client={id:crypto.randomUUID(),name:item.name,phone:item.phone,email:item.email,birthday:item.birthday,location:'',lastVisit:'',status:'active',tags:[],aiScore:'',ownerId:tenant||undefined};try{await addClient(client);saved++;keys.forEach(k=>seen.add(k));}catch{skipped++;}}setBusy(false);setRows([]);if (saved) toast.success(`${saved} importados; ${skipped} ignorados ou não gravados.`); else toast.error(`${saved} importados; ${skipped} ignorados ou não gravados.`);};
 return <main className="min-h-screen bg-[#070b15] text-slate-100 p-6"><div className="max-w-3xl mx-auto space-y-5"><Link to="/settings" className="text-pink-300">← Configurações</Link><h1 className="text-3xl font-bold">Importar clientes</h1><p className="text-slate-300">Importe um CSV com colunas Nome, Telefone, E-mail e Nascimento. Confira os registros antes de gravar no Firebase da sua empresa. Nenhuma campanha será disparada automaticamente.</p>{!allowed?<p role="alert" className="p-4 rounded-lg border border-amber-500">Acesso disponível somente para o proprietário autenticado da empresa.</p>:<><input aria-label="Selecionar arquivo CSV" type="file" accept=".csv,text/csv,text/plain" onChange={e=>void read(e.target.files?.[0])} className="block w-full rounded-xl border border-slate-700 p-4"/>{rows.length>0&&<><p>{rows.length} registro(s) preparados. Limite: 500 por arquivo.</p><div className="rounded-xl border border-slate-700 overflow-auto max-h-80"><table className="w-full text-sm"><thead><tr><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Telefone</th><th className="p-2 text-left">E-mail</th></tr></thead><tbody>{rows.slice(0,100).map((r,i)=><tr key={i} className="border-t border-slate-800"><td className="p-2">{r.name}</td><td className="p-2">{r.phone}</td><td className="p-2">{r.email}</td></tr>)}</tbody></table></div><button onClick={()=>void save()} disabled={busy} className="rounded-xl bg-pink-600 px-5 py-3 font-semibold disabled:opacity-50">{busy?'Importando...':'Confirmar importação para esta empresa'}</button></>}</>}</div></main>;
}