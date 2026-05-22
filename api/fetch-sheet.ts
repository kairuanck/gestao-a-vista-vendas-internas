import https from 'https';
import http from 'http';
import { URL } from 'url';

function httpGet(urlStr: string, redirectCount = 0): Promise<{ status: number; headers: Record<string, string>; body: Buffer }> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Muitos redirecionamentos.'));

    const parsed = new URL(urlStr);
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; dashboard/1.0)',
        'Accept': 'text/csv,application/octet-stream,*/*',
      },
    }, (res) => {
      // Segue redirecionamentos
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.origin}${res.headers.location}`;
        return resolve(httpGet(next, redirectCount + 1));
      }

      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode || 200,
        headers: res.headers as Record<string, string>,
        body: Buffer.concat(chunks),
      }));
      res.on('error', reject);
    });

    req.setTimeout(15_000, () => { req.destroy(); reject(new Error('Timeout ao buscar a planilha.')); });
    req.on('error', reject);
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawUrl = req.query?.url;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "url" obrigatório.' });
  }

  try {
    const url = decodeURIComponent(rawUrl);
    const { status, body, headers } = await httpGet(url);

    if (status >= 400) {
      return res.status(status).json({ error: `Erro HTTP ${status} ao buscar a planilha.` });
    }

    const preview = body.slice(0, 300).toString('utf-8').toLowerCase().trimStart();
    if (preview.startsWith('<!doctype') || preview.startsWith('<html')) {
      return res.status(403).json({
        error:
          'O link exige login e retornou uma página da web.\n\n' +
          '• Google Sheets: Arquivo → Compartilhar → "Qualquer pessoa com o link pode ver".\n' +
          '• SharePoint: gere um link público sem exigir login corporativo.',
      });
    }

    const contentType = headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.send(body);
  } catch (err: any) {
    console.error('[fetch-sheet] erro:', err);
    res.status(500).json({ error: err.message || 'Erro interno no servidor.' });
  }
}
