
import React, { useState, useEffect } from 'react';
import { UserPlus, Phone, CheckCircle, Clock, Trash2, Send, Star, Users, MessageSquare, Plus, X, XCircle, Edit3 } from 'lucide-react';
import { Client } from '../types.ts';
import { supabase } from '../supabase.ts';

interface Referral {
  id: string;
  clientId: string;
  name: string;
  phone: string;
  status: 'interested' | 'contacted' | 'converted' | 'lost';
  createdAt: string;
}

interface ReferralModuleProps {
  client: Client;
}

export const ReferralModule: React.FC<ReferralModuleProps> = ({ client }) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<string | null>(null);
  const [newReferral, setNewReferral] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, [client.id]);

  const fetchReferrals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('clientId', client.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error("Erro ao carregar indicações:", error);
    } else {
      setReferrals(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferral.name || !newReferral.phone) return;

    if (editingReferralId) {
      const { error } = await supabase
        .from('referrals')
        .update({ name: newReferral.name, phone: newReferral.phone })
        .eq('id', editingReferralId);

      if (error) {
        alert("Erro ao atualizar: " + error.message);
      } else {
        setReferrals(referrals.map(r => 
          r.id === editingReferralId 
            ? { ...r, name: newReferral.name, phone: newReferral.phone } 
            : r
        ));
      }
    } else {
      const referral = {
        clientId: client.id,
        name: newReferral.name,
        phone: newReferral.phone,
        status: 'interested'
      };

      const { data, error } = await supabase
        .from('referrals')
        .insert([referral])
        .select();

      if (error) {
        alert("Erro ao salvar: " + error.message);
      } else {
        setReferrals([data[0], ...referrals]);
      }
    }

    setNewReferral({ name: '', phone: '' });
    setIsAdding(false);
    setEditingReferralId(null);
  };

  const handleEdit = (ref: Referral) => {
    setNewReferral({ name: ref.name, phone: ref.phone });
    setEditingReferralId(ref.id);
    setIsAdding(true);
  };

  const updateStatus = async (id: string, status: Referral['status']) => {
    const { error } = await supabase
      .from('referrals')
      .update({ status })
      .eq('id', id);

    if (error) {
      alert("Erro ao atualizar status: " + error.message);
    } else {
      setReferrals(referrals.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const deleteReferral = async (id: string) => {
    if (confirm("Deseja remover esta indicação do sistema?")) {
      const { error } = await supabase
        .from('referrals')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Erro ao excluir: " + error.message);
      } else {
        setReferrals(referrals.filter(r => r.id !== id));
      }
    }
  };

  const sendWhatsApp = (ref: Referral) => {
    const text = `Olá ${ref.name}! Tudo bem? Falo da Loop Energia. 🌞\n\nRecebi sua indicação através do nosso cliente *${client.name}*. Gostaríamos de apresentar como você também pode economizar na sua conta de luz com nossas soluções! ⚡\n\nPodemos conversar?`;
    const cleanPhone = ref.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const getStatusStyle = (status: Referral['status']) => {
    switch (status) {
      case 'converted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'lost': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-brand-50 text-brand-600 border-brand-100';
    }
  };

  const getStatusLabel = (status: Referral['status']) => {
    switch (status) {
      case 'converted': return 'Convertido ✅';
      case 'contacted': return 'Em Contato ⏳';
      case 'lost': return 'Não Convertido ❌';
      default: return 'Interessado 🌟';
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header do Módulo */}
      <div className="bg-brand-900 p-8 flex justify-between items-center relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-800 rounded-full -mr-16 -mt-16 opacity-40"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Programa de Indicação</h2>
          <p className="text-[10px] text-brand-300 font-bold uppercase tracking-widest mt-1">Indicados por {client.name}</p>
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditingReferralId(null); setNewReferral({ name: '', phone: '' }); }}
          className="relative z-10 bg-gold-500 hover:bg-gold-400 text-brand-900 p-4 rounded-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          <UserPlus size={24} />
        </button>
      </div>

      {/* Formulário de Adição/Edição (Overlay) */}
      {isAdding && (
        <div className="absolute inset-0 bg-brand-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-brand-900 uppercase tracking-tighter">
                {editingReferralId ? 'Editar Indicação' : 'Nova Indicação'}
              </h3>
              <button onClick={() => { setIsAdding(false); setEditingReferralId(null); }} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block ml-1">Nome do Indicado</label>
                <input 
                  autoFocus
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-brand-500 transition-all"
                  placeholder="Ex: João Silva"
                  value={newReferral.name}
                  onChange={e => setNewReferral({...newReferral, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 block ml-1">WhatsApp</label>
                <input 
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-brand-500 transition-all"
                  placeholder="(00) 00000-0000"
                  value={newReferral.phone}
                  onChange={e => setNewReferral({...newReferral, phone: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-brand-600 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-brand-700 transition-all">
                {editingReferralId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR E SALVAR'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Indicações */}
      <div className="flex-1 overflow-y-auto p-8 custom-scroll">
        {referrals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <div className="bg-gray-100 p-8 rounded-full mb-6">
              <Users size={64} className="text-gray-300" />
            </div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Nenhuma indicação ainda</p>
            <p className="text-[10px] font-bold text-gray-300 mt-2">Peça uma indicação para o cliente e clique no +</p>
          </div>
        ) : (
          <div className="space-y-4">
            {referrals.map(ref => (
              <div key={ref.id} className="bg-white border border-gray-100 p-6 rounded-[2.2rem] shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-5 overflow-hidden w-full">
                  <div className={`p-4 rounded-2xl shrink-0 border ${getStatusStyle(ref.status)}`}>
                    <MessageSquare size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-black text-brand-900 uppercase truncate leading-tight">{ref.name}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">{new Date(ref.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusStyle(ref.status)}`}>
                        {getStatusLabel(ref.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ref.status === 'interested' && (
                    <button onClick={() => updateStatus(ref.id, 'contacted')} title="Marcar Contato" className="p-3 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-all border border-amber-100">
                      <Clock size={18} />
                    </button>
                  )}
                  {/* Botão Vermelho (Lost): Some se já for convertido OU já for lost */}
                  {ref.status !== 'converted' && ref.status !== 'lost' && (
                    <button onClick={() => updateStatus(ref.id, 'lost')} title="Não Convertido" className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all border border-red-100">
                      <XCircle size={18} />
                    </button>
                  )}
                  {/* Botão Verde (Converted): Some se já for convertido OU já for lost */}
                  {ref.status !== 'converted' && ref.status !== 'lost' && (
                    <button onClick={() => updateStatus(ref.id, 'converted')} title="Venda Concluída" className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => sendWhatsApp(ref)} title="Enviar WhatsApp" className="p-3 bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-all shadow-lg">
                    <Send size={18} />
                  </button>
                  <button onClick={() => handleEdit(ref)} title="Editar" className="p-3 bg-gray-50 text-gray-400 hover:text-brand-600 rounded-xl transition-all">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => deleteReferral(ref.id)} title="Excluir" className="p-3 bg-gray-50 text-gray-300 hover:text-red-500 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumo de Conversão (Footer) */}
      <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-around shrink-0">
        <div className="text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Indicados</p>
          <p className="text-2xl font-black text-brand-900 leading-none">{referrals.length}</p>
        </div>
        <div className="h-10 w-px bg-gray-200"></div>
        <div className="text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Convertidos</p>
          <p className="text-2xl font-black text-emerald-600 leading-none">{referrals.filter(r => r.status === 'converted').length}</p>
        </div>
        <div className="h-10 w-px bg-gray-200"></div>
        <div className="text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Conversão</p>
          <p className="text-2xl font-black text-amber-500 leading-none">
            {referrals.length > 0 ? Math.round((referrals.filter(r => r.status === 'converted').length / referrals.length) * 100) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};
