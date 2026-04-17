/**
 * Generates AdvisorAI brand assets:
 *   assets/icon.png            1024×1024  app icon
 *   assets/adaptive-icon.png   1024×1024  Android adaptive foreground
 *   assets/splash-icon.png      400×400   splash centre logo
 *   assets/favicon.png           48×48   web favicon
 */
const sharp = require('sharp');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets');

// ── Colour palette ────────────────────────────────────────────────────────────
const BG     = '#0F172A';
const CARD   = '#1E293B';
const RED    = '#DC2626';
const WHITE  = '#F9FAFB';
const SLATE  = '#94A3B8';

// ── SVG helpers ───────────────────────────────────────────────────────────────
function iconSVG(size) {
  const s = size;
  const r = Math.round(s * 0.22); // corner radius
  const cx = s / 2;
  const cy = s / 2;

  // Star / AI motif: a stylised "A" with a 4-point star accent
  const font = Math.round(s * 0.38);
  const starR = Math.round(s * 0.09);
  const starCx = Math.round(s * 0.68);
  const starCy = Math.round(s * 0.26);

  // 4-point star path (centred at starCx, starCy)
  function star4(cx, cy, r) {
    const o = r * 0.38;
    return `M${cx},${cy - r} L${cx + o},${cy - o} L${cx + r},${cy} L${cx + o},${cy + o} L${cx},${cy + r} L${cx - o},${cy + o} L${cx - r},${cy} L${cx - o},${cy - o} Z`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
    <linearGradient id="redGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#B91C1C"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Subtle grid lines -->
  <g stroke="${SLATE}" stroke-width="${Math.max(1, s * 0.003)}" opacity="0.08">
    <line x1="${s*0.25}" y1="0" x2="${s*0.25}" y2="${s}"/>
    <line x1="${s*0.5}"  y1="0" x2="${s*0.5}"  y2="${s}"/>
    <line x1="${s*0.75}" y1="0" x2="${s*0.75}" y2="${s}"/>
    <line x1="0" y1="${s*0.25}" x2="${s}" y2="${s*0.25}"/>
    <line x1="0" y1="${s*0.5}"  x2="${s}" y2="${s*0.5}"/>
    <line x1="0" y1="${s*0.75}" x2="${s}" y2="${s*0.75}"/>
  </g>

  <!-- Red accent bar at top -->
  <rect x="${s*0.08}" y="${s*0.07}" width="${s*0.84}" height="${Math.max(3, s*0.045)}" rx="${Math.max(2, s*0.022)}" fill="url(#redGrad)"/>

  <!-- "AI" text -->
  <text
    x="${cx}" y="${cy + s*0.13}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="800"
    font-size="${font}"
    fill="${WHITE}"
    text-anchor="middle"
    letter-spacing="-2"
  >AI</text>

  <!-- 4-point star accent -->
  <path d="${star4(starCx, starCy, starR)}" fill="${RED}"/>

  <!-- Bottom label -->
  <text
    x="${cx}" y="${s*0.88}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="600"
    font-size="${Math.round(s * 0.075)}"
    fill="${SLATE}"
    text-anchor="middle"
    letter-spacing="3"
  >ADVISOR</text>
</svg>`.trim();
}

function splashSVG(size) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const starR = Math.round(s * 0.14);

  function star4(cx, cy, r) {
    const o = r * 0.38;
    return `M${cx},${cy - r} L${cx + o},${cy - o} L${cx + r},${cy} L${cx + o},${cy + o} L${cx},${cy + r} L${cx - o},${cy + o} L${cx - r},${cy} L${cx - o},${cy - o} Z`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- Transparent bg — splash bg colour comes from app.json -->

  <!-- Outer glow ring -->
  <circle cx="${cx}" cy="${cy - s*0.04}" r="${s*0.34}" fill="none" stroke="${RED}" stroke-width="${Math.max(2,s*0.025)}" opacity="0.18"/>
  <circle cx="${cx}" cy="${cy - s*0.04}" r="${s*0.27}" fill="${CARD}" opacity="0.9"/>

  <!-- Star -->
  <path d="${star4(cx, cy - s*0.04, starR)}" fill="${RED}"/>

  <!-- "AdvisorAI" wordmark -->
  <text
    x="${cx}" y="${cy + s*0.32}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="800"
    font-size="${Math.round(s * 0.13)}"
    fill="${WHITE}"
    text-anchor="middle"
  >AdvisorAI</text>

  <!-- Tagline -->
  <text
    x="${cx}" y="${cy + s*0.46}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="400"
    font-size="${Math.round(s * 0.065)}"
    fill="${SLATE}"
    text-anchor="middle"
    letter-spacing="1"
  >Powered by PRU BSQ</text>

  <!-- Red accent underline -->
  <rect x="${cx - s*0.18}" y="${cy + s*0.50}" width="${s*0.36}" height="${Math.max(2, s*0.018)}" rx="${Math.max(1, s*0.009)}" fill="${RED}"/>
</svg>`.trim();
}

function adaptiveSVG(size) {
  // Adaptive icon foreground — no bg, safe zone is inner 66%
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const font = Math.round(s * 0.32);
  const starR = Math.round(s * 0.075);
  const starCx = Math.round(s * 0.66);
  const starCy = Math.round(s * 0.28);

  function star4(cx, cy, r) {
    const o = r * 0.38;
    return `M${cx},${cy - r} L${cx + o},${cy - o} L${cx + r},${cy} L${cx + o},${cy + o} L${cx},${cy + r} L${cx - o},${cy + o} L${cx - r},${cy} L${cx - o},${cy - o} Z`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- Red accent bar -->
  <rect x="${s*0.17}" y="${s*0.18}" width="${s*0.66}" height="${Math.max(3,s*0.04)}" rx="${Math.max(2,s*0.02)}" fill="${RED}"/>
  <!-- AI text -->
  <text
    x="${cx}" y="${cy + s*0.12}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="800"
    font-size="${font}"
    fill="${WHITE}"
    text-anchor="middle"
  >AI</text>
  <!-- Star -->
  <path d="${star4(starCx, starCy, starR)}" fill="${RED}"/>
  <!-- Label -->
  <text
    x="${cx}" y="${s*0.80}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="600"
    font-size="${Math.round(s * 0.065)}"
    fill="${SLATE}"
    text-anchor="middle"
    letter-spacing="3"
  >ADVISOR</text>
</svg>`.trim();
}

function faviconSVG(size) {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const r = s * 0.18;
  function star4(cx, cy, r) {
    const o = r * 0.38;
    return `M${cx},${cy - r} L${cx + o},${cy - o} L${cx + r},${cy} L${cx + o},${cy + o} L${cx},${cy + r} L${cx - o},${cy + o} L${cx - r},${cy} L${cx - o},${cy - o} Z`;
  }
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${s*0.18}" fill="${BG}"/>
  <text x="${cx}" y="${cy+s*0.13}" font-family="Arial" font-weight="800" font-size="${Math.round(s*0.46)}" fill="${WHITE}" text-anchor="middle">AI</text>
  <path d="${star4(s*0.72, s*0.22, r)}" fill="${RED}"/>
</svg>`.trim();
}

// ── Generate ──────────────────────────────────────────────────────────────────
async function generate() {
  const tasks = [
    { name: 'icon.png',          svg: iconSVG(1024),     size: 1024 },
    { name: 'adaptive-icon.png', svg: adaptiveSVG(1024), size: 1024 },
    { name: 'splash-icon.png',   svg: splashSVG(400),    size: 400  },
    { name: 'favicon.png',       svg: faviconSVG(48),    size: 48   },
  ];

  for (const { name, svg, size } of tasks) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, name));
    console.log(`✓  ${name}  (${size}×${size})`);
  }
  console.log('\nAll assets generated.');
}

generate().catch((e) => { console.error(e); process.exit(1); });
