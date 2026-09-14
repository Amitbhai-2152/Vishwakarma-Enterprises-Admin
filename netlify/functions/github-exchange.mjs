export default async (request) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'GitHub authentication is not configured on the server.' }), { status: 500, headers });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), { status: 400, headers });
  }

  const { code, code_verifier, redirect_uri } = body || {};
  if (!code || !code_verifier || !redirect_uri) {
    return new Response(JSON.stringify({ error: 'Missing authorization parameters.' }), { status: 400, headers });
  }

  const exchange = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri,
      code_verifier
    })
  });

  const data = await exchange.json().catch(() => ({}));
  if (!exchange.ok || !data.access_token) {
    return new Response(JSON.stringify({ error: data.error_description || data.error || 'GitHub authorization failed.' }), { status: 401, headers });
  }

  return new Response(JSON.stringify({
    access_token: data.access_token,
    token_type: data.token_type,
    scope: data.scope,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    refresh_token_expires_in: data.refresh_token_expires_in
  }), { status: 200, headers });
};
