import React, { useState } from 'react';
import { extractExcelUrl } from '../lib/excel';
import { Link2, Info } from 'lucide-react';

interface SetupProps {
  onSaveUrl: (url: string) => void;
}

export function Setup({ onSaveUrl }: SetupProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!url.trim()) {
      setError('Por favor, insira o link da planilha Excel.');
      return;
    }

    // Pass whatever link we get, backend logic will attempt to fetch via CORS proxy.
    onSaveUrl(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-xs uppercase tracking-widest text-slate-400">Configuração do Dashboard Excel</span>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 shadow-2xl">
          <h2 className="text-2xl font-black tracking-tight text-white mb-2 uppercase">Conecte seu Excel no OneDrive</h2>
          <p className="text-slate-400 mb-8 text-sm">
            Para exibir o Gestão à Vista, você precisa informar a URL de compartilhamento da planilha Excel no OneDrive.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                URL de Download / Incorporação
              </label>
              <input
                id="url"
                type="text"
                placeholder="Exemplo: https://1drv.ms/x/s!..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-white placeholder-slate-600 font-mono text-sm"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {error && <p className="text-xs font-bold uppercase tracking-widest text-rose-500 mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              Conectar e Visualizar Dashboard
            </button>
          </form>

          <div className="mt-8 bg-blue-950/40 rounded-2xl p-6 border border-blue-900/50">
            <div className="flex items-start gap-4">
              <div className="bg-blue-900/50 p-2 rounded-lg shrink-0">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-sm text-slate-400 space-y-3">
                <p className="font-bold text-white uppercase tracking-wider text-xs">Como estruturar sua planilha .XLSX:</p>
                
                <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-xl text-emerald-300 mt-2">
                  <p className="font-bold text-white uppercase tracking-wider text-[10px] mb-1">Dica de Compartilhamento</p>
                  <p className="text-xs">No uso do OneDrive, sugerimos criar um <strong>Link de Incorporação (Embed)</strong> ou garantir que o link de compartilhamento não exija login, para que possamos tentar baixar o arquivo e ler os dados.</p>
                </div>

                <p className="mt-4">O sistema buscará as informações de KPI na <strong className="text-blue-300">primeira aba (planilha)</strong> do arquivo:</p>
                <ul className="space-y-2 text-slate-300 mt-2 rounded-xl bg-slate-900/50 p-4 border border-slate-800">
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-mono text-xs font-bold">Col A</span> <span className="text-xs">Nome da Métrica (ex: "Meta da Carteira", "NPS")</span></li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-mono text-xs font-bold">Col B</span> <span className="text-xs">Valor do Dia</span></li>
                  <li className="flex items-center gap-2"><span className="text-emerald-500 font-mono text-xs font-bold">Col C</span> <span className="text-xs">Valor do Mês</span></li>
                </ul>
                <p className="pt-2 text-xs">Para exibir os clientes ativos, crie uma aba chamada <strong>exatamente</strong> <strong className="text-blue-300">Clientes</strong>, e liste os nomes na Coluna A.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
