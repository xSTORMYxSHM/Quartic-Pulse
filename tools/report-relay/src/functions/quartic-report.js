'use strict';

const crypto = require('node:crypto');
const { app } = require('@azure/functions');
const { discordWebhook, reportIdentity, sanitizeText, validatePayload } = require('../report-core');

const rateBuckets = new Map();
const instanceSalt = crypto.randomBytes(32);

function json(status, body, headers = {}) {
  return { status, jsonBody: body, headers: { 'Cache-Control': 'no-store', ...headers } };
}

function requestFingerprint(request) {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-azure-clientip') || 'unknown';
  return crypto.createHash('sha256').update(instanceSalt).update(String(forwarded).split(',')[0].trim()).digest('hex');
}

function acceptRate(request) {
  const now = Date.now();
  const limit = Math.max(1, Math.min(20, Number(process.env.REPORT_RATE_LIMIT) || 3));
  const windowMs = Math.max(10000, Math.min(3600000, (Number(process.env.REPORT_RATE_WINDOW_SECONDS) || 60) * 1000));
  const key = requestFingerprint(request);
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { accepted: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) return { accepted: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  bucket.count += 1;
  return { accepted: true, retryAfter: 0 };
}

async function quarticReport(request, context) {
  if (!String(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) return json(415, { error: 'Content-Type must be application/json.' });
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 70000) return json(413, { error: 'Request is too large.' });

  const rate = acceptRate(request);
  if (!rate.accepted) return json(429, { error: 'Too many reports. Please try again later.' }, { 'Retry-After': String(rate.retryAfter) });

  try {
    const payload = validatePayload(await request.json());
    const id = reportIdentity(payload.metadata);
    const webhook = discordWebhook(process.env.DISCORD_WEBHOOK_URL);
    const summary = sanitizeText(payload.metadata.summary || 'Quartic Pulse user report', 180);
    const category = sanitizeText(payload.metadata.category || 'report', 40);
    const form = new FormData();
    form.append('payload_json', JSON.stringify({
      content: `**Quartic Pulse ${category}** · ${id}\n${summary}`,
      allowed_mentions: { parse: [] }
    }));
    form.append('files[0]', new Blob([payload.report], { type: 'text/markdown' }), `${id}.md`);
    const response = await fetch(webhook, { method: 'POST', body: form, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Discord delivery returned HTTP ${response.status}.`);
    context.log(`Quartic Pulse report delivered: ${id}`);
    return json(202, { accepted: true, reportId: id });
  } catch (error) {
    const message = sanitizeText(error?.message || 'Report delivery failed.', 240);
    const clientError = /body|schema|project|required|exceeds|JSON/i.test(message);
    context.warn(`Quartic Pulse report rejected: ${message}`);
    return json(clientError ? 400 : 502, { error: clientError ? message : 'Report delivery is temporarily unavailable.' });
  }
}

app.http('quartic-report', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'quartic-report',
  handler: quarticReport
});

module.exports = { quarticReport };
