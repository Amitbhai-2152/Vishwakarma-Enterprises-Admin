export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  try {
    const url = new URL(request.url);
    let text = url.searchParams.get('text') || '';
    let source = url.searchParams.get('source') || 'en';
    let target = url.searchParams.get('target') || 'hi';

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      text = body.text || text;
      source = body.source || source;
      target = body.target || target;
    }

    text = String(text).trim();
    source = String(source).trim().toLowerCase();
    target = String(target).trim().toLowerCase();

    if (!text) {
      return new Response(JSON.stringify({ success: false, error: 'Text is required.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const mm = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source + '|' + target)}`;
    const r = await fetch(mm, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`Translation service returned ${r.status}.`);

    const data = await r.json();
    const translated = String(data?.responseData?.translatedText || '').trim();
    if (!translated) throw new Error('Translation service returned no translation.');

    return new Response(JSON.stringify({ success: true, translated }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Translation failed.' }), {
      status: 502,
      headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }
}
