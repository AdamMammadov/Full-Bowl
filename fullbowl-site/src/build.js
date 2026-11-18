/* Builds index.html (for Vercel) and preview/index.html (for the claude.ai preview)
   from src/index.template.html, filling the Azerbaijani text in as the default.
   Run: node src/build.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const EMAIL = "mammadovadem842@gmail.com";
// Optional: Web3Forms access key (web3forms.com). When set, the form sends through Web3Forms instead of FormSubmit.
const WEB3FORMS_KEY = "";
const SITE_URL = "https://fullbowl.vercel.app"; // change after the first Vercel deploy if the address differs

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/js/i18n.js"), "utf8"), ctx);
const DICT = ctx.window.FB_I18N;
const az = DICT.az;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const splitTitle = (s) => (s.match(/[^.]+\.?/g) || [s]).map((p) => `<span class="w">${esc(p.trim())}</span>`).join(" ");

// every key used in the template must exist in all three languages
const tpl = fs.readFileSync(path.join(__dirname, "index.template.html"), "utf8");
const used = new Set();
const body = tpl
  .replace(/\{\{html:([\w.]+)\}\}/g, (_, k) => {
    if (k.endsWith(".split")) { used.add(k.replace(/\.split$/, "")); return splitTitle(az[k.replace(/\.split$/, "")]); }
    used.add(k); return az[k];
  })
  .replace(/\{\{([\w.]+)\}\}/g, (_, k) => { used.add(k); return esc(az[k]); })
  .replace(/%%EMAIL%%/g, EMAIL);

const missing = [];
for (const k of used) for (const l of ["az", "en", "ru"]) if (DICT[l][k] === undefined) missing.push(`${l}:${k}`);
for (const l of ["en", "ru"]) for (const k of Object.keys(az)) if (DICT[l][k] === undefined) missing.push(`${l}:${k}`);
if (missing.length) { console.error("Missing translations:", missing); process.exit(1); }
if (/\{\{|\}\}|undefined/.test(body)) { console.error("Unfilled placeholder in output"); process.exit(1); }
const all = JSON.stringify(DICT) + tpl;
if (/[\u2013\u2014]/.test(all)) { console.error("Long dash found; use '-' instead"); process.exit(1); }

const preload = ["geologica-latin-wght-normal.woff2", "onest-latin-wght-normal.woff2"]
  .map((f) => `<link rel="preload" href="assets/fonts/${f}" as="font" type="font/woff2" crossorigin>`).join("\n  ");

const head = `<!doctype html>
<html lang="az">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(az["meta.title"])}</title>
  <meta name="description" content="${esc(az["meta.desc"])}">
  <meta name="theme-color" content="#c4520f">
  <link rel="canonical" href="${SITE_URL}/">
  <link rel="alternate" hreflang="az" href="${SITE_URL}/?lang=az">
  <link rel="alternate" hreflang="en" href="${SITE_URL}/?lang=en">
  <link rel="alternate" hreflang="ru" href="${SITE_URL}/?lang=ru">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="FullBowl">
  <meta property="og:title" content="${esc(az["meta.title"])}">
  <meta property="og:description" content="${esc(az["meta.desc"])}">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:image" content="${SITE_URL}/assets/img/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="az_AZ">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
  <link rel="icon" type="image/png" sizes="64x64" href="assets/img/favicon-64.png">
  <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
  ${preload}
  <link rel="stylesheet" href="assets/css/fonts.css">
  <link rel="stylesheet" href="assets/css/style.css">
  <script>window.FB_CONFIG = { email: "${EMAIL}", web3formsKey: "${WEB3FORMS_KEY}" };</script>
  <script src="assets/js/i18n.js" defer></script>
  <script src="assets/js/main.js" defer></script>
</head>
<body>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), head + body + "\n</body>\n</html>\n");

// preview build for claude.ai: no doctype/head (the host adds its own), form runs in preview mode
const preview = `<title>FullBowl</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${esc(az["meta.desc"])}">
<link rel="stylesheet" href="assets/css/fonts.css">
<link rel="stylesheet" href="assets/css/style.css">
<script>window.FB_CONFIG = { email: "${EMAIL}", preview: true };</script>
${body}
<script src="assets/js/i18n.js"></script>
<script src="assets/js/main.js"></script>
`;
fs.mkdirSync(path.join(ROOT, "preview"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "preview/index.html"), preview);
console.log("Built index.html and preview/index.html,", used.size, "keys used,", Object.keys(az).length, "keys per language");
