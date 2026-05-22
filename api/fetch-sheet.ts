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

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; dashboard/1.0)',
        'Accept': 'text/csv,application/octet-stream,*/*',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Erro HTTP ${response.status} ao buscar a planilha.` });
    }

    const buffer = await response.arrayBuffer();
    const preview = Buffer.from(buffer).slice(0, 300).toString('utf-8').toLowerCase().trimStart();

    if (preview.startsWith('<!doctype') || preview.startsWith('<html')) {
      return res.status(403).json({
        error:
          'O link exige login e retornou uma página da web.\n\n' +
          '• Google Sheets: Arquivo → Compartilhar → "Qualquer pessoa com o link pode ver".\n' +
          '• SharePoint: gere um link público sem exigir login corporativo.',
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[fetch-sheet] erro:', err);
    res.status(500).json({ error: err.message || 'Erro interno no servidor.' });
  }
}
