export interface VisitorEnv {
  DB: D1Database;
  SITE_ORIGIN: string;
  STOREFRONT_ORIGIN?: string;
}

function allowedOrigin(request: Request, env: VisitorEnv) {
  const origin = request.headers.get('origin');
  return !!origin && (origin === env.SITE_ORIGIN || origin === env.STOREFRONT_ORIGIN);
}

export async function handleVisitor(request: Request, env: VisitorEnv): Promise<Response> {
  if (!allowedOrigin(request, env))
    return Response.json({ error: 'Permintaan tidak dibenarkan.' }, { status: 403 });
  if (request.method !== 'POST' && request.method !== 'OPTIONS')
    return new Response(null, { status: 405 });

  let response: Response;
  if (request.method === 'OPTIONS') {
    response = new Response(null, { status: 204 });
  } else if (!env.DB) {
    response = Response.json({ error: 'Kiraan pelawat tidak tersedia.' }, { status: 503 });
  } else {
    try {
      if (!request.headers.get('content-type')?.startsWith('application/json'))
        return visitorResponse(Response.json({ error: 'Format tidak sah.' }, { status: 415 }), request);
      if (Number(request.headers.get('content-length')) > 128)
        return visitorResponse(Response.json({ error: 'Maklumat terlalu panjang.' }, { status: 413 }), request);
      const reader = request.body?.getReader();
      if (!reader)
        return visitorResponse(Response.json({ error: 'Maklumat tidak sah.' }, { status: 400 }), request);
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 128) {
          await reader.cancel();
          return visitorResponse(Response.json({ error: 'Maklumat terlalu panjang.' }, { status: 413 }), request);
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const body = new TextDecoder().decode(bytes);
      if (body.length > 128)
        return visitorResponse(Response.json({ error: 'Maklumat terlalu panjang.' }, { status: 413 }), request);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        return visitorResponse(Response.json({ error: 'Maklumat tidak sah.' }, { status: 400 }), request);
      }
      const id = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'visitorId' in parsed
        ? parsed.visitorId
        : null;
      if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
        return visitorResponse(Response.json({ error: 'ID pelawat tidak sah.' }, { status: 400 }), request);
      await env.DB.prepare('INSERT OR IGNORE INTO visitors (id, first_seen_at) VALUES (?, ?)')
        .bind(id, Date.now()).run();
      const result = await env.DB.prepare('SELECT COUNT(*) AS total FROM visitors').first<{ total: number }>();
      response = Response.json({ total: result?.total ?? 0 });
    } catch {
      response = Response.json({ error: 'Kiraan pelawat tidak tersedia.' }, { status: 503 });
    }
  }
  return visitorResponse(response, request);
}

function visitorResponse(response: Response, request: Request) {
  response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin')!);
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Vary', 'Origin');
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
