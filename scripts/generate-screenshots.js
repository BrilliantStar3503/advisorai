/**
 * Generates placeholder App Store / Play Store screenshots.
 *
 * Usage:  node scripts/generate-screenshots.js
 *
 * Each screenshot is a solid dark-bg card with the app icon centred,
 * the screen name, and a caption. Replace these with real device frames
 * captured via `eas build --platform ios --profile preview` + Simulator.
 */
const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');
const cfg   = require('../store/screenshots.config');

const ICON = path.join(__dirname, '..', 'assets', 'icon.png');

const SCREENS = [
  { name: '1_home',       caption: 'Your advisor, in your pocket.',  sub: 'Home' },
  { name: '2_assessment', caption: 'Start a financial assessment.',   sub: 'Assessment' },
  { name: '3_results',    caption: 'Review results instantly.',       sub: 'Results' },
  { name: '4_settings',   caption: 'Manage your profile & Sheet.',    sub: 'Settings' },
];

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function makeScreenshot(outPath, width, height, screen) {
  const iconSize  = Math.round(width * 0.25);
  const padding   = Math.round(width * 0.08);
  const captionY  = Math.round(height * 0.72);
  const subY      = Math.round(height * 0.64);
  const fontSize  = Math.round(width * 0.055);
  const subFont   = Math.round(width * 0.038);
  const badgeR    = Math.round(width * 0.025);

  // Resize icon to desired size
  const iconBuf = await sharp(ICON)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Red accent top bar -->
  <rect x="0" y="0" width="${width}" height="${Math.round(height * 0.007)}" fill="#DC2626"/>

  <!-- Tab badge pill (simulated) -->
  <rect
    x="${padding}" y="${Math.round(height * 0.09)}"
    width="${Math.round(width * 0.32)}" height="${Math.round(height * 0.038)}"
    rx="${badgeR}" fill="#1E293B" stroke="#334155" stroke-width="2"
  />
  <text
    x="${padding + Math.round(width * 0.16)}"
    y="${Math.round(height * 0.09 + height * 0.026)}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="700" font-size="${Math.round(width * 0.028)}"
    fill="#DC2626" text-anchor="middle" letter-spacing="1"
  >${xmlEscape(screen.sub.toUpperCase())}</text>

  <!-- Phone frame inner screen hint -->
  <rect
    x="${Math.round(width * 0.06)}"
    y="${Math.round(height * 0.16)}"
    width="${Math.round(width * 0.88)}"
    height="${Math.round(height * 0.44)}"
    rx="${Math.round(width * 0.04)}"
    fill="#0F172A" stroke="#334155" stroke-width="3"
  />

  <!-- Caption area -->
  <text
    x="${width / 2}" y="${subY}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="600" font-size="${subFont}"
    fill="#94A3B8" text-anchor="middle"
  >${xmlEscape(screen.sub)}</text>
  <text
    x="${width / 2}" y="${captionY}"
    font-family="'Helvetica Neue', Arial, sans-serif"
    font-weight="800" font-size="${fontSize}"
    fill="#F9FAFB" text-anchor="middle"
  >${xmlEscape(screen.caption)}</text>

  <!-- Red accent underline under caption -->
  <rect
    x="${width / 2 - Math.round(width * 0.14)}"
    y="${captionY + Math.round(fontSize * 0.3)}"
    width="${Math.round(width * 0.28)}"
    height="${Math.round(height * 0.006)}"
    rx="${Math.round(height * 0.003)}"
    fill="#DC2626"
  />

  <!-- Bottom bar (simulated tab bar) -->
  <rect
    x="0" y="${Math.round(height * 0.88)}"
    width="${width}" height="${Math.round(height * 0.12)}"
    fill="#0F172A"
  />
  <line
    x1="0" y1="${Math.round(height * 0.88)}"
    x2="${width}" y2="${Math.round(height * 0.88)}"
    stroke="#1E293B" stroke-width="2"
  />
</svg>`.trim();

  const svgBuf = Buffer.from(svg);

  // Composite icon over SVG
  const base = await sharp(svgBuf)
    .resize(width, height)
    .png()
    .toBuffer();

  await sharp(base)
    .composite([{
      input: iconBuf,
      left: Math.round((width - iconSize) / 2),
      top:  Math.round(height * 0.33),
    }])
    .png()
    .toFile(outPath);
}

async function run() {
  for (const [deviceKey, device] of Object.entries(cfg.devices)) {
    fs.mkdirSync(device.outputDir, { recursive: true });
    const rawFrames = (device.frames && device.frames.length) ? device.frames : SCREENS;
    // normalise: ensure every frame has a `sub` field
    const screens = rawFrames.map(f => ({
      ...f,
      sub: f.sub ?? f.name.replace(/^\d+_/, '').replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()),
    }));
    for (const screen of screens) {
      const outPath = path.join(device.outputDir, `${screen.name}.png`);
      await makeScreenshot(outPath, device.width, device.height, screen);
      console.log(`✓  ${deviceKey}  ${screen.name}  (${device.width}×${device.height})`);
    }
  }
  console.log('\nAll screenshots generated in store/screenshots/');
}

run().catch((e) => { console.error(e); process.exit(1); });
