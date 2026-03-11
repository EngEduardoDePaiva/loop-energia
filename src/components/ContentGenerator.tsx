
import React, { useState, useEffect } from 'react';
import { Stage, Client } from '../types.ts';
import { generateTemplateContent } from '../services/templateService.ts';
import { Copy, Phone, Zap, Trophy, Clock, CheckCircle2, ArrowRight, History, Star, Calendar, Flag, Timer, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { STAGES } from '../constants.ts';

interface ContentGeneratorProps {
  stage: Stage;
  client: Client;
  onUpdateNotes: (notes: string) => void;
  onUpdateClientStage: (clientId: string, newStageId: string, stageData?: Record<string, string>) => void;
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({ stage, client, onUpdateNotes, onUpdateClientStage }) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [editableBody, setEditableBody] = useState('');

  useEffect(() => {
    setFieldValues(client.stageData || {});
  }, [stage.id, client.id]);

  useEffect(() => {
    const generated = generateTemplateContent(stage, client, { ...client.stageData, ...fieldValues });
    setEditableBody(generated.body);
  }, [fieldValues, stage, client]);

  const calculateMetrics = () => {
    const start = new Date(client.createdAt);
    const deadline = new Date(start);
    deadline.setDate(deadline.getDate() + 120);
    const isCompleted = client.currentStageId === '7';
    const now = isCompleted ? new Date(client.stageHistory['7']) : new Date();
    const totalDays = Math.floor(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const slaPercent = Math.min(100, (totalDays / 120) * 100);
    const slaColor = totalDays > 120 ? 'bg-red-600' : totalDays > 75 ? 'bg-amber-500' : 'bg-emerald-600';
    const slaText = totalDays > 120 ? 'URGENTE' : totalDays > 75 ? 'ATENÇÃO' : 'NO PRAZO';
    
    const stageEntryStr = (client.stageHistory[client.currentStageId] as any) || client.createdAt;
    const stageEntry = new Date(stageEntryStr);
    const daysInStage = Math.floor(Math.abs(new Date().getTime() - stageEntry.getTime()) / (1000 * 60 * 60 * 24));

    let score = 5;
    if (totalDays > 120) score -= 2;
    else if (totalDays > 90) score -= 1;
    if (daysInStage > 20) score -= 1;

    return { 
      totalDays, 
      slaPercent, 
      slaColor, 
      slaText, 
      daysInStage, 
      start: start.toLocaleDateString('pt-BR'), 
      deadline: deadline.toLocaleDateString('pt-BR'),
      score: Math.max(1, score)
    };
  };

  const metrics = calculateMetrics();

  const validateFields = () => {
    if (!stage.requiredFields || stage.requiredFields.length === 0) return true;
    
    const missingFields = stage.requiredFields.filter(f => !fieldValues[f] || fieldValues[f].trim() === '');
    if (missingFields.length > 0) {
      alert(`Atenção! Você precisa preencher os seguintes campos antes de prosseguir: ${missingFields.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleWhatsApp = () => {
    if (!validateFields()) return;

    const clean = client.phone.replace(/\D/g, '');
    const phoneWithCountry = clean.startsWith('55') ? clean : '55'+clean;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(editableBody)}`, '_blank');
  };

  const handleAdvance = () => {
    if (!validateFields()) return;
    
    // Atualiza etapa no sistema
    onUpdateClientStage(client.id, stage.id, fieldValues);
    
    // Dispara WhatsApp AUTOMATICAMENTE após o avanço
    if (stage.template) {
        handleWhatsApp();
    }
  };

  const renderStageHistory = () => {
    const historyEntries = Object.entries(client.stageHistory)
      .map(([id, date]) => ({ id, date: new Date(date as string) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (historyEntries.length === 0) {
      historyEntries.push({ id: STAGES[0].id, date: new Date(client.createdAt) });
    }

    return (
      <div className="space-y-5">
        {historyEntries.map((entry, i) => {
          const s = STAGES.find(st => st.id === entry.id);
          const nextEntry = historyEntries[i+1];
          const isCurrent = entry.id === client.currentStageId;
          
          const duration = nextEntry 
            ? Math.floor((nextEntry.date.getTime() - entry.date.getTime()) / (1000 * 60 * 60 * 24))
            : Math.floor((new Date().getTime() - entry.date.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={entry.id} className="flex gap-4 relative">
              {i !== historyEntries.length - 1 && (
                <div className="absolute left-[11.5px] top-6 bottom-[-20px] w-[2px] bg-gray-200"></div>
              )}
              
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${isCurrent ? 'bg-brand-900 border-brand-900 text-gold-400' : 'bg-white border-emerald-500 text-emerald-600'}`}>
                {isCurrent ? <Timer size={12} /> : <CheckCircle2 size={12} />}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className={`text-[11px] font-black uppercase tracking-tight ${isCurrent ? 'text-brand-900' : 'text-gray-700'}`}>
                    {s?.title || 'Etapa Concluída'}
                  </p>
                  <span className="text-[9px] font-black text-gray-500">
                    {entry.date.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${isCurrent ? 'bg-brand-50 text-brand-600 border-brand-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {isCurrent ? 'Em andamento' : 'Concluída'}
                  </span>
                  <span className="text-[10px] font-black text-brand-500 uppercase tracking-tighter">
                    • {duration} {duration === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER DE STATUS COMPACTO */}
      <div className="bg-brand-900 p-6 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 border border-brand-800 shadow-xl">
        <div className="flex items-center gap-5">
           <div className="bg-brand-800/80 p-4 rounded-[1.8rem] border border-brand-700 shadow-inner">
              <Zap size={24} className="text-gold-400 fill-current" />
           </div>
           <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Etapa {stage.stepNumber}: {stage.title}</h2>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white tracking-widest shadow-lg ${metrics.slaColor}`}>
                  {metrics.slaText}
                </span>
              </div>
              <p className="text-brand-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">{stage.description}</p>
           </div>
        </div>
        
        <div className="flex items-center gap-8 bg-black/20 px-8 py-4 rounded-[2rem] border border-white/5">
           <div className="text-center">
             <p className="text-[8px] font-black text-brand-400 uppercase mb-1 tracking-widest">Jornada Total</p>
             <p className="text-xl font-black text-white leading-none">{metrics.totalDays} dias</p>
           </div>
           <div className="w-px h-8 bg-white/10"></div>
           <div className="text-center">
             <p className="text-[8px] font-black text-brand-400 uppercase mb-1 tracking-widest">Nesta Etapa</p>
             <p className="text-xl font-black text-gold-400 leading-none">{metrics.daysInStage} dias</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR: INFO & MÉTRICAS (STICKY) */}
        <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-[100px]">
          
          {/* Score Card */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-[11px] font-black text-brand-900 uppercase tracking-widest flex items-center gap-2">
                    <Star size={16} className="text-gold-500 fill-current" /> Equipe Loop
                  </h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Score de Eficiência</p>
                </div>
                <div className="text-right">
                   <span className="text-2xl font-black text-brand-900 leading-none">{metrics.score.toFixed(1)}</span>
                </div>
             </div>
             <div className="flex justify-center gap-2 py-4 bg-gray-50 rounded-3xl border border-gray-100 mb-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={24} fill={s <= metrics.score ? "#dbb832" : "transparent"} className={s <= metrics.score ? "text-gold-500" : "text-gray-200"} />
                ))}
             </div>
          </div>

          {/* Saúde do Projeto */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-5">
            <h3 className="text-[11px] font-black text-brand-900 uppercase tracking-widest flex items-center gap-2">
              <Timer size={16} className="text-brand-600" /> SLA & Prazos
            </h3>
            <div className="space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                  <span>SLA 120 dias</span>
                  <span className={metrics.totalDays > 120 ? 'text-red-600' : 'text-brand-600'}>{metrics.totalDays}d consumidos</span>
               </div>
               <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                  <div className={`h-full transition-all duration-1000 shadow-inner ${metrics.slaColor}`} style={{ width: `${metrics.slaPercent}%` }}></div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                  <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Início</p>
                  <p className="text-[11px] font-black text-brand-900">{metrics.start}</p>
               </div>
               <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 text-center">
                  <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Meta</p>
                  <p className="text-[11px] font-black text-brand-900">{metrics.deadline}</p>
               </div>
            </div>
          </div>

          {/* Histórico Corrigido & Nítido */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <h3 className="text-[11px] font-black text-brand-900 uppercase tracking-widest flex items-center gap-2 mb-8 border-b border-gray-50 pb-5">
               <History size={18} className="text-brand-500" /> Histórico
            </h3>
            {renderStageHistory()}
          </div>
        </aside>

        {/* ÁREA DE CONTEÚDO (MENSAGENS & CAMPOS) */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-white p-8 rounded-[3rem] border border-gray-200 shadow-sm space-y-10">
            {/* Inputs de Dados */}
            {stage.requiredFields && stage.requiredFields.length > 0 && (
              <section>
                 <div className="flex items-center gap-2 mb-6">
                    <TrendingUp size={18} className="text-brand-600" />
                    <h3 className="text-[12px] font-black text-brand-900 uppercase tracking-widest">Informações Necessárias</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stage.requiredFields.map(f => (
                      <div key={f}>
                         <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block ml-1 tracking-widest">{f}</label>
                         <input 
                           className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-[15px] font-bold outline-none focus:bg-white focus:border-brand-500 transition-all" 
                           value={fieldValues[f] || ''} 
                           onChange={e => setFieldValues({...fieldValues, [f]: e.target.value})} 
                           placeholder={`Valor para ${f}`}
                         />
                      </div>
                    ))}
                 </div>
              </section>
            )}

            {/* Preview da Mensagem */}
            <section className="flex flex-col gap-4">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <div className="bg-brand-50 text-brand-600 p-2 rounded-xl"><MessageSquareIcon size={18} /></div>
                     <h3 className="text-[12px] font-black text-brand-900 uppercase tracking-widest">Preview WhatsApp</h3>
                  </div>
                  <button 
                     onClick={() => {
                       navigator.clipboard.writeText(editableBody);
                       alert('Copiado!');
                     }} 
                     className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 hover:bg-brand-50 text-brand-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 transition-all active:scale-95"
                  >
                    <Copy size={16} /> Copiar
                  </button>
               </div>
               
               <div className="bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 p-8 min-h-[300px] relative">
                  <div className="absolute top-6 right-8 text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">LOOP GEV</div>
                  <div className="text-slate-800 text-[16px] font-medium leading-relaxed whitespace-pre-wrap font-sans">
                    {editableBody || <span className="text-gray-300 italic">Etapa sem template de mensagem.</span>}
                  </div>
               </div>
            </section>

            {/* Ações Finais */}
            <footer className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
               <button 
                 onClick={handleWhatsApp} 
                 className="py-6 bg-[#25D366] text-white rounded-[2rem] font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-4 shadow-xl hover:shadow-green-500/30 hover:scale-[1.01] transition-all"
               >
                 <Phone size={22} fill="currentColor" /> Enviar Mensagem
               </button>
               
               {stage.id !== client.currentStageId ? (
                 <button 
                   onClick={handleAdvance} 
                   className="py-6 bg-brand-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-4 shadow-xl hover:bg-black hover:scale-[1.01] transition-all"
                 >
                   Avançar Etapa <ArrowRight size={22} />
                 </button>
               ) : (
                 <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] flex items-center justify-center gap-4 text-emerald-700 font-black uppercase text-[12px] tracking-widest">
                   <CheckCircle2 size={24} /> Etapa Vigente
                 </div>
               )}
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

const MessageSquareIcon = ({ size }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
