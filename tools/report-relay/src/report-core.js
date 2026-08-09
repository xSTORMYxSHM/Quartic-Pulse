'use strict';

const crypto = require('node:crypto');

const MAX_REPORT_LENGTH = 50000;
const MAX_METADATA_KEYS = 40;

function sanitizeText(value, maximum = MAX_REPORT_LENGTH) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/[^\s)\]}>"']+/gi, '[REDACTED_DISCORD_WEBHOOK]')
    .replace(/([?&](?:token|key|secret|password)=)[^&#\s]+/gi, '$1[REDACTED]')
    .replace(/[A-Z]:\\Users\\[^\\\r\n]+/gi, '[REDACTED_LOCAL_PATH]')
    .replace(/\\\\[^\\\s]+\\[^\r\n]+/g, '[REDACTED_NETWORK_PATH]')
    .slice(0, maximum);
}

function cleanMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, MAX_METADATA_KEYS).map(([key, item]) => [
    sanitizeText(key, 80),
    sanitizeText(typeof item === 'object' ? JSON.stringify(item) : item, 1000)
  ]));
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Request body must be a JSON object.');
  if (payload.schemaVersion !== 1) throw new Error('Unsupported report schema.');
  if (payload.project !== 'quartic-pulse') throw new Error('Unknown report project.');
  if (typeof payload.report !== 'string' || !payload.report.trim()) throw new Error('Report text is required.');
  if (payload.report.length > MAX_REPORT_LENGTH) throw new Error(`Report exceeds ${MAX_REPORT_LENGTH} characters.`);
  return {
    report: sanitizeText(payload.report, MAX_REPORT_LENGTH),
    metadata: cleanMetadata(payload.metadata)
  };
}

function reportIdentity(metadata) {
  const supplied = String(metadata?.reportId || '').trim();
  if (/^QP-[A-Z0-9-]{6,64}$/i.test(supplied)) return supplied.toUpperCase();
  return `QP-RELAY-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
}

function discordWebhook(value) {
  const url = new URL(String(value || ''));
  const host = url.hostname.toLowerCase();
  const validHost = host === 'discord.com' || host.endsWith('.discord.com') || host === 'discordapp.com' || host.endsWith('.discordapp.com');
  if (url.protocol !== 'https:' || !validHost || !/^\/api\/webhooks\/\d+\//.test(url.pathname)) throw new Error('DISCORD_WEBHOOK_URL is missing or invalid.');
  url.searchParams.set('wait', 'true');
  return url.href;
}

module.exports = { MAX_REPORT_LENGTH, sanitizeText, cleanMetadata, validatePayload, reportIdentity, discordWebhook };
