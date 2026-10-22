#!/usr/bin/env node
// Non-secret release preflight for Bella PDV Pro TWA / Google Play.
const BASE = process.env.BELLA_PLAY_ORIGIN || 'https://bellapdvpro.vercel.app';
const paths = ['/manifest.json', '/.well-known/assetlinks.json', '/pwa-192x192.png', '/pwa-512x512.png', '/pwa-maskable-512x512.png', '/login'];
let errors = 0;
const results = {};
for (const path of paths) {
  try {
    const response = await fetch(new URL(path, BASE), { redirect: 'follow', signal: AbortSignal.timeout(12000) });
    const type = response.headers.get('content-type') || '';
    if (!response.ok) throw Error('HTTP ' + response.status);
    if (path.endsWith('.json')) {
      const data = await response.json();
      if (path.includes('assetlinks')) {
        const targets = Array.isArray(data) ? data : [];
        const app = targets.find(item => item?.target?.package_name === 'com.bellapdv.app');
        if (!app) throw Error('Missing Digital Asset Links declaration for com.bellapdv.app');
        if (!Array.isArray(app.target.sha256_cert_fingerprints) || !app.target.sha256_cert_fingerprints.length) throw Error('Missing signing fingerprints');
        results[path] = 'DECLARED (certificate ownership NOT VERIFIED)';
      } else {
        for (const key of ['start_url','scope','name','icons']) if (!data[key]) throw Error('Manifest missing '+ key);
        results[path] = 'VALID';
      }
    } else {
      if (path.endsWith('.png') && !type.includes('image/')) throw Error('Expected image, got '+type);
      if (path === '/login' && !type.includes('text/html')) throw Error('Expected HTML, got '+type);
      results[path] = 'HTTP ' + response.status;
    }
  } catch (e) { results[path] = 'FAIL: '+e.message; errors++; }
}
for (const [path,result] of Object.entries(results)) console.log(path.padEnd(36), result);
console.log('\nNOTE: Digital Asset Links fingerprint must be checked against Play App Signing certificate in Play Console.');
if (errors) process.exitCode = 1;
