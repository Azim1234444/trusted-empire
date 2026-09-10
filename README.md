# Trusted Empire

Malay streaming subscription storefront built with React, Vinext, Tailwind and Motion. Run `npm install` then `npm run dev`; production output uses `npm run build`.

## Current checkout

Customers choose a plan, scan or download the supplied payment QR (or copy the CIMB account), enter their payment reference name, and open WhatsApp 60163495594 with a prefilled order message. The customer-facing Telegram link opens the TrustedEmpire86 community group. Receipts are sent privately through WhatsApp. The original TrustedEmpire86 community link remains available for updates. Customers must attach their receipt and press Send in the messaging app. No payment is verified and no subscription is delivered automatically. IPTV pricing must be confirmed with the administrator.

## Requirements for automatic delivery

Connect a payment provider with signed server-side payment webhooks; persist orders and verified amounts; add idempotent delivery and retry handling; connect an authorised Telegram bot or WhatsApp Business API; securely provision subscription inventory. Require a verified payment before releasing subscription details. Keep credentials in server-side secrets, never client code. Direct messaging destinations have been supplied; payment provider and messaging API credentials are still required for automatic delivery.

The supplied payment QR screenshot is stored without alteration. The personal Telegram QR has been removed from the site. CSS frames the payment QR for display; download and full-image links preserve the complete original screenshot. Do not replace it with a generated payment QR. The cinema image is original generated decorative art, not a claim about available programme titles.

## Validation

## Telegram notifications

`POST /api/notify-order` records a customer payment claim in D1 and sends a notification to the configured admin through @AbiEmpireBot. This does not verify payment or deliver subscription credentials. The notification includes customer-provided name/contact, plan, server-calculated amount and order ID. Receipt submission remains via the existing direct messaging links.

The admin @Mieyzan86 must send `/start` to the bot. Run `node scripts/check-telegram-admin.mjs` to verify that specific private Telegram account and save its chat ID to ignored `.env.local`. Configure the keys listed in `.env.example` as hosted runtime values, marking the bot token and admin chat ID as secrets. The private admin account @Mieyzan86 has been verified through /start and the hosted secrets have been configured.

Run `node --test tests/notifications.test.mjs` for notification tests (Node 24). They use a local SQLite database and a simulated Telegram transport, so no real messages are sent. The tests cover server-side pricing, pending-review status, duplicate suppression, input/origin validation, rate limits and uncertain delivery. A timed-out send is deliberately not retried automatically because Telegram may already have accepted it. Use the same order ID when following up manually.

Migration `drizzle/0000_mighty_beyonder.sql` creates the notification records and rate-limit index. These records contain customer contact details and are not exposed through any public read route. Rate limiting uses a daily salted hash of the Cloudflare-provided client IP (five fresh claims per ten minutes); this is basic abuse protection, not verified customer identity.

TypeScript and production build checked. Local route returned HTTP 200. Browser UI testing was not requested. Optional WebMCP list_subscription_plans is feature-detected; no supported WebMCP validation context was available, so its runtime registration is unverified.




## Receipt uploads

Checkout sends JPG, PNG or PDF receipts (maximum 5 MiB) as multipart form data. The server bounds the request stream, validates the file signature and MIME type, and includes a SHA-256 receipt digest in duplicate detection. Telegram sendDocument delivers the original bytes and order caption in one private message to the configured admin. Receipt bytes are relayed directly to Telegram, not published as a website URL or retained in a website archive. D1 retains the order and Telegram message ID. Network-ambiguous delivery is never automatically retried. A WhatsApp fallback remains available. Uploading a receipt does not verify payment.

The current checkout upload replaces the separate WhatsApp receipt step described above. JSON submissions remain supported for older open checkout sessions.
