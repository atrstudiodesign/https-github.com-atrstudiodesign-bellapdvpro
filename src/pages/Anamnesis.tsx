import { useState } from 'react';
import { Search, Plus, Save, FileText, UserCircle, Calendar, Edit3, X, History, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNicheStore } from '../store/niche';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth';

const mockPatients = [
  { id: '1', name: 'Ana Paula Souza', phone: '(11) 98765-4321', lastVisit: '2025-05-18' },
  { id: '2', name: 'Juliana Martins', phone: '(11) 91234-5678', lastVisit: '2025-05-10' },
];

const mockRecords = [
  { id: 'r1', patientId: '1', date: '2025-05-18', type: 'anamnesis', content: 'Paciente relata alergia a dipirona. Queixa principal: dor na lombar.', professional: 'Dr. Carlos' },
  { id: 'r2', patientId: '1', date: '2025-05-25', type: 'evolution', content: 'Sessão 1: Melhora parcial da dor, exercícios de alongamento na sessão.', professional: 'Dr. Carlos' },
];

export default function Anamnesis() {
  const { getConfig } = useNicheStore();
  const config = getConfig();
  const isDemo = useAuthStore(state => state.user?.isDemo === true);

  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [recordType, setRecordType] = useState<'anamnesis' | 'evolution'>('anamnesis');
  const [recordContent, setRecordContent] = useState('');
  const [records, setRecords] = useState(isDemo ? mockRecords : []);

  const filteredPatients = (isDemo ? mockPatients : []).filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleSaveRecord = () => {
    if (!recordContent || !selectedPatient) return;
    const newRecord = {
      id: Math.random().toString(36).substring(2, 9),
      patientId: selectedPatient.id,
      date: new Date().toISOString().split('T')[0],
      type: recordType,
      content: recordContent,
      professional: 'Profissional Atual'
    };
    setRecords([newRecord, ...records]);
    setIsNewRecordModalOpen(false);
    setRecordContent('');
  };

  const patientRecords = selectedPatient ? records.filter(r => r.patientId === selectedPatient.id) : [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full">
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-white mb-2">Prontuário Eletrônico</h1>
        <p className="text-slate-400">Gestão de anamnese e evolução do {config.terminology.client.toLowerCase()}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[700px]">
        {/* Patients List */}
        <div className="glass-card border-[#1A2C47] p-0 flex flex-col h-full bg-[#0C1627]/60">
          <div className="p-4 border-b border-[#1A2C47]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar ${config.terminology.client}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredPatients.map(patient => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${selectedPatient?.id === patient.id ? 'bg-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.15)] border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div>
                  <h3 className="font-semibold text-white text-sm">{patient.name}</h3>
                  <p className="text-xs text-slate-400">{patient.phone}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Record */}
        <div className="md:col-span-2 glass-card border-[#1A2C47] p-0 flex flex-col h-full bg-[#09111D]/80">
          {selectedPatient ? (
            <>
              <div className="p-6 border-b border-[#1A2C47] bg-[#0C1627] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                       Última visita: {selectedPatient.lastVisit}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewRecordModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Novo Registro
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {patientRecords.length === 0 ? (
                   <div className="text-center py-20">
                     <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                     <h3 className="text-lg font-semibold text-white mb-2">Nenhum registro encontrado</h3>
                     <p className="text-slate-400 text-sm max-w-sm mx-auto">Este {config.terminology.client.toLowerCase()} ainda não possui anamnese ou evolução.</p>
                   </div>
                ) : (
                  patientRecords.map((record) => (
                    <div key={record.id} className="bg-[#0C1627] border border-[#1A2C47] rounded-xl p-5 relative overflow-hidden group hover:border-[#253B5C] transition-all">
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-2">
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${record.type === 'anamnesis' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {record.type === 'anamnesis' ? 'Anamnese' : 'Evolução'}
                           </span>
                           <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(record.date).toLocaleDateString('pt-BR')}</span>
                         </div>
                         <button className="text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"><Edit3 className="w-4 h-4" /></button>
                      </div>
                      <p className="text-slate-200 text-sm whitespace-pre-wrap">{record.content}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-4 font-semibold tracking-wider flex items-center gap-1">
                        <UserCircle className="w-3 h-3" /> Profissional: {record.professional}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
              <History className="w-16 h-16 text-slate-700 mb-4 opacity-50" />
              <h2 className="text-xl font-bold text-white mb-2">Prontuário Eletrônico</h2>
              <p className="text-slate-400 max-w-sm">Selecione um {config.terminology.client.toLowerCase()} ao lado para visualizar e adicionar registros de anamnese e evolução.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isNewRecordModalOpen && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
           >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0C1627] border border-[#1A2C47] rounded-3xl w-full max-w-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                 <div className="p-6 border-b border-[#1A2C47] flex justify-between items-center bg-[#09111D]">
                    <h2 className="text-xl font-semibold text-white">Novo Registro - {selectedPatient?.name}</h2>
                    <button onClick={() => setIsNewRecordModalOpen(false)} className="p-2 bg-[#1A2C47] hover:bg-[#253B5C] rounded-full text-slate-300 transition-colors"><X className="w-5 h-5"/></button>
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-4">
                       <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">
                          <Bot className="w-5 h-5" />
                       </div>
                       <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">Transcrição por IA (Voz)</h4>
                          <p className="text-xs text-slate-400 mb-3">Dite o prontuário. A IA formata com termos técnicos e pontuação correta.</p>
                          <button 
                             onClick={() => {
                                const id = toast.loading('Ouvindo... Fale agora.');
                                setTimeout(() => {
                                   setRecordContent('Paciente compareceu à sessão relatando melhora significativa no quadro de dor cervical. Apresenta amplitude de movimento restabelecida. Realizada liberação miofascial e orientados exercícios domiciliares.');
                                   toast.success('Áudio transcrito e formatado!', { id });
                                }, 3000);
                             }}
                             className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-colors"
                          >
                             Gravar Áudio
                          </button>
                       </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Tipo de Registro</label>
                      <div className="flex gap-4">
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input type="radio" checked={recordType === 'anamnesis'} onChange={() => setRecordType('anamnesis')} className="text-blue-500 bg-[#09111D] border-[#1A2C47]"/>
                           <span className="text-sm text-slate-300">Anamnese</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input type="radio" checked={recordType === 'evolution'} onChange={() => setRecordType('evolution')} className="text-blue-500 bg-[#09111D] border-[#1A2C47]"/>
                           <span className="text-sm text-slate-300">Evolução</span>
                         </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-semibold text-slate-500 tracking-widest block mb-2">Conteúdo do Registro *</label>
                      <textarea
                        value={recordContent}
                        onChange={(e) => setRecordContent(e.target.value)}
                        placeholder={`Descreva a ${recordType === 'anamnesis' ? 'anamnese' : 'evolução'} do paciente...`}
                        className="w-full bg-[#09111D] border border-[#1A2C47] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors min-h-[200px] resize-y"
                      />
                    </div>
                 </div>
                 <div className="p-6 border-t border-[#1A2C47] bg-[#09111D] flex gap-3">
                    <button onClick={() => setIsNewRecordModalOpen(false)} className="px-6 py-2.5 bg-transparent border border-[#1A2C47] text-slate-300 hover:bg-white/5 font-semibold rounded-xl transition-all">Cancelar</button>
                    <button onClick={handleSaveRecord} disabled={!recordContent} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50">
                      <div className="flex items-center gap-2"><Save className="w-4 h-4"/> Salvar Registro</div>
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
