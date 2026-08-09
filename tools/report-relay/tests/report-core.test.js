'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { discordWebhook, sanitizeText, validatePayload } = require('../src/report-core');

test('sanitizes webhook credentials and local paths', () => {
  const source = 'https://discord.com' + '/api/webhooks/123456/example-token C:\\Users\\Someone\\Music\\track.wav?token=secret';
  const clean = sanitizeText(source);
  assert.match(clean, /REDACTED_DISCORD_WEBHOOK/);
  assert.match(clean, /REDACTED_LOCAL_PATH/);
  assert.doesNotMatch(clean, /example-token|Someone|token=secret/);
});

test('accepts the Quartic Pulse schema and cleans metadata', () => {
  const payload = validatePayload({ schemaVersion: 1, project: 'quartic-pulse', report: '# Report', metadata: { summary: 'Example' } });
  assert.equal(payload.report, '# Report');
  assert.equal(payload.metadata.summary, 'Example');
});

test('rejects invalid projects and oversized reports', () => {
  assert.throws(() => validatePayload({ schemaVersion: 1, project: 'other', report: 'x' }), /project/i);
  assert.throws(() => validatePayload({ schemaVersion: 1, project: 'quartic-pulse', report: 'x'.repeat(50001) }), /exceeds/i);
});

test('accepts only HTTPS Discord webhook destinations', () => {
  assert.match(discordWebhook('https://discord.com' + '/api/webhooks/123456/example-token'), /wait=true/);
  assert.throws(() => discordWebhook('https://example.com/api/webhooks/123456/token'), /invalid/i);
  assert.throws(() => discordWebhook('http://discord.com' + '/api/webhooks/123456/token'), /invalid/i);
});
