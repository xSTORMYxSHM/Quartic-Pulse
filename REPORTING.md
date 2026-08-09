# Quartic Pulse crash and bug reporting

Quartic Pulse captures a small, local history of sanitized renderer, main-process, and Electron child-process failures. Nothing is uploaded automatically. The user chooses whether to generate a report and whether to include system diagnostics.

The Report Center can copy a Markdown report, save it as text, open the Windows print/PDF dialog, or open a new GitHub issue. Reports exclude audio bytes and local song paths. Known user, temporary, application-data, query-secret, and Discord-webhook patterns are redacted before saving, printing, or submitting.

## Never ship a Discord webhook in the client

A Discord incoming-webhook URL contains a bearer token. A URL stored in the repository, `reporting-config.json`, JavaScript, an environment value baked into the build, or the packaged EXE can be recovered and abused. Rotate any webhook that has been committed, posted, or shared.

Quartic Pulse therefore submits only to a public HTTPS **report relay**. The relay keeps the Discord webhook in server-side secret storage, validates and rate-limits reports, disables mentions, and forwards accepted reports to Discord.

## Relay contract

Quartic Pulse sends:

```json
{
  "schemaVersion": 1,
  "project": "quartic-pulse",
  "report": "# Quartic Pulse Report\n...",
  "metadata": {
    "reportId": "QP-EXAMPLE",
    "category": "Bug",
    "summary": "Short description",
    "version": "0.29.1",
    "platform": "win32",
    "architecture": "x64"
  }
}
```

The relay should return any `2xx` status after accepting the report. A JSON response may include `reportId`, which Quartic Pulse displays as the submission receipt. Quartic Pulse permits only HTTPS relay URLs and explicitly rejects direct Discord or DiscordApp hosts.

## Azure relay outline

1. Deploy the ready-to-use Node.js v4 Azure Functions project in `tools/report-relay`, using a current supported 64-bit Node.js runtime.
2. Store the newly rotated Discord webhook as the Function App secret `DISCORD_WEBHOOK_URL`—never in source control.
3. Accept only `POST` requests with `schemaVersion: 1`, `project: quartic-pulse`, and a report no larger than 50,000 characters.
4. Apply server-side IP/rate limits with Azure API Management, Front Door, or an equivalent gateway. Client-side cooldowns are only a convenience and are not security.
5. Forward to Discord with `allowed_mentions: { "parse": [] }`. Attach the complete report as a text file if it exceeds Discord's message-content limit.
6. Put the public Function URL—not the Discord webhook—in `assets/reporting-config.json`:

```json
{
  "project": "quartic-pulse",
  "relayUrl": "https://YOUR-FUNCTION.azurewebsites.net/api/quartic-report"
}
```

Rebuild Quartic Pulse after configuring the relay. The Report Center will then enable **Send Report**. Copy, Save, Print/PDF, and GitHub reporting continue to work without any relay.

## Suggested relay protections

- Limit body size before parsing JSON.
- Reject unexpected fields and unsupported schema versions.
- Strip all Discord mentions and never accept a webhook URL from the client.
- Escape or attach user text instead of inserting it into privileged Discord formatting.
- Rate-limit by source IP and project, and add a daily project cap.
- Log only report IDs and delivery outcomes unless users have consented to more retention.
- Keep webhook rotation and deletion available to project maintainers.
