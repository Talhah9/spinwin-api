export function ensureCors(res: Response) {
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Credentials', 'true');
  if (origins.length) headers.set('Access-Control-Allow-Origin', origins[0] || '*');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return new Response(res.body, { status: res.status, headers });
}

export function preflight() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Origin', (process.env.ALLOWED_ORIGINS || '*').split(',')[0] || '*');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return new Response(null, { status: 204, headers });
}
