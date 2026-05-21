import React, { useState, useEffect } from 'react';
import { fetchExcelData, extractExcelUrl } from './lib/excel';
import { Dashboard } from './components/Dashboard';
import { Setup } from './components/Setup';
import { Loader2 } from 'lucide-react';

const MOCK_DATA = {
  Metricas: [
    ['Métrica', 'Dia', 'Mês'],
    ['Meta da Carteira', 'R$ 115.000', 'R$ 2.450.000'],
    ['Realizado (R$ e %)', '82.400 (71%)', '1.813.000 (74%)'],
    ['Positivação', '12,1%', '68,4%'],
    ['NPS', '94', '82'],
    ['Número de Regiões', '2', '14'],
    ['Vendas nas regiões', 'R$ 14.8k', 'R$ 142k'],
    ['clientes + 120 dias', 'R$ 4.2k', 'R$ 89k'],
    ['Número de atendimentos', '186', '4.215'],
  ],
  Clientes: [
    ['Cliente'],
    ['Supermercado Alvorada'],
    ['Distribuidora Central'],
    ['FarmaTech LTDA'],
    ['Rede Mix Norte'],
  ]
};

export default function App() {
  const [excelUrl, setExcelUrl] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<Record<string, any[][]> | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Check localStorage for a previously saved URL
    const savedUrl = localStorage.getItem('gestao-vista-excel-url');
    if (savedUrl) {
      setExcelUrl(savedUrl);
      loadData(savedUrl);
    } else {
      setDashboardData(MOCK_DATA);
    }
  }, []);

  const loadData = async (url: string) => {
    setIsFetchingData(true);
    setFetchError(null);
    try {
      const properUrl = extractExcelUrl(url) || url;
      const data = await fetchExcelData(properUrl);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to fetch Excel data:', err);
      setFetchError(err.message || 'Falha ao buscar dados. Verifique o link fornecido e o formato do arquivo.');
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleSaveUrl = (url: string) => {
    localStorage.setItem('gestao-vista-excel-url', url);
    setExcelUrl(url);
    setShowSetup(false);
    loadData(url);
  };

  const handleClearUrl = () => {
    setShowSetup(true);
  };

  const handleRefresh = () => {
    if (excelUrl) {
      loadData(excelUrl);
    }
  };

  if (showSetup) {
    return <Setup onSaveUrl={handleSaveUrl} />;
  }

  if (isFetchingData && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col gap-4 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium">Baixando e processando planilha...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/50 p-6 rounded-2xl shadow-xl border border-red-900/30 text-center space-y-4">
          <div className="w-12 h-12 bg-red-900/40 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-800">
            <Loader2 className="w-6 h-6 animate-pulse" /> {/* Warning layout placeholder */}
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Erro na leitura</h2>
          <p className="text-sm text-slate-400">{fetchError}</p>
          <div className="pt-4 flex gap-3 justify-center">
            <button 
              onClick={handleClearUrl}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors border border-slate-700"
            >
              Trocar Planilha
            </button>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold uppercase tracking-widest transition-colors shadow-lg"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dashboard 
      data={dashboardData || MOCK_DATA} 
      onRefresh={handleRefresh}
      onClearUrl={handleClearUrl}
      isMock={!excelUrl}
    />
  );
}
