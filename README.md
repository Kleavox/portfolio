# Portfolio

Personal portfolio site, served at `port.<root-domain>` and routed through the
Kleavox gateway. Extracted from the Kleavox monorepo so personal data lives in
this private repository only; the gateway connects to it purely by worker name.

## Layout

| Path      | Contents                                                        |
| --------- | --------------------------------------------------------------- |
| `app/`    | Astro static site (Turnstile-protected contact form)            |
| `worker/` | Cloudflare Worker: serves the built site + `/api/contact` (Resend) |

## Local development

```bash
pnpm install
pnpm --filter @portfolio/app build
pnpm dev   # wrangler dev for the worker, serving app/dist
```

No env vars are needed locally: dev builds fall back to Cloudflare's public
always-pass Turnstile test key, and contact emails are logged instead of sent
when `RESEND_API_KEY` is absent.

## Deploy

The worker name MUST be `${WORKER_PREFIX}-portfolio` — the Kleavox gateway's
`PORTFOLIO` service binding targets that exact name, and the `port.<domain>`
custom domain is attached to it. Redeploying under the same name keeps both.

GitHub environment `production` needs:

Variables:

```text
APP_ROOT_DOMAIN
WORKER_PREFIX        (same value as the Kleavox monorepo deploy)
CONTACT_EMAIL        (your personal inbox — contact-form messages land here)
FROM_EMAIL           (e.g. Portfolio <no-reply@<root-domain>>)
```

Secrets:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
RESEND_API_KEY
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

Run the `Deploy Portfolio` workflow with `domains=none` first, then
`domains=canonical` once verified.

## Contact form

The contact form posts to `/api/contact`; the worker relays each message
through Resend **outbound** straight to `CONTACT_EMAIL` (your personal inbox),
with the visitor's address set as `reply_to` so you can just hit reply. There
is no inbound mailbox to monitor — no MX records or Resend "Receiving" domain
are needed. The only Resend setup is verifying the sending domain used by
`FROM_EMAIL`, plus Turnstile hostname authorization for `port.<root-domain>`.
