import * as XLSX from 'xlsx';

export function extractExcelUrl(url: string): string | null {
  // Try to use the original url. We might need to transform a onedrive link or just use it raw.
  // For OneDrive, a share link like https://1drv.ms/... can be tricky.
  // Usually, users need to generate a direct download link or embed link.
  // E.g., replace 'embed' with 'download'
  let finalUrl = url;
  if (url.includes('onedrive.live.com/embed')) {
    finalUrl = url.replace('embed', 'download');
  }
  return finalUrl;
}

export async function fetchExcelData(url: string) {
  const result: Record<string, any[][]> = {};

  try {
    // Para funcionar em domínios frontend puros, usamos um CORS proxy público para a POC.
    // Assim o painel pode acessar um link do OneDrive ou qualquer outro gerador de direct download.
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Não foi possível ler o arquivo Excel.`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Busca a primeira aba (Métricas principais)
    if (workbook.SheetNames.length > 0) {
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' }); // array of arrays
      result['Metricas'] = data;
    }

    // Busca a aba secundária "Clientes"
    if (workbook.SheetNames.includes('Clientes')) {
      const clientsSheet = workbook.Sheets['Clientes'];
      const data = XLSX.utils.sheet_to_json<any[]>(clientsSheet, { header: 1, defval: '' });
      result['Clientes'] = data;
    }

    return result;

  } catch (error: any) {
    console.error("Erro no fetchExcelData:", error);
    throw new Error(error.message || 'Falha ao baixar/processar a planilha.');
  }
}
