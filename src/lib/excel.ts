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

// ─── Busca aba Clientes testando gids automaticamente ────────────────────────

async function fetchClientsSheet(baseUrl: string): Promise<any[][] | null> {
  // Extrai o ID da planilha
  const match = baseUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;

  const sheetId = match[1];

  // Tenta gids comuns: 0 é a primeira aba, mas Clientes pode ser qualquer número.
  // O Google Sheets costuma usar números sequenciais ou timestamps.
  // Vamos tentar gid=0 até gid=5 primeiro, depois alguns valores comuns.
  const candidateGids = [1747928551, 1, 2, 3, 4, 5, 0];

  for (const gid of candidateGids) {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      const buffer = await fetchViaProxy(csvUrl);
      const text = new TextDecoder('utf-8').decode(buffer);

      // Verifica se é HTML (aba não existe ou sem permissão)
      const preview = text.slice(0, 100).toLowerCase().trimStart();
      if (preview.startsWith('<!doctype') || preview.startsWith('<html')) continue;

      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
      if (parsed.data.length < 2) continue;

      const firstCell = (parsed.data[0]?.[0] ?? '').toLowerCase();
      const secondRow = (parsed.data[1]?.[0] ?? '').toLowerCase();

      // Confirma que é a aba Clientes: cabeçalho "clientes" ou
      // primeira célula parece nome (sem "r$", sem números sozinhos)
      const looksLikeClients =
        firstCell.includes('cliente') ||
        (!firstCell.includes('r$') &&
          !firstCell.match(/^\d+([.,]\d+)?$/) &&
          secondRow.length > 3);

      if (looksLikeClients) {
        return parsed.data;
      }
    } catch {
      continue;
    }
  }

  return null;
}

// ─── Leitura principal ────────────────────────────────────────────────────────

export async function fetchExcelData(url: string): Promise<Record<string, any[][]>> {
  const result: Record<string, any[][]> = {};
  const isGoogleSheets = url.includes('docs.google.com/spreadsheets');
  const isCsv = url.includes('format=csv') || url.endsWith('.csv');

  const buffer = await fetchViaProxy(url);

  if (isCsv || isGoogleSheets) {
    const text = new TextDecoder('utf-8').decode(buffer);
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
    result['Metricas'] = parsed.data;

    // Busca aba Clientes automaticamente
    const clientsData = await fetchClientsSheet(url);
    if (clientsData) {
      result['Clientes'] = clientsData;
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
