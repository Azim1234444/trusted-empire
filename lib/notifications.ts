export interface NotificationEnv {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_ADMIN_CHAT_ID: string;
  SITE_ORIGIN: string;
}
const catalog: Record<string, { name: string; price: number }> = {
  netflix: { name: 'Netflix Premium UHD', price: 1700 },
  hbo: { name: 'HBO Max', price: 1500 },
  prime: { name: 'Amazon Prime', price: 1000 },
  viu: { name: 'VIU', price: 1000 },
  iqiyi: { name: 'iQIYI', price: 1000 },
};
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const hash = async (value: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    ),
  )
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
export async function notifyOrder(
  request: Request,
  env: NotificationEnv,
  transport: typeof fetch = fetch,
): Promise<Response> {
  if (request.headers.get('origin') !== env.SITE_ORIGIN)
    return json({ error: 'Permintaan tidak dibenarkan.' }, 403);
  if (
    !env.TELEGRAM_BOT_TOKEN ||
    !/^\d+$/.test(env.TELEGRAM_ADMIN_CHAT_ID ?? '') ||
    !env.DB
  )
    return json(
      {
        error:
          'Notifikasi belum tersedia. Sila hubungi admin melalui WhatsApp.',
      },
      503,
    );
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return json({ error: 'Format tidak sah.' }, 415);
  if (Number(request.headers.get('content-length')) > 2048)
    return json({ error: 'Maklumat terlalu panjang.' }, 413);
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 2048)
      return json({ error: 'Maklumat terlalu panjang.' }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Maklumat tidak sah.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return json({ error: 'Maklumat tidak sah.' }, 400);
  const { requestId, planId, months, name, contact } = body;
  if (
    typeof requestId !== 'string' ||
    !/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/i.test(requestId) ||
    typeof planId !== 'string' ||
    !Object.hasOwn(catalog, planId) ||
    ![1, 2].includes(months) ||
    (months === 2 && planId !== 'netflix') ||
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 40 ||
    /[\r\n\x00-\x1f]/.test(name) ||
    typeof contact !== 'string' ||
    !/^(?:@[a-zA-Z][a-zA-Z0-9_]{4,31}|\+?[0-9][0-9 ()-]{7,19})$/.test(
      contact.trim(),
    ) ||
    body.paymentClaimed !== true
  )
    return json(
      {
        error:
          'Semak nama, nombor WhatsApp atau @username Telegram, dan pelan anda.',
      },
      400,
    );
  const amountSen = months === 2 ? 3300 : catalog[planId].price;
  const payloadHash = await hash(
    JSON.stringify([planId, months, name.trim(), contact.trim()]),
  );
  const id = requestId;
  const existingResponse = (row: { payload_hash: string; state: string }) =>
    row.payload_hash !== payloadHash
      ? json({ error: 'Pesanan ini telah berubah. Buka pelan semula.' }, 409)
      : row.state === 'sent'
        ? json({
            orderId: id,
            status: 'notified',
            paymentStatus: 'pending_review',
          })
        : json(
            {
              orderId: id,
              error:
                'Pesanan telah direkodkan tetapi penghantaran belum dapat dipastikan. Hubungi admin dengan nombor pesanan ini.',
            },
            409,
          );
  try {
    const old = await env.DB.prepare(
      'SELECT payload_hash,state FROM order_notifications WHERE id=?',
    )
      .bind(id)
      .first<{ payload_hash: string; state: string }>();
    if (old) return existingResponse(old);
    const now = Date.now();
    const ipHash = await hash(
      `${env.TELEGRAM_BOT_TOKEN}:${request.headers.get('cf-connecting-ip') ?? 'unknown'}:${Math.floor(now / 86400000)}`,
    );
    const inserted = await env.DB.prepare(
      "INSERT OR IGNORE INTO order_notifications (id,payload_hash,customer_name,contact,plan,months,amount_sen,ip_hash,created_at,state) SELECT ?,?,?,?,?,?,?,?,?, 'sending' WHERE (SELECT COUNT(*) FROM order_notifications WHERE ip_hash=? AND created_at>?)<5",
    )
      .bind(
        id,
        payloadHash,
        name.trim(),
        contact.trim(),
        planId,
        months,
        amountSen,
        ipHash,
        now,
        ipHash,
        now - 600000,
      )
      .run();
    if (!inserted.meta.changes) {
      const raced = await env.DB.prepare(
        'SELECT payload_hash,state FROM order_notifications WHERE id=?',
      )
        .bind(id)
        .first<{ payload_hash: string; state: string }>();
      return raced
        ? existingResponse(raced)
        : json(
            {
              error:
                'Terlalu banyak permintaan. Cuba selepas 10 minit atau hubungi admin.',
            },
            429,
          );
    }
    const text = `PESANAN TRUSTED EMPIRE\n\nNo. pesanan: ${id}\nNama: ${name.trim()}\nHubungi: ${contact.trim()}\nPelan: ${catalog[planId].name}\nTempoh: ${months} bulan${months === 2 ? ' (monthly renew)' : ''}\nJumlah: RM${(amountSen / 100).toFixed(2)}\nRujukan bayaran: ${name.trim()}\n\nSTATUS: MENUNGGU SEMAKAN BAYARAN\nPelanggan memaklumkan sudah bayar. Identiti/kontak diisi pelanggan dan belum disahkan. Semak transaksi sebenar dan resit sebelum aktifkan langganan. Resit dihantar berasingan melalui WhatsApp/Telegram.`;
    let result: { ok?: boolean; result?: { message_id: number } };
    try {
      const response = await transport(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
            text,
            link_preview_options: { is_disabled: true },
          }),
          signal: AbortSignal.timeout(12000),
        },
      );
      result = await response.json();
      if (!response.ok || !result.ok) throw new Error('Delivery failed');
    } catch {
      await env.DB.prepare(
        "UPDATE order_notifications SET state='uncertain' WHERE id=?",
      )
        .bind(id)
        .run();
      return json(
        {
          orderId: id,
          error:
            'Penghantaran notifikasi belum dapat dipastikan. Hubungi admin dan sertakan nombor pesanan ini.',
        },
        502,
      );
    }
    await env.DB.prepare(
      "UPDATE order_notifications SET state='sent',telegram_message_id=? WHERE id=?",
    )
      .bind(result.result?.message_id ?? null, id)
      .run();
    return json({
      orderId: id,
      status: 'notified',
      paymentStatus: 'pending_review',
    });
  } catch {
    return json(
      {
        orderId: id,
        error:
          'Sistem tidak dapat melengkapkan permintaan. Hubungi admin dan sertakan nombor pesanan ini.',
      },
      503,
    );
  }
}
