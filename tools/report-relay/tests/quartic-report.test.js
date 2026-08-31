'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { quarticReport, requestFingerprint } = require('../src/functions/quartic-report');

function headers(values = {}) {
  return { get: (name) => values[name.toLowerCase()] ?? null };
}

test('uses the platform client address ahead of a spoofable forwarded value', () => {
  const first = { headers: headers({ 'x-azure-clientip': '203.0.113.4', 'x-forwarded-for': '198.51.100.1' }) };
  const second = { headers: headers({ 'x-azure-clientip': '203.0.113.4', 'x-forwarded-for': '198.51.100.200' }) };
  assert.equal(requestFingerprint(first), requestFingerprint(second));
});

test('rejects an oversized body even when Content-Length is absent', async () => {
  const request = {
    headers: headers({ 'content-type': 'application/json', 'x-azure-clientip': '203.0.113.5' }),
    text: async () => 'x'.repeat(70001)
  };
  const response = await quarticReport(request, { log() {}, warn() {} });
  assert.equal(response.status, 413);
});
