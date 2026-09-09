# Trusted Empire

Malay streaming subscription storefront built with React, Vinext, Tailwind and Motion. Run `npm install` then `npm run dev`; production output uses `npm run build`.

## Current checkout

Customers choose a plan, open the original Telegram QR post or copy the CIMB account, enter their payment reference name, and prepare a message to copy to the administrator. No payment is verified and no subscription is delivered automatically. The supplied Telegram URL is a community, not a verified direct admin or bot destination. IPTV pricing must be confirmed with the administrator.

## Requirements for automatic delivery

Connect a payment provider with signed server-side payment webhooks; persist orders and verified amounts; add idempotent delivery and retry handling; connect an authorised Telegram bot or WhatsApp Business API; securely provision subscription inventory. Require a verified payment before releasing subscription details. Keep credentials in server-side secrets, never client code. No provider credentials or direct messaging destination have been supplied yet.

The original QR post could not be retrieved for embedding, so checkout links to the exact supplied post. Do not replace it with a generated payment QR. The cinema image is original generated decorative art, not a claim about available programme titles.

## Validation

TypeScript and production build checked. Local route returned HTTP 200. Browser UI testing was not requested. Optional WebMCP list_subscription_plans is feature-detected; no supported WebMCP validation context was available, so its runtime registration is unverified.
