
import React, { useState, useEffect } from 'react';
import { Timeline } from './components/Timeline.tsx';
import { ContentGenerator } from './components/ContentGenerator.tsx';
import { ClientList } from './components/ClientList.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ReferralModule } from './components/ReferralModule.tsx';
import { STAGES } from './constants.ts';
import { Client, Stage } from './types.ts';
import { ArrowLeft, BarChart3, LayoutList, Zap, MessageSquare, Users } from 'lucide-react';
import { generateTemplateContent } from './services/templateService.ts';
import { storageService } from './services/storageService.ts';

export default function App() {
  const [userMode] = useState<'admin'>('admin');
  const [view, setView] = useState<'list' | 'detail' | 'dashboard'>('list');
  const [detailTab, setDetailTab] = useState<'journey' | 'referrals'>('journey');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentStageId, setCurrentStageId] = useState<string>(STAGES[0].id);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await storageService.getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (newClient: Client) => {
    const now = new Date().toISOString();
    const initialStageId = newClient.currentStageId || STAGES[0].id;
    
    const clientWithHistory = {
      ...newClient,
      currentStageId: initialStageId,
      stageHistory: { [initialStageId]: now }
    };
    
    try {
      const savedClient = await storageService.saveClient(clientWithHistory);
      setClients(prev => [savedClient, ...prev]);
      handleSelectClient(savedClient);

      const selectedStage = STAGES.find(s => s.id === initialStageId);
      if (selectedStage && selectedStage.template && savedClient.phone) {
        const generated = generateTemplateContent(selectedStage, savedClient, savedClient.stageData || {});
        const rawPhone = savedClient.phone.trim();
        const cleanPhone = rawPhone.replace(/\D/g, '');
        const phoneWithCountry = rawPhone.startsWith('+') ? cleanPhone : (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`);
        const encodedText = encodeURIComponent(generated.body);
        window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`, '_blank');
      }
    } catch (error) {
      alert("Erro ao salvar cliente");
      console.error(error);
    }
  };

  const handleEditClient = async (updatedClient: Client) => {
    try {
      await storageService.updateClient(updatedClient);
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    } catch (error) {
      alert("Erro ao atualizar cliente");
      console.error(error);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm("Deseja realmente excluir este cliente? Todas as indicações vinculadas também serão removidas permanentemente.")) return;

    try {
      await storageService.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (selectedClientId === clientId) {
        setView('list');
        setSelectedClientId(null);
      }
    } catch (error) {
      alert("Erro ao excluir cliente");
      console.error(error);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setCurrentStageId(client.currentStageId || STAGES[0].id);
    setDetailTab('journey');
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!selectedClientId) return;
    
    const clientToUpdate = clients.find(c => c.id === selectedClientId);
    if (!clientToUpdate) return;

    const updatedClient = { ...clientToUpdate, additionalNotes: notes };
    
    try {
      await storageService.updateClient(updatedClient);
      setClients(prev => prev.map(c => 
        c.id === selectedClientId ? updatedClient : c
      ));
    } catch (error) {
      console.error("Erro ao atualizar notas:", error);
    }
  };

  const handleUpdateClientStage = async (clientId: string, newStageId: string, stageData?: Record<string, string>) => {
    const now = new Date().toISOString();
    const clientToUpdate = clients.find(c => c.id === clientId);
    if (!clientToUpdate) return;

    const updatedHistory = { ...clientToUpdate.stageHistory, [newStageId]: now };
    const updatedData = { ...clientToUpdate.stageData, ...stageData };
    
    const updatedClient = {
      ...clientToUpdate,
      currentStageId: newStageId,
      stageHistory: updatedHistory,
      stageData: updatedData
    };

    try {
      await storageService.updateClient(updatedClient);
      setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
      
      if (selectedClientId === clientId) {
        setCurrentStageId(newStageId);
      }
      
      const selectedStage = STAGES.find(s => s.id === newStageId);
      if (selectedStage && selectedStage.template && updatedClient.phone) {
        const generated = generateTemplateContent(selectedStage, updatedClient, updatedData);
        const rawPhone = updatedClient.phone.trim();
        const cleanPhone = rawPhone.replace(/\D/g, '');
        const phoneWithCountry = rawPhone.startsWith('+') ? cleanPhone : (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`);
        const encodedText = encodeURIComponent(generated.body);
        window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`, '_blank');
      }
    } catch (error) {
      alert("Erro ao atualizar etapa");
      console.error(error);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const currentStage = STAGES.find(s => s.id === currentStageId) || STAGES[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-10">
      <header className="bg-brand-900 h-16 sm:h-20 shrink-0 shadow-lg sticky top-0 z-[100] border-b border-brand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view === 'detail' && (
              <button onClick={() => setView('list')} className="p-2 hover:bg-white/10 rounded-full text-gold-400 transition">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none">
                LOOP <span className="text-gold-500">ENERGIA</span>
              </h1>
              <p className="text-[8px] text-brand-400 uppercase tracking-widest font-bold mt-1">Gestão de Experiência do Cliente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <nav className="flex bg-brand-800/40 p-1 rounded-xl border border-brand-700/50">
                <button 
                  onClick={() => setView('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view !== 'dashboard' && view !== 'detail' ? 'bg-brand-600 text-white shadow-lg' : 'text-brand-300 hover:text-white'}`}
                >
                  <LayoutList size={14} /> <span className="hidden sm:inline">Carteira</span>
                </button>
                <button 
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-brand-600 text-white shadow-lg' : 'text-brand-300 hover:text-white'}`}
                >
                  <BarChart3 size={14} /> <span className="hidden sm:inline">Dashboard</span>
                </button>
             </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-brand-900 uppercase tracking-widest">Carregando Dados...</p>
          </div>
        ) : view === 'list' ? (
          <ClientList 
            clients={clients} 
            onSelectClient={handleSelectClient} 
            onCreateClient={handleCreateClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            onUpdateClientStage={handleUpdateClientStage}
            isAdmin={userMode === 'admin'}
          />
        ) : view === 'dashboard' ? (
          <Dashboard clients={clients} />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-[2.5rem] border border-gray-200 shadow-sm gap-4">
               <div className="flex items-center gap-4 px-2">
                  <div className="bg-brand-900 text-gold-400 p-3 rounded-2xl shadow-lg border border-brand-800"><Zap size={24} /></div>
                  <div>
                    <h2 className="text-xl font-black text-brand-900 uppercase tracking-tight">{selectedClient?.name}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Gestão de Jornada Individual</p>
                  </div>
               </div>
               <nav className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                  <button 
                    onClick={() => setDetailTab('journey')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${detailTab === 'journey' ? 'bg-white text-brand-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <MessageSquare size={16} /> Jornada
                  </button>
                  <button 
                    onClick={() => setDetailTab('referrals')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${detailTab === 'referrals' ? 'bg-white text-brand-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Users size={16} /> Indicações
                  </button>
               </nav>
            </div>

            {detailTab === 'journey' ? (
              <div className="flex flex-col gap-6">
                <Timeline 
                  currentStageId={currentStageId} 
                  onSelectStage={(s) => setCurrentStageId(s.id)} 
                />
                <div className="w-full">
                  {selectedClient && (
                    <ContentGenerator 
                      stage={currentStage}
                      client={selectedClient}
                      onUpdateNotes={handleUpdateNotes}
                      onUpdateClientStage={handleUpdateClientStage}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full">
                {selectedClient && <ReferralModule client={selectedClient} />}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
