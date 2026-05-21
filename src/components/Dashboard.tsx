import React from 'react';
import { Metric, DashboardData } from '../types';
import { RefreshCcw, Settings } from 'lucide-react';

interface DashboardProps {
  data: Record<string, string[][]>;
  onRefresh: () => void;
  onClearUrl: () => void;
  isMock?: boolean;
}

export function Dashboard({ data, onRefresh, onClearUrl, isMock = false }: DashboardProps) {
  // Parse data
  const mainSheet = data['Metricas'] || (Object.keys(data).length > 0 ? data[Object.keys(data)[0]] : null);
  const clientsSheet = data['Clientes'] || null;

  let parsedMetrics: Metric[] = [];
  let currentClients: string[] = [];

  if (mainSheet) {
    let startIndex = 0;
    if (mainSheet[0] && (mainSheet[0][0]?.toLowerCase().includes('métrica') || mainSheet[0][0]?.toLowerCase().includes('metric') || mainSheet[0][0]?.toLowerCase().includes('nome'))) {
      startIndex = 1;
    }

    for (let i = startIndex; i < mainSheet.length; i++) {
      const row = mainSheet[i];
      if (row.length > 0 && row[0]) {
        parsedMetrics.push({
          name: row[0],
          dayValue: row[1] || '-',
          monthValue: row[2] || '-',
        });
      }
    }
  }

  if (clientsSheet) {
    let startIndex = 0;
    if (clientsSheet[0] && clientsSheet[0][0]?.toLowerCase().includes('cliente')) {
      startIndex = 1;
    }
    for (let i = startIndex; i < clientsSheet.length; i++) {
      if (clientsSheet[i] && clientsSheet[i][0]) {
        currentClients.push(clientsSheet[i][0]);
      }
    }
  }

  const getMetric = (keywords: string[]) => {
    return parsedMetrics.find(m => keywords.some(k => m.name.toLowerCase().includes(k.toLowerCase()))) || { name: keywords[0], dayValue: '-', monthValue: '-' };
  };

  const metaCarteira = getMetric(['Meta da Carteira']);
  const realizado = getMetric(['Realizado', '%']);
  const positivacao = getMetric(['Positivação']);
  const regioesDesassistidasNum = getMetric(['Número de Regiões', 'Regiões desassistidas']);
  const regioesDesassistidasVendas = getMetric(['Vendas nas regiões']);
  const clientes120 = getMetric(['clientes + 120 dias', '+ 120']);
  const atendimentos = getMetric(['Número de atendimentos', 'atendimentos']);
  const nps = getMetric(['NPS']);

  // Helper to parse percentage if embedded in the string for progress bars
  const parsePercent = (val: string) => {
    const match = val.match(/(\d+(?:\.\d+)?)/);
    if (match) return Math.min(100, parseFloat(match[1]));
    return 0;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white font-sans p-4 md:p-6 overflow-x-hidden">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 uppercase">
            Gestão à Vista | Vendas Internas
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">POC Automação Cloud Sync</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="bg-indigo-900/40 px-4 py-2 rounded-xl border border-indigo-500/30 text-right shrink-0">
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Fonte de Dados</p>
            <p className="text-xs text-white font-mono uppercase truncate max-w-[150px]">
              {isMock ? 'Exemplo (Padrão)' : 'Excel na Nuvem'}
            </p>
          </div>
          <div className="text-right bg-slate-800 px-4 py-2 rounded-xl shrink-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Última Atualização</p>
            <p className="text-sm font-mono text-emerald-400">AGORA</p>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
             <button 
                onClick={onRefresh}
                className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
                title="Atualizar Dados"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={onClearUrl}
                className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-700"
                title="Configurações (Planilha)"
              >
                <Settings className="w-4 h-4" />
              </button>
          </div>
        </div>
      </header>

      {/* Main Metrics Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow">
        
        {/* MONTH SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="h-6 w-1.5 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-bold uppercase tracking-tight">
              Performance do Mês
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Primary Month Metrics */}
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-4 rounded-2xl border-b-4 border-blue-500 shadow-xl">
                <p className="text-[10px] text-blue-300 font-bold uppercase truncate">{metaCarteira.name}</p>
                <p className="text-2xl font-black truncate">{metaCarteira.monthValue}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border-b-4 border-emerald-500 shadow-xl relative overflow-hidden">
                 <p className="text-[10px] text-emerald-300 font-bold uppercase truncate">{realizado.name}</p>
                 <p className="text-2xl font-black truncate">{realizado.monthValue}</p>
                 <div className="flex items-center gap-2 mt-1 w-full">
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${parsePercent(realizado.monthValue)}%` }}></div>
                    </div>
                </div>
              </div>
            </div>
            
            {/* Secondary Month Metrics */}
            <MetricBox title={positivacao.name} value={positivacao.monthValue} colorClass="text-indigo-400" />
            <MetricBox title={nps.name} value={nps.monthValue} colorClass="text-fuchsia-400" />
            <MetricBox title={regioesDesassistidasNum.name} value={regioesDesassistidasNum.monthValue} colorClass="text-amber-500" />
            <MetricBox title={regioesDesassistidasVendas.name} value={regioesDesassistidasVendas.monthValue} colorClass="text-teal-400" />
            <MetricBox title={clientes120.name} value={clientes120.monthValue} colorClass="text-rose-400" />
            <MetricBox title={atendimentos.name} value={atendimentos.monthValue} colorClass="text-blue-400" />
          </div>
        </section>

        {/* DAY SECTION */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-2 px-2">
             <div className="h-6 w-1.5 bg-pink-500 rounded-full"></div>
             <h2 className="text-xl font-bold uppercase tracking-tight">
               Status do Dia <span className="text-slate-500 font-light text-sm ml-2 italic underline underline-offset-4 decoration-pink-500 hidden sm:inline">Hoje</span>
             </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
             {/* Primary Day Metrics */}
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-4 rounded-2xl border-b-4 border-pink-500 shadow-xl">
                <p className="text-[10px] text-pink-300 font-bold uppercase truncate">Meta do Dia ({metaCarteira.name})</p>
                <p className="text-2xl font-black truncate">{metaCarteira.dayValue}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border-b-4 border-amber-500 shadow-xl relative overflow-hidden">
                 <p className="text-[10px] text-amber-300 font-bold uppercase truncate">Realizado do Dia</p>
                 <p className="text-2xl font-black truncate">{realizado.dayValue}</p>
                 <div className="flex items-center gap-2 mt-1 w-full">
                    <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${parsePercent(realizado.dayValue)}%` }}></div>
                    </div>
                </div>
              </div>
            </div>

            {/* Secondary Day Metrics */}
            <MetricBox title={positivacao.name} value={positivacao.dayValue} colorClass="text-indigo-400" />
            <MetricBox title={nps.name} value={nps.dayValue} colorClass="text-fuchsia-400" />
            <MetricBox title={regioesDesassistidasNum.name} value={regioesDesassistidasNum.dayValue} colorClass="text-amber-500" />
            <MetricBox title={regioesDesassistidasVendas.name} value={regioesDesassistidasVendas.dayValue} colorClass="text-teal-400" />
            <MetricBox title={clientes120.name} value={clientes120.dayValue} colorClass="text-rose-400" />
            <MetricBox title={atendimentos.name} value={atendimentos.dayValue} colorClass="text-blue-400" />
          </div>
        </section>
      </main>

      {/* Bottom Real-Time Section */}
      <footer className="mt-6 md:mt-8 pt-6 border-t border-slate-800/50">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Clientes em atendimento agora</h3>
          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-bold ml-2 shrink-0">
            {currentClients.length} SESSÕES ATIVAS
          </span>
        </div>
        
        {currentClients.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             {currentClients.map((client, idx) => (
               <div key={idx} className="bg-gradient-to-br from-slate-900 to-slate-800 p-3 rounded-xl border-l-4 border-indigo-500 hover:border-indigo-400 transition-colors">
                  <p className="text-xs font-bold truncate" title={client}>{client}</p>
                  <div className="flex justify-between items-end mt-3">
                     <span className="text-[10px] font-mono text-indigo-400">LIVE</span>
                     <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="w-full bg-slate-900/30 border border-slate-800 border-dashed rounded-xl p-6 text-center">
             <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Nenhum cliente em atendimento</p>
          </div>
        )}
      </footer>
    </div>
  );
}

function MetricBox({ title, value, colorClass }: { title: string, value: string, colorClass: string }) {
  return (
    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
      <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title={title}>{title}</p>
      <p className={`text-xl font-bold truncate ${colorClass}`} title={value}>{value}</p>
    </div>
  );
}
