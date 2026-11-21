#!/usr/bin/env node
// Checks for elghaly.pro (no network). Fails on: a banned word, any phone
// number, Dubai/Deira/Egypt, a missing or wrong company address (footer,
// contact block, JSON-LD), a contact email that differs between places or is
// not an elghaly.dev address, any name other than "Wyndham Heaven", a missing
// link, a script, or a CNAME file (the owner switches the domain himself).
// Run: node tools/check-site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let checks = 0;
const fails = [];
const check = (ok, msg) => { checks++; if (!ok) fails.push(msg); };

const TEXT = ['index.html', '404.html', 'css/site.css', 'README.md', 'robots.txt'];
const BANNED = [/\bfree\b/i, new RegExp('\\bsa' + 'fe\\b', 'i'), new RegExp('un' + 'sa' + 'fe', 'i'), /\bAI\b/, /آمن/, /مجان/];
const PLACES = [/dubai/i, /deira/i, /egypt/i, /\bU\.?A\.?E\b/, /دبي/, /مصر/];
// 9 or more digits with phone punctuation in between, or a tel: link.
const PHONE = /(?:\+?\d[\s().-]*){9,}|tel:/i;
const ADDR = 'Elghaly LLC · 548 Market St, San Francisco, CA 94104, USA';

for (const f of TEXT) {
  const p = path.join(ROOT, f);
  check(fs.existsSync(p), f + ': exists');
  if (!fs.existsSync(p)) continue;
  // env(safe-area-inset-*) is a CSS keyword, not text anyone reads.
  const t = fs.readFileSync(p, 'utf8').replace(/safe-area-inset-(?:top|right|bottom|left)/g, '');
  for (const re of BANNED) check(!re.test(t), `${f}: no banned word ${re}`);
  for (const re of PLACES) check(!re.test(t), `${f}: no ${re}`);
  check(!PHONE.test(t), `${f}: no phone number`);
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
check(html.includes(`<p class="footer__addr">${ADDR}</p>`), 'footer carries the address');
check(/<address class="contact__addr">\s*Elghaly LLC<br>\s*548 Market St<br>\s*San Francisco, CA 94104<br>\s*USA\s*<\/address>/.test(html), 'contact block carries the address');
const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
check(ld['@type'] === 'Person' && ld.name === 'Wyndham Heaven', 'JSON-LD: Person, Wyndham Heaven');
const a = ld.worksFor && ld.worksFor.address;
check(ld.worksFor && ld.worksFor.name === 'Elghaly LLC' && a && a.streetAddress === '548 Market St' && a.addressLocality === 'San Francisco' && a.addressRegion === 'CA' && a.postalCode === '94104' && a.addressCountry === 'US', 'JSON-LD: company address');
check(!/telephone|faxNumber/i.test(JSON.stringify(ld)), 'JSON-LD: no telephone');
// One contact email, the same everywhere, on the elghaly.dev domain.
const mails = [...html.matchAll(/mailto:([^"\s]+)/g)].map((m) => m[1]);
check(mails.length >= 4 && new Set(mails).size === 1 && /@elghaly\.dev$/.test(mails[0]), 'one elghaly.dev email in contact, footer and JSON-LD');
check(JSON.stringify(ld.sameAs) === JSON.stringify(['https://elghaly.dev/', 'https://github.com/Alarm2024', 'https://x.com/wyndham350']), 'JSON-LD: sameAs links');
for (const href of ['https://elghaly.dev/', 'https://github.com/Alarm2024', 'https://x.com/wyndham350']) check(html.includes(`href="${href}"`), 'link ' + href);
check(/by Elghaly LLC/.test(visible.slice(0, 400)), 'credit "by Elghaly LLC" at the top');
check(/<p class="footer__name">Wyndham Heaven<\/p>/.test(html), '"Wyndham Heaven" in the footer');
const names = html.replace(/wyndham350/g, '').match(/wyndham\s+\w+/gi) || [];
check(names.length > 0 && names.every((n) => n === 'Wyndham Heaven'), 'only the name Wyndham Heaven: ' + names.join(', '));
check(!/<script(?![^>]*type="application\/ld\+json")/i.test(html), 'no executable script');
check(/http-equiv="Content-Security-Policy"[^>]*script-src 'none'/.test(html), 'CSP forbids scripts');
check(!fs.existsSync(path.join(ROOT, 'CNAME')), 'no CNAME file (DNS and the custom domain stay with the owner)');
for (const f of ['fonts/outfit-latin-400-normal.woff2', 'fonts/outfit-latin-500-normal.woff2', 'fonts/cinzel-latin-700-normal.woff2', 'fonts/cormorant-garamond-latin-400-italic.woff2', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png']) check(fs.existsSync(path.join(ROOT, f)), f + ': present');
// Local links are relative, so the page also works from a GitHub Pages
// project path (…/elghaly-pro/) before the domain is switched.
check(!/(?:href|src)="\/(?!\/)/.test(html), 'no root-absolute local links');
for (const m of html.matchAll(/(?:href|src)="(?!https?:|mailto:|#)([^"#?]+)"/g)) check(fs.existsSync(path.join(ROOT, m[1])), 'local link ' + m[1]);
for (const m of fs.readFileSync(path.join(ROOT, 'css/site.css'), 'utf8').matchAll(/url\("([^"]+)"\)/g)) check(fs.existsSync(path.join(ROOT, 'css', m[1])), 'css url ' + m[1]);

if (fails.length) { console.log(`FAIL ${fails.length}/${checks}`); fails.forEach((m) => console.log('  FAIL | ' + m)); process.exit(1); }
console.log(`OK ${checks}/${checks} site checks`);
