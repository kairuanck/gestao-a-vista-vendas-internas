import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// ─── URL normalisation ────────────────────────────────────────────────────────

export function extractExcelUrl(url: string): string | null {
  try {
    // Google Sheets → CSV export (mais confiável via proxy do que XLSX)
    if (url.includes('docs.google.com/spreadsheets')) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
      }
    }

    // OneDrive embed → download direto
    if (url.includes('onedrive.live.com/embed')) {
      return url.replace('embed', 'download');
    }

    // SharePoint / 1drv.ms / OneDrive — tenta forçar download
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

// ─── CORS proxy com fallback ──────────────────────────────────────────────────

const PROXY_FNS: ((u: string) => string)[] = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

async function fetchViaProxy(url: string): Promise<ArrayBuffer> {
  let lastErr: Error = new Error('Todos os proxies falharam.');

  for (const proxyFn of PROXY_FNS) {
    try {
      const resp = await fetch(proxyFn(url), {
        signal: AbortSignal.timeout(12_000),
      });

      if (!resp.ok) {
        lastErr = new Error(`HTTP ${resp.status}`);
        continue;
      }

      const buffer = await resp.arrayBuffer();

      // Detecta se voltou HTML (página de login ou erro)
      const preview = new TextDecoder().decode(buffer.slice(0, 200)).toLowerCase().trimStart();
      if (preview.startsWith('<!doctype') || preview.startsWith('<html')) {
        lastErr = new Error(
          'O link retornou uma página da web em vez do arquivo.\n\n' +
          '• Google Sheets: vá em Arquivo → Compartilhar → Publicar na web e use o link CSV gerado.\n' +
          '• SharePoint corporativo: gere um link "Qualquer pessoa com o link pode visualizar" e tente novamente. ' +
          'Links que exigem login não funcionam em aplicações front-end sem um servidor próprio.'
        );
        continue;
      }

      return buffer;
    } catch (e: any) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastErr;
}

// ─── Leitura principal ────────────────────────────────────────────────────────

export async function fetchExcelData(url: string): Promise<Record<string, any[][]>> {
  const result: Record<string, any[][]> = {};
  const isCsv = url.includes('format=csv') || url.endsWith('.csv');

  const buffer = await fetchViaProxy(url);

  if (isCsv) {
    // ── Google Sheets CSV ──
    const text = new TextDecoder('utf-8').decode(buffer);
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
    result['Metricas'] = parsed.data;

    // Tenta buscar aba "Clientes" (gid=1 por convenção — ajuste se necessário)
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
      // Aba Clientes é opcional — ignora erro silenciosamente
    }
  } else {
    // ── Excel XLSX (OneDrive / SharePoint / arquivo direto) ──
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
