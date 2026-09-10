import fs from 'node:fs';
const path = '.env.local';
const raw = fs.readFileSync(path, 'utf8');
const token = raw.match(/^TELEGRAM_BOT_TOKEN\s*=\s*["']?([^\s"']+)/m)?.[1];
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
async function api(method) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!result.ok) throw new Error('Telegram request failed');
    return result.result;
  } catch { throw new Error('Cannot contact Telegram. Token is never logged.'); }
}
const me = await api('getMe');
if (me.username?.toLowerCase() !== 'abiempirebot') throw new Error('Token belongs to a different bot');
const webhook = await api('getWebhookInfo');
if (webhook.url) throw new Error('Existing webhook detected; inspect before using getUpdates');
const updates = await api('getUpdates');
const admin = updates.map(x => x.message).find(m => m?.chat?.type === 'private' && m.from?.username?.toLowerCase() === 'mieyzan86' && /^\/start(?:\s|$)/.test(m.text ?? ''));
if (admin) {
  const clean = raw.replace(/^TELEGRAM_ADMIN_CHAT_ID=.*\r?\n?/gm, '');
  fs.writeFileSync(path, clean.trimEnd() + `\nTELEGRAM_ADMIN_CHAT_ID=${admin.chat.id}\n`);
  console.log('Verified @Mieyzan86 /start. Admin chat ID saved locally; no message sent.');
} else console.log('Waiting for /start from @Mieyzan86. No recipient configured and no message sent.');
