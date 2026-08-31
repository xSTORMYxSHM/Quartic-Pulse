# Quartic Pulse secure report relay

This folder is a deployable Azure Functions Node.js v4 reference for forwarding opt-in Quartic Pulse reports to Discord without putting the Discord webhook credential in the public application.

## Deploy

1. Create an Azure Function App using Functions runtime 4 and a supported 64-bit Node.js runtime (Node.js 22 or newer).
2. Deploy this folder with the Azure Functions extension for Visual Studio Code or Azure Functions Core Tools.
3. In the Function App, open **Settings → Environment variables → App settings** and add `DISCORD_WEBHOOK_URL` with the newly rotated Discord webhook URL. Never commit this value.
4. Optionally set `REPORT_RATE_LIMIT` and `REPORT_RATE_WINDOW_SECONDS`. The built-in limiter is a best-effort per-instance safety net; use Azure Front Door, API Management, or another durable gateway limit for public production traffic.
5. Copy the `quartic-report` HTTP trigger URL. Put only that public relay URL in Quartic Pulse `assets/reporting-config.json`, then rebuild the application.

The endpoint accepts only `POST` JSON for `project: quartic-pulse`, limits reports to 50,000 characters, sanitizes the report again on the server, disables Discord mentions, attaches the full Markdown report, and never logs report contents.

## Local verification

Copy `local.settings.example.json` to the ignored `local.settings.json`, insert a private test webhook, then run:

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm start
```

Do not publish `local.settings.json`. The root Quartic Pulse GPL-3.0-or-later license covers this reference relay source.
