
import React, { useState, useRef } from 'react';
import { Client } from '../types.ts';
import { STAGES } from '../constants.ts';
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  Users, 
  Star, 
  Download, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  Info,
  Loader2,
  FileText,
  Flag,
  UserPlus,
  Target
} from 'lucide-react';

interface DashboardProps {
  clients: Client[];
}

declare var html2pdf: any;

export const Dashboard: React.FC<DashboardProps> = ({ clients }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const total = clients.length;
  const delivered = clients.filter(c => c.currentStageId === '7').length;
  const active = total - delivered;
  
  const calculateDays = (start: string, end?: string) => {
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    return Math.floor(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  };

  const deliveredClients = clients.filter(c => c.currentStageId === '7');
  const avgDeliveryTime = deliveredClients.length > 0 
    ? Math.round(deliveredClients.reduce((acc, c) => acc + calculateDays(c.createdAt, c.stageHistory['7']), 0) / deliveredClients.length)
    : 0;

  const onTimeDeliveries = deliveredClients.filter(c => calculateDays(c.createdAt, c.stageHistory['7']) <= 120).length;
  const slaPercentage = deliveredClients.length > 0 ? Math.round((onTimeDeliveries / deliveredClients.length) * 100) : 100;

  // Cálculo de Indicações
  const referralStats = clients.reduce((acc, c) => {
    const saved = localStorage.getItem(`loop_referrals_${c.id}`);
    if (saved) {
      try {
        const refs = JSON.parse(saved);
        acc.total += refs.length;
        acc.converted += refs.filter((r: any) => r.status === 'converted').length;
      } catch (e) {}
    }
    return acc;
  }, { total: 0, converted: 0 });

  const referralConvRate = referralStats.total > 0
    ? Math.round((referralStats.converted / referralStats.total) * 100)
    : 0;

  const activeStatus = clients.filter(c => c.currentStageId !== '7').reduce((acc, c) => {
    const days = calculateDays(c.createdAt);
    if (days > 120) acc.urgente++;
    else if (days > 75) acc.atencao++;
    else acc.noprazo++;
    return acc;
  }, { noprazo: 0, atencao: 0, urgente: 0 });

  const calculateInternalScore = (client: Client) => {
    let score = 5;
    const isCompleted = client.currentStageId === '7';
    const elapsed = calculateDays(client.createdAt, isCompleted ? client.stageHistory['7'] : undefined);
    const stageEntryStr = (client.stageHistory[client.currentStageId] as any) || client.createdAt;
    const stageEntry = new Date(stageEntryStr);
    const daysInStage = Math.floor(Math.abs(new Date().getTime() - stageEntry.getTime()) / (1000 * 60 * 60 * 24));

    if (elapsed > 120) score -= 2;
    else if (elapsed > 90) score -= 1;
    
    if (!isCompleted) {
      if (daysInStage > 30) score -= 2;
      else if (daysInStage > 15) score -= 1;
    }
    return Math.max(1, score);
  };

  const avgScore = total > 0 
    ? (clients.reduce((acc, c) => acc + calculateInternalScore(c), 0) / total).toFixed(1)
    : "5.0";

  const stageDistribution = STAGES.map(s => ({
    title: s.title,
    count: clients.filter(c => c.currentStageId === s.id).length
  }));

  const maxStageCount = Math.max(...stageDistribution.map(s => s.count), 1);

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    setIsGenerating(true);
    const element = dashboardRef.current;
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const filename = `Relatorio_Loop_Energia_${dateStr}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#f9fafb' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scroll pr-2 space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
        <div className="bg-emerald-600 p-2 rounded-xl text-white"><CheckCircle size={18} /></div>
        <p className="text-xs font-bold text-emerald-900 leading-relaxed">
          EXPORTAÇÃO ATIVA: <span className="font-normal">Relatório pronto para download.</span>
        </p>
      </div>

      <div ref={dashboardRef} className="space-y-8 bg-gray-50/50 p-2 rounded-[2.5rem]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-3xl font-black text-brand-600 uppercase tracking-tighter flex items-center gap-3">
              <BarChart3 className="text-gold-500" size={32} /> Central Loop Energia
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Status de Gestão GEV</p>
          </div>
          
          <button onClick={handleDownloadPDF} disabled={isGenerating} data-html2canvas-ignore="true" 
            className={`px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center gap-2
              ${isGenerating ? 'bg-gray-400' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            Baixar PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Projetos" value={total} subtitle="Base Total" icon={<Users className="text-brand-500" />} />
          <KPICard title="Meta SLA" value={`${slaPercentage}%`} subtitle="Dentro de 120 dias" icon={<CheckCircle className="text-emerald-500" />} color="text-emerald-600" />
          <KPICard title="Prazo Médio" value={`${avgDeliveryTime} d`} subtitle="Média Entrega" icon={<Clock className="text-amber-500" />} />
          <KPICard title="Score Loop" value={avgScore} subtitle="Média Estrelas" icon={<Star className="text-gold-500" />} isScore />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <KPICard title="Total Indicações" value={referralStats.total} subtitle="Indicações Recebidas" icon={<UserPlus className="text-indigo-500" />} />
          <KPICard title="Conversão Indicações" value={`${referralConvRate}%`} subtitle="Taxa de Fechamento" icon={<Target className="text-rose-500" />} color="text-rose-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-full">
            <h3 className="text-sm font-black text-brand-900 uppercase tracking-widest mb-8 border-b border-gray-50 pb-4">Status da Carteira Ativa</h3>
            <div className="flex flex-1 items-center justify-around gap-8 flex-col sm:flex-row">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                  {active > 0 && (
                    <>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${(activeStatus.noprazo/active)*100}, 100`} />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray={`${(activeStatus.atencao/active)*100}, 100`} strokeDashoffset={`-${(activeStatus.noprazo/active)*100}`} />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray={`${(activeStatus.urgente/active)*100}, 100`} strokeDashoffset={`-${((activeStatus.noprazo+activeStatus.atencao)/active)*100}`} />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-brand-900">{active}</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Ativos</span>
                </div>
              </div>
              <div className="space-y-3 flex-1">
                <StatusLegend color="bg-emerald-500" label="No Prazo" count={activeStatus.noprazo} total={active} />
                <StatusLegend color="bg-amber-500" label="Atenção" count={activeStatus.atencao} total={active} />
                <StatusLegend color="bg-red-500" label="Urgente" count={activeStatus.urgente} total={active} />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-brand-900 uppercase tracking-widest mb-8 border-b border-gray-50 pb-4">Volume por Etapa</h3>
            <div className="space-y-3">
              {stageDistribution.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                    <span>{s.title}</span>
                    <span>{s.count}</span>
                  </div>
                  <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-1000" style={{ width: `${(s.count / maxStageCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm col-span-full">
            <h3 className="text-sm font-black text-brand-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Detalhamento Geral</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <th className="p-4 border-b">Cliente</th>
                    <th className="p-4 border-b">Iniciado</th>
                    <th className="p-4 border-b">Prazo Loop (120d)</th>
                    <th className="p-4 border-b text-center">Dias</th>
                    <th className="p-4 border-b text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clients.slice(0, 15).map(c => {
                    const days = calculateDays(c.createdAt);
                    const score = calculateInternalScore(c);
                    const st = new Date(c.createdAt);
                    const dl = new Date(st);
                    dl.setDate(dl.getDate() + 120);
                    return (
                      <tr key={c.id} className="text-xs hover:bg-gray-50/50 transition">
                        <td className="p-4 font-bold text-brand-900">{c.name}</td>
                        <td className="p-4 text-gray-500 font-medium">{st.toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-brand-600 font-black flex items-center gap-2"><Flag size={12}/> {dl.toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-center font-black">
                           <span className={days > 120 ? 'text-red-600' : days > 75 ? 'text-amber-600' : 'text-emerald-600'}>
                             {days}d
                           </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= score ? "#dbb832" : "transparent"} className={s <= score ? "text-gold-400" : "text-gray-100"} />)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon, color = "text-brand-900", isScore = false }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-50 rounded-full -mr-10 -mt-10 transition-all group-hover:scale-110"></div>
    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 w-fit relative z-10">{icon}</div>
    <div className="relative z-10">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
        <h4 className={`text-3xl font-black ${color} tracking-tighter`}>{value}</h4>
        {isScore && <Star size={18} fill="#dbb832" className="text-gold-400" />}
      </div>
      <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tight">{subtitle}</p>
    </div>
  </div>
);

const StatusLegend = ({ color, label, count, total }: any) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-50">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
        <span className="text-[9px] font-black uppercase text-gray-600">{label}</span>
      </div>
      <div className="flex gap-3">
        <span className="text-[10px] font-black text-brand-900">{count}</span>
        <span className="text-[9px] font-bold text-gray-300">{percentage}%</span>
      </div>
    </div>
  );
};
