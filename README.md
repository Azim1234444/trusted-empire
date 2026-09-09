# Trusted Empire

Malay streaming subscription storefront built with React, Vinext, Tailwind and Motion. Run `npm install` then `npm run dev`; production output uses `npm run build`.

## Current checkout

Customers choose a plan, scan or download the supplied payment QR (or copy the CIMB account), enter their payment reference name, and open WhatsApp 60163495594 with a prefilled order message. Telegram admin is @AJIMJEHEHE; customers can copy the message and send it directly there. The original TrustedEmpire86 community link remains available for updates. Customers must attach their receipt and press Send in the messaging app. No payment is verified and no subscription is delivered automatically. IPTV pricing must be confirmed with the administrator.

## Requirements for automatic delivery

Connect a payment provider with signed server-side payment webhooks; persist orders and verified amounts; add idempotent delivery and retry handling; connect an authorised Telegram bot or WhatsApp Business API; securely provision subscription inventory. Require a verified payment before releasing subscription details. Keep credentials in server-side secrets, never client code. Direct messaging destinations have been supplied; payment provider and messaging API credentials are still required for automatic delivery.

The user supplied original payment and Telegram QR screenshots. These are stored without alteration. CSS frames the payment QR for display; download and full-image links preserve the complete original screenshot. Do not replace it with a generated payment QR. The cinema image is original generated decorative art, not a claim about available programme titles.

## Validation

TypeScript and production build checked. Local route returned HTTP 200. Browser UI testing was not requested. Optional WebMCP list_subscription_plans is feature-detected; no supported WebMCP validation context was available, so its runtime registration is unverified.

