// lib/cors.ts
const ALLOW = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

function matchOrigin(input: string | null) {
  if (!input) return null;
  const origin = input.replace(/\/$/, '');
  return ALLOW.includes(origin) ? origin : null;
}

export function withCors(req: Request, res: Response) {
  const origin = matchOrigin(req.headers.get('origin'));
  const headers = new Headers(res.headers);
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return new Response(res.body, { status: res.status, headers });
}

export function preflight(req: Request) {
  const origin = matchOrigin(req.headers.get('origin'));
  const headers = new Headers();
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  return new Response(null, { status: 204, headers });
}
