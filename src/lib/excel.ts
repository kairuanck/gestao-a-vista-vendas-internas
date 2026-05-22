import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// ─── URL normalisation ────────────────────────────────────────────────────────

export function extractExcelUrl(url: string): string | null {
  try {
    if (url.includes('docs.google.com/spreadsheets')) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    if (url.includes('onedrive.live.com/embed')) {
      return url.replace('embed', 'download');
    }

    if (
      url.includes('sharepoint.com') ||
      url.includes('1drv.ms') ||
      url.includes('onedrive.live.com')
    ) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('download', '1');
      return urlObj.toString();
    }

    return url;
  } catch {
    return url;
  }
}

// ─── Proxy próprio (Vercel Serverless Function) ───────────────────────────────

async function fetchViaProxy(url: string): Promise<ArrayBuffer> {
  const apiUrl = `/api/fetch-sheet?url=${encodeURIComponent(url)}`;
  const resp = await fetch(apiUrl);

  if (!resp.ok) {
    let errorMsg = `Erro HTTP ${resp.status}`;
    try {
      const data = await resp.json();
      errorMsg = data.error || errorMsg;
    } catch { /* ignora */ }
    throw new Error(errorMsg);
  }

  return resp.arrayBuffer();
}

// ─── Leitura principal ────────────────────────────────────────────────────────

export async function fetchExcelData(url: string): Promise<Record<string, any[][]>> {
  const result: Record<string, any[][]> = {};
  const isCsv = url.includes('format=csv') || url.endsWith('.csv');

  const buffer = await fetchViaProxy(url);

  if (isCsv) {
    const text = new TextDecoder('utf-8').decode(buffer);
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
    result['Metricas'] = parsed.data;

    // Tenta buscar aba "Clientes" (segunda aba, gid=1)
    const clientsUrl = url.includes('&gid=') ? url : url + '&gid=1';
    try {
      const clientsBuf = await fetchViaProxy(clientsUrl);
      const clientsText = new TextDecoder('utf-8').decode(clientsBuf);
      const clientsParsed = Papa.parse<string[]>(clientsText, { skipEmptyLines: true });
      if (
        clientsParsed.data.length > 1 &&
        clientsParsed.data[0][0] !== (parsed.data[0]?.[0] ?? '')
      ) {
        result['Clientes'] = clientsParsed.data;
      }
    } catch {
      // Aba Clientes é opcional
    }
  } else {
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (workbook.SheetNames.length > 0) {
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      result['Metricas'] = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
    }

    if (workbook.SheetNames.includes('Clientes')) {
      const ws = workbook.Sheets['Clientes'];
      result['Clientes'] = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
    }
  }

  if (Object.keys(result).length === 0) {
    throw new Error('Nenhum dado encontrado na planilha. Verifique a estrutura do arquivo.');
  }

  return result;
}
