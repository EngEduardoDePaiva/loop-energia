
import React, { useState } from 'react';
import { Client, Stage } from '../types.ts';
import { Plus, Search, User, Zap, List, Kanban, X, ChevronRight, Clock, Trash2, Edit3, CalendarDays, ArrowRightLeft, CheckCircle2, Star, Timer, CheckCircle, Trophy, Phone, Hash, Calendar, Users } from 'lucide-react';
import { STAGES, STEP_ICONS } from '../constants.ts';
import { generateTemplateContent } from '../services/templateService.ts';

interface ClientListProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  onCreateClient: (client: Client) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onUpdateClientStage: (clientId: string, newStageId: string, stageData?: Record<string, string>) => void;
  isAdmin?: boolean;
}

type FilterStatus = 'ativos' | 'entregues' | 'noprazo' | 'atencao' | 'urgente' | null;

interface PendingTransition {
  client: Client;
  targetStage: Stage;
  fieldValues: Record<string, string>;
}

export const ClientList: React.FC<ClientListProps> = ({ clients, onSelectClient, onCreateClient, onEditClient, onDeleteClient, onUpdateClientStage, isAdmin = true }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list'); 
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [draggedClientId, setDraggedClientId] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  
  const [formData, setFormData] = useState<Partial<Client> & { deliveryDate?: string }>({
    name: '', clientNumber: '', prgd: '', phone: '', currentStageId: STAGES[0].id, deliveryDate: ''
  });

  const formatPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.substring(0, 11);
    if (value.length > 10) return value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    if (value.length > 5) return value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    if (value.length > 2) return value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    return value.replace(/^(\d*)/, "($1");
  };

  const formatPRGD = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.substring(0, 5);
    if (value.length > 3) return value.replace(/^(\d{3})(\d{0,2})/, "$1-$2");
    return value;
  };

  const calculateDaysElapsed = (startStr: string, endStr?: string) => {
    if (!startStr) return 0;
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
    return Math.floor(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateScore = (client: Client) => {
    const isDelivered = client.currentStageId === '7';
    const days = calculateDaysElapsed(client.createdAt, isDelivered ? client.stageHistory['7'] : undefined);
    let score = 5;
    if (days > 120) score -= 2;
    else if (days > 90) score -= 1;
    return Math.max(1, score);
  };

  const getStatusInfo = (days: number, isDelivered: boolean) => {
    if (isDelivered) return { label: '🟢 ENTREGUE', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500', key: 'entregues' };
    if (days > 120) return { label: '🔴 URGENTE', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', key: 'urgente' };
    if (days > 75) return { label: '🟡 ATENÇÃO', color: 'text-amber-500', bg: 'bg-amber-50', dot: 'bg-amber-500', key: 'atencao' };
    return { label: '🟢 NO PRAZO', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', key: 'noprazo' };
  };

  const counts = clients.reduce((acc, c) => {
    const isDelivered = c.currentStageId === '7';
    const days = calculateDaysElapsed(c.createdAt, isDelivered ? c.stageHistory['7'] : undefined);
    const info = getStatusInfo(days, isDelivered);
    
    if (!isDelivered) acc.ativos++;
    acc[info.key as 'entregues' | 'urgente' | 'atencao' | 'noprazo']++;
    return acc;
  }, { ativos: 0, entregues: 0, noprazo: 0, atencao: 0, urgente: 0 });

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.prgd.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (!statusFilter) return true;
    const isDelivered = c.currentStageId === '7';
    const days = calculateDaysElapsed(c.createdAt, isDelivered ? c.stageHistory['7'] : undefined);
    const info = getStatusInfo(days, isDelivered);
    if (statusFilter === 'ativos') return !isDelivered;
    return info.key === statusFilter;
  });

  const triggerWhatsApp = (client: Client, stage: Stage, additionalData: Record<string, string> = {}) => {
    if (!client.phone) return;
    const combinedData = { ...(client.stageData || {}), ...additionalData };
    const generated = generateTemplateContent(stage, client, combinedData);
    const cleanPhone = client.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(generated.body)}`, '_blank');
  };

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    if (!isAdmin) return;
    setDraggedClientId(clientId);
    e.dataTransfer.setData("clientId", clientId);
    e.dataTransfer.effectAllowed = "move";
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => { target.style.opacity = '0.4'; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedClientId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAdmin) return;
    if (dragOverStageId !== stageId) setDragOverStageId(stageId);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault(); e.stopPropagation();
    setDragOverStageId(null);
    const clientId = e.dataTransfer.getData("clientId") || draggedClientId;
    setDraggedClientId(null);
    if (!clientId || !isAdmin) return;
    const client = clients.find(c => c.id === clientId);
    const targetStage = STAGES.find(s => s.id === stageId);
    if (client && targetStage) {
      if (client.currentStageId === stageId) return;
      const missingFields = (targetStage.requiredFields || []).filter(f => !client.stageData?.[f]);
      if (missingFields.length > 0) {
        setPendingTransition({ client, targetStage, fieldValues: missingFields.reduce((acc, f) => ({ ...acc, [f]: '' }), {}) });
      } else {
        onUpdateClientStage(clientId, stageId);
        if (targetStage.template) triggerWhatsApp(client, targetStage);
      }
    }
  };

  const handleConfirmTransition = () => {
    if (!pendingTransition) return;
    const missing = Object.values(pendingTransition.fieldValues).some(v => !v || (v as string).trim() === '');
    if (missing) { alert("Por favor, preencha todos os campos obrigatórios para avançar."); return; }
    onUpdateClientStage(pendingTransition.client.id, pendingTransition.targetStage.id, pendingTransition.fieldValues);
    if (pendingTransition.targetStage.template) triggerWhatsApp(pendingTransition.client, pendingTransition.targetStage, pendingTransition.fieldValues);
    setPendingTransition(null);
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, clientNumber: client.clientNumber, prgd: client.prgd, phone: client.phone });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    onEditClient({ ...editingClient, name: formData.name!, clientNumber: formData.clientNumber || '', prgd: formData.prgd!, phone: formData.phone! });
    setEditingClient(null);
    setFormData({});
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200 h-full flex flex-col relative overflow-hidden">
      
      {pendingTransition && (
        <div className="fixed inset-0 bg-brand-900/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden p-10 border border-white/20 animate-in zoom-in duration-300">
            <div className="bg-amber-50 p-4 rounded-2xl mb-6 flex items-center gap-3 border border-amber-100">
              <CalendarDays className="text-amber-600" size={24} />
              <h2 className="text-lg font-black text-brand-900 uppercase tracking-tighter">Ação Obrigatória</h2>
            </div>
            <p className="text-[11px] text-gray-500 font-bold uppercase mb-8 tracking-widest leading-relaxed">Para avançar para <span className="text-brand-600">{pendingTransition.targetStage.title}</span>, precisamos preencher:</p>
            <div className="space-y-6">
              {Object.keys(pendingTransition.fieldValues).map(f => (
                <div key={f}>
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 ml-1 tracking-widest">{f}</label>
                  <input autoFocus className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-brand-900 outline-none focus:border-brand-500 focus:bg-white transition-all shadow-inner" value={pendingTransition.fieldValues[f]} onChange={e => setPendingTransition({...pendingTransition, fieldValues: {...pendingTransition.fieldValues, [f]: e.target.value}})} placeholder={`Informe o valor de ${f}`} />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 mt-10">
              <button onClick={handleConfirmTransition} className="w-full bg-brand-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">Confirmar e Iniciar WhatsApp <ArrowRightLeft size={16} /></button>
              <button onClick={() => setPendingTransition(null)} className="w-full bg-gray-100 text-gray-500 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-gray-200 transition-all">Cancelar Transição</button>
            </div>
          </div>
        </div>
      )}

      {(isCreating || editingClient) && (
          <div className="fixed inset-0 bg-brand-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden p-8 border border-white/20">
                  <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-black text-brand-600 uppercase tracking-tighter">{editingClient ? 'Editar Cadastro' : 'Novo Cadastro'}</h2>
                      <button onClick={() => { setIsCreating(false); setEditingClient(null); }} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                  </div>
                  <form onSubmit={editingClient ? handleSaveEdit : (e) => { 
                    e.preventDefault(); 
                    const stageData: Record<string, string> = {};
                    if (formData.currentStageId === '3' && formData.deliveryDate) {
                      stageData['data prevista'] = formData.deliveryDate;
                    }
                    onCreateClient({ 
                      id: Date.now().toString(), 
                      name: formData.name!, 
                      clientNumber: formData.clientNumber || '', 
                      prgd: formData.prgd!, 
                      phone: formData.phone!, 
                      projectName: '', 
                      additionalNotes: '', 
                      currentStageId: formData.currentStageId || STAGES[0].id, 
                      createdAt: new Date().toISOString(), 
                      stageHistory: {}, 
                      stageData: stageData 
                    }); 
                    setIsCreating(false); 
                    setFormData({ name: '', clientNumber: '', prgd: '', phone: '', currentStageId: STAGES[0].id, deliveryDate: '' }); 
                  }} className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase text-brand-900 block mb-2 tracking-widest">Titular do Projeto</label>
                        <input required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:bg-white" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-brand-900 block mb-2 tracking-widest">WhatsApp</label>
                          <input required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:bg-white" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-brand-900 block mb-2 tracking-widest">Nº PRGD</label>
                          <input required className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:bg-white" placeholder="000-00" value={formData.prgd} onChange={e => setFormData({...formData, prgd: formatPRGD(e.target.value)})} />
                        </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-brand-900 block mb-2 tracking-widest">Nº do Cliente (Opcional)</label>
                          <input className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:bg-white" placeholder="0000000" value={formData.clientNumber} onChange={e => setFormData({...formData, clientNumber: e.target.value})} />
                      </div>
                      
                      {!editingClient && (
                        <>
                          <div>
                            <label className="text-[10px] font-black uppercase text-brand-900 block mb-2 tracking-widest">Etapa Inicial</label>
                            <select 
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:bg-white appearance-none cursor-pointer"
                              value={formData.currentStageId}
                              onChange={e => setFormData({...formData, currentStageId: e.target.value})}
                            >
                              {STAGES.map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                              ))}
                            </select>
                          </div>

                          {formData.currentStageId === '3' && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                              <label className="text-[10px] font-black uppercase text-brand-600 block mb-2 tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Data da Entrega do Material
                              </label>
                              <input 
                                required 
                                type="date"
                                className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-2xl font-bold outline-none focus:bg-white text-emerald-900" 
                                value={formData.deliveryDate} 
                                onChange={e => setFormData({...formData, deliveryDate: e.target.value})} 
                              />
                            </div>
                          )}
                        </>
                      )}
                      <button type="submit" className="w-full bg-brand-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-brand-700 transition-all mt-4">{editingClient ? 'SALVAR ALTERAÇÕES' : 'SALVAR E INICIAR JORNADA'}</button>
                  </form>
              </div>
          </div>
      )}

      <div className="p-6 border-b flex flex-col gap-6 bg-gray-50/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-black text-brand-600 uppercase tracking-tighter leading-tight">Gestão de Carteira</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button onClick={() => setStatusFilter(statusFilter === 'ativos' ? null : 'ativos')} className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest border transition-all ${statusFilter === 'ativos' ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-brand-600 border-brand-100 hover:border-brand-300'}`}>{counts.ativos} Ativos</button>
                    <button onClick={() => setStatusFilter(statusFilter === 'entregues' ? null : 'entregues')} className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest border transition-all ${statusFilter === 'entregues' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600 border-green-100 hover:border-green-300'}`}>{counts.entregues} Entregues</button>
                    <div className="h-4 w-px bg-gray-200 mx-2"></div>
                    <button onClick={() => setStatusFilter(statusFilter === 'noprazo' ? null : 'noprazo')} className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest border transition-all ${statusFilter === 'noprazo' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-600 border-emerald-100 hover:border-emerald-300'}`}>{counts.noprazo} No Prazo</button>
                    <button onClick={() => setStatusFilter(statusFilter === 'atencao' ? null : 'atencao')} className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest border transition-all ${statusFilter === 'atencao' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-500 border-amber-100 hover:border-amber-300'}`}>{counts.atencao} Atenção</button>
                    <button onClick={() => setStatusFilter(statusFilter === 'urgente' ? null : 'urgente')} className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest border transition-all ${statusFilter === 'urgente' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-600 border-red-100 hover:border-red-300'}`}>{counts.urgente} Urgente</button>
                </div>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400'}`}><List size={14} /> Lista</button>
                <button onClick={() => setViewMode('pipeline')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'pipeline' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-400'}`}><Kanban size={14} /> Pipeline</button>
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 text-gray-300" size={18} />
                <input placeholder="Filtrar por nome ou PRGD..." className="w-full pl-12 p-3.5 rounded-2xl border bg-white outline-none focus:border-brand-300 font-medium text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            {isAdmin && <button onClick={() => setIsCreating(true)} className="bg-brand-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-brand-700 transition-all flex items-center justify-center gap-2"><Plus size={18} /> Novo Cliente</button>}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-gray-100/30">
        {viewMode === 'list' ? (
          <div className="p-6 overflow-auto h-full scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {filteredClients.map(client => (
                    <div key={client.id} onClick={() => onSelectClient(client)}>
                       <ClientCardItem 
                          client={client} 
                          isAdmin={isAdmin}
                          calculateDays={calculateDaysElapsed}
                          calculateScore={calculateScore}
                          getStatus={getStatusInfo}
                          onDelete={() => onDeleteClient(client.id)}
                          onEdit={() => handleEditClick(client)}
                       />
                    </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex overflow-x-auto h-full p-6 gap-6 snap-x custom-scroll">
            {STAGES.map(stage => {
              const stageClients = filteredClients.filter(c => c.currentStageId === stage.id);
              const Icon = STEP_ICONS[stage.stepNumber] || Zap;
              const isOver = dragOverStageId === stage.id;
              return (
                <div key={stage.id} className={`min-w-[340px] flex flex-col h-full snap-start transition-all relative`} onDragOver={(e) => handleDragOver(e, stage.id)} onDragEnter={(e) => { e.preventDefault(); if (isAdmin) setDragOverStageId(stage.id); }} onDragLeave={(e) => { e.preventDefault(); setDragOverStageId(null); }} onDrop={(e) => handleDrop(e, stage.id)}>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-900 text-gold-400 p-2.5 rounded-xl border border-brand-800"><Icon size={16} /></div>
                        <h3 className="text-[11px] font-black uppercase text-brand-900 tracking-tight">{stage.title}</h3>
                    </div>
                    <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{stageClients.length}</span>
                  </div>
                  <div className={`flex-1 overflow-y-auto space-y-5 p-4 rounded-[2.5rem] bg-gray-100/60 transition-all border-2 border-dashed ${isOver ? 'border-brand-500 bg-brand-50/50 ring-4 ring-brand-500/20' : 'border-transparent'} custom-scroll`}>
                    {stageClients.map(client => {
                        const totalDays = calculateDaysElapsed(client.createdAt);
                        const daysInStage = calculateDaysElapsed(client.stageHistory[client.currentStageId] || client.createdAt);
                        const isDelivered = client.currentStageId === '7';
                        const status = getStatusInfo(totalDays, isDelivered);
                        const score = calculateScore(client);
                        const referralCount = (() => {
                            try {
                                const saved = localStorage.getItem(`loop_referrals_${client.id}`);
                                return saved ? JSON.parse(saved).length : 0;
                            } catch { return 0; }
                        })();
                        return (
                          <div key={client.id} draggable={isAdmin} onDragStart={(e) => handleDragStart(e, client.id)} onDragEnd={handleDragEnd} onClick={() => onSelectClient(client)} className={`bg-white p-6 rounded-[2.5rem] border-2 shadow-sm hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden flex flex-col gap-4 ${totalDays > 120 ? 'border-red-100' : totalDays > 75 ? 'border-amber-100' : 'border-white'}`}>
                             <div className="flex justify-between items-start">
                               <h4 className="font-black text-brand-900 uppercase text-[12px] truncate w-full group-hover:text-brand-600 transition-colors leading-tight">{client.name}</h4>
                               {isAdmin && <div className="flex gap-1.5 shrink-0">
                                 <Edit3 size={13} className="text-gray-300 hover:text-brand-600 transition-all opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleEditClick(client); }} />
                                 <Trash2 size={13} className="text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); onDeleteClient(client.id); }} />
                               </div>}
                             </div>

                             <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= score ? "#dbb832" : "transparent"} className={s <= score ? "text-gold-500" : "text-gray-100"} />)}
                             </div>

                             <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                                <div className="flex flex-col">
                                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Tempo Total</span>
                                   <span className="text-[11px] font-black text-brand-900 flex items-center gap-1"><Clock size={10} className="text-gray-400"/> {totalDays}d</span>
                                </div>
                                <div className="flex flex-col border-l border-gray-100 pl-2">
                                   <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Nesta Etapa</span>
                                   <span className="text-[11px] font-black text-brand-600 flex items-center gap-1"><Timer size={10} className="text-brand-400"/> {daysInStage}d</span>
                                </div>
                             </div>

                             <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PRGD: {client.prgd || '---'}</span>
                                  <div className="flex items-center gap-1 text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                    <Users size={8} /> {referralCount}
                                  </div>
                                </div>
                                <div className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${status.color} ${status.bg} border-current`}>
                                   {status.label.replace(/🟢|🟡|🔴/g, '').trim()}
                                </div>
                             </div>
                          </div>
                        );
                    })}
                    <div className="h-20 w-full pointer-events-none"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const ClientCardItem = ({ client, calculateDays, calculateScore, getStatus, isAdmin, onDelete, onEdit }: any) => {
    const isDelivered = client.currentStageId === '7';
    const totalDays = calculateDays(client.createdAt, isDelivered ? client.stageHistory['7'] : undefined);
    const score = calculateScore(client);
    const status = getStatus(totalDays, isDelivered);
    const currentStage = STAGES.find(s => s.id === client.currentStageId);
    const Icon = STEP_ICONS[currentStage?.stepNumber || '1'];
    const startDate = new Date(client.createdAt).toLocaleDateString('pt-BR');

    const referralCount = (() => {
        try {
            const saved = localStorage.getItem(`loop_referrals_${client.id}`);
            return saved ? JSON.parse(saved).length : 0;
        } catch { return 0; }
    })();

    const getCategoryColor = (category: string) => {
      switch(category) {
        case 'PRE': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'EXECUTION': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'POST': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        default: return 'bg-gray-50 text-gray-600 border-gray-100';
      }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 min-h-[420px] hover:border-brand-400 cursor-pointer transition-all shadow-sm hover:shadow-2xl group relative overflow-hidden flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                    <div className="bg-brand-50 p-5 rounded-[2rem] group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                      <User size={34} />
                    </div>
                    <div>
                        <h3 className="font-black text-brand-900 uppercase text-xl truncate max-w-[200px] leading-tight group-hover:text-brand-600 transition-colors">{client.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= score ? "#dbb832" : "transparent"} className={s <= score ? "text-gold-500" : "text-gray-100"} />)}
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(currentStage?.category || '')}`}>
                            {currentStage?.category}
                          </span>
                        </div>
                    </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-3 bg-gray-50 hover:bg-brand-600 text-gray-400 hover:text-white rounded-[1.2rem] transition-all shadow-sm">
                      <Edit3 size={18}/>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-3 bg-gray-50 hover:bg-red-600 text-gray-400 hover:text-white rounded-[1.2rem] transition-all shadow-sm">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 bg-gray-50/80 px-4 py-3.5 rounded-2xl border border-gray-100">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Hash size={11} /> Nº Cliente</span>
                <span className="text-[12px] font-black text-brand-900">{client.clientNumber || 'Não Inf.'}</span>
              </div>
              <div className="flex flex-col gap-1 bg-gray-50/80 px-4 py-3.5 rounded-2xl border border-gray-100">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Zap size={11} className="text-brand-600" /> PRGD</span>
                <span className="text-[12px] font-black text-brand-900">{client.prgd || '---'}</span>
              </div>
              <div className="flex flex-col gap-1 bg-gray-50/80 px-4 py-3.5 rounded-2xl border border-gray-100">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Phone size={11} className="text-green-500" /> WhatsApp</span>
                <span className="text-[12px] font-bold text-brand-900">{client.phone || '---'}</span>
              </div>
              <div className="flex flex-col gap-1 bg-gray-50/80 px-4 py-3.5 rounded-2xl border border-gray-100">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={11} className="text-amber-500" /> Início</span>
                <span className="text-[12px] font-bold text-brand-900">{startDate}</span>
              </div>
              {/* Novo Indicador de Indicações no Grid */}
              <div className="flex flex-col gap-1 bg-indigo-50/50 px-4 py-3.5 rounded-2xl border border-indigo-100 col-span-2">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={11} className="text-indigo-500" /> Indicações Recebidas</span>
                <span className="text-[12px] font-black text-indigo-700">{referralCount} {referralCount === 1 ? 'Indicação' : 'Indicações'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex-1 py-3.5 px-4 rounded-[1.8rem] text-center text-[10px] font-black tracking-[0.2em] shadow-sm border border-white/50 ${status.bg} ${status.color}`}>
                  {status.label}
              </div>
              <div className="bg-brand-900 text-white px-4 py-3.5 rounded-[1.8rem] flex items-center gap-2 shadow-lg">
                <Clock size={14} className="text-gold-400" />
                <span className="text-[11px] font-black tracking-tight">{totalDays} dias</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-900 text-gold-400 p-3.5 rounded-[1.5rem] shadow-md border border-brand-800"><Icon size={22} /></div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Etapa do Processo</span>
                        <span className="text-[13px] font-black text-brand-900 uppercase truncate max-w-[170px] tracking-tight">{currentStage?.title}</span>
                    </div>
                </div>
                <div className="bg-brand-50 p-3 rounded-xl border border-brand-100 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                  <ChevronRight size={22} />
                </div>
            </div>
        </div>
    );
};
