#!/usr/bin/env node
/**
 * setup-buyer.mjs
 * Interactive CLI that collects buyer config and writes:
 *   - branch.config.ts
 *   - app.json  (bundleId, androidPackage, name, primaryColor, splash bg)
 *   - buyers/<slug>/config.json  (archived snapshot)
 *
 * Usage:  npm run setup-buyer
 *         npm run setup-buyer -- --preset buyers/xyz-financial/config.json
 */

import inquirer  from 'inquirer';
import chalk     from 'chalk';
import fs        from 'fs';
import path      from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');

// ── helpers ───────────────────────────────────────────────────────────────────

const dim   = (s) => chalk.dim(s);
const bold  = (s) => chalk.bold(s);
const red   = (s) => chalk.hex('#DC2626')(s);
const green = (s) => chalk.green(s);

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isHex(s) {
  return /^#[0-9A-Fa-f]{6}$/.test(s.trim());
}

function isUrl(s) {
  try { new URL(s); return true; } catch { return false; }
}

function validateHex(v) {
  return !v || isHex(v) ? true : 'Enter a valid hex colour (e.g. #DC2626) or leave blank';
}

function validateUrl(v) {
  return !v || isUrl(v) ? true : 'Enter a valid URL or leave blank';
}

// ── load preset ───────────────────────────────────────────────────────────────

let preset = {};
const presetFlag = process.argv.indexOf('--preset');
if (presetFlag !== -1) {
  const presetPath = path.resolve(process.argv[presetFlag + 1]);
  if (fs.existsSync(presetPath)) {
    preset = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
    console.log(chalk.cyan(`\n  Loaded preset: ${presetPath}\n`));
  }
}

// ── prompts ───────────────────────────────────────────────────────────────────

console.log('\n' + bold(red('  AdvisorAI — Buyer Setup')) + '\n' +
  dim('  Configures branch.config.ts and app.json for a new buyer.\n') +
  dim('  Press Enter to keep the default shown in parentheses.\n'));

const answers = await inquirer.prompt([
  // ── Branding ──
  { type: 'input', name: 'section_brand', message: chalk.cyan('─── BRANDING ─────────────────────────'), default: '', filter: () => '' },

  { type: 'input', name: 'appName',
    message: 'App name (shown in store & setup screen)',
    default: preset.appName ?? 'AdvisorAI',
  },
  { type: 'input', name: 'primaryColor',
    message: 'Primary colour (hex, e.g. #DC2626)',
    default: preset.primaryColor ?? '#DC2626',
    validate: validateHex,
    filter: v => v.trim() || '#DC2626',
  },
  { type: 'input', name: 'backgroundColor',
    message: 'Background colour (hex)',
    default: preset.backgroundColor ?? '#0F172A',
    validate: validateHex,
    filter: v => v.trim() || '#0F172A',
  },

  // ── Branch identity ──
  { type: 'input', name: 'section_branch', message: chalk.cyan('─── BRANCH IDENTITY ──────────────────'), default: '', filter: () => '' },

  { type: 'input', name: 'branchName',
    message: 'Branch / agency name  (REQUIRED)',
    default: preset.branchName ?? '',
    validate: v => v.trim() ? true : 'Branch name is required',
  },
  { type: 'input', name: 'agentName',
    message: 'Agent / advisor full name  (REQUIRED)',
    default: preset.agentName ?? '',
    validate: v => v.trim() ? true : 'Agent name is required',
  },
  { type: 'input', name: 'location',
    message: 'Office address',
    default: preset.location ?? '',
  },
  { type: 'input', name: 'phone',
    message: 'Contact phone',
    default: preset.phone ?? '',
  },
  { type: 'input', name: 'email',
    message: 'Contact email',
    default: preset.email ?? '',
  },

  // ── Integrations ──
  { type: 'input', name: 'section_int', message: chalk.cyan('─── INTEGRATIONS ─────────────────────'), default: '', filter: () => '' },

  { type: 'input', name: 'webviewUrl',
    message: 'WebView root URL (Home tab)',
    default: preset.webviewUrl ?? 'https://www.prubsq.com',
    validate: v => isUrl(v) ? true : 'Must be a valid URL',
  },
  { type: 'input', name: 'assessmentUrl',
    message: 'Assessment tab URL (blank = root + /assessment)',
    default: preset.assessmentUrl ?? '',
    validate: validateUrl,
  },
  { type: 'input', name: 'resultsUrl',
    message: 'Results tab URL (blank = root + /results)',
    default: preset.resultsUrl ?? '',
    validate: validateUrl,
  },
  { type: 'input', name: 'calendlyUrl',
    message: 'Calendly URL',
    default: preset.calendlyUrl ?? '',
    validate: validateUrl,
  },
  { type: 'input', name: 'messengerPageId',
    message: 'Facebook Messenger Page ID',
    default: preset.messengerPageId ?? '',
  },
  { type: 'input', name: 'n8nWebhook',
    message: 'n8n webhook URL',
    default: preset.n8nWebhook ?? '',
    validate: validateUrl,
  },
  { type: 'input', name: 'googleSheetsKey',
    message: 'Google Sheets API key',
    default: preset.googleSheetsKey ?? '',
  },
  { type: 'input', name: 'appsScriptUrl',
    message: 'Google Apps Script URL',
    default: preset.appsScriptUrl ?? '',
    validate: validateUrl,
  },

  // ── Build / store ──
  { type: 'input', name: 'section_build', message: chalk.cyan('─── BUILD & STORE ────────────────────'), default: '', filter: () => '' },

  { type: 'input', name: 'bundleId',
    message: 'iOS bundle ID (e.g. com.company.appname)',
    default: preset.bundleId ?? 'com.advisorai.app',
    validate: v => /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(v.trim())
      ? true : 'Use reverse-domain format: com.company.app',
  },
  { type: 'input', name: 'androidPackage',
    message: 'Android package (same format, can match bundle ID)',
    default: preset.androidPackage ?? preset.bundleId ?? 'com.advisorai.app',
    validate: v => /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(v.trim())
      ? true : 'Use reverse-domain format: com.company.app',
  },
  { type: 'input', name: 'privacyPolicyUrl',
    message: 'Privacy policy URL',
    default: preset.privacyPolicyUrl ?? '',
    validate: validateUrl,
  },
  { type: 'input', name: 'supportUrl',
    message: 'Support / contact URL',
    default: preset.supportUrl ?? '',
    validate: validateUrl,
  },
]);

// ── Resolve derived fields ────────────────────────────────────────────────────

const cfg = {
  appName:              answers.appName.trim(),
  logoFile:             preset.logoFile ?? 'icon.png',
  primaryColor:         answers.primaryColor.trim(),
  backgroundColor:      answers.backgroundColor.trim(),
  splashBackgroundColor:answers.backgroundColor.trim(),

  branchName:           answers.branchName.trim(),
  agentName:            answers.agentName.trim(),
  location:             answers.location.trim()         || '123 Main St, City, State 00000',
  phone:                answers.phone.trim()            || '+1 (555) 000-0000',
  email:                answers.email.trim()            || 'advisor@example.com',

  calendlyUrl:          answers.calendlyUrl.trim()      || 'https://calendly.com/your-link',
  messengerPageId:      answers.messengerPageId.trim()  || '000000000000000',
  n8nWebhook:           answers.n8nWebhook.trim()       || 'https://your-n8n-instance.com/webhook/your-id',
  googleSheetsKey:      answers.googleSheetsKey.trim()  || 'YOUR_GOOGLE_SHEETS_API_KEY',
  appsScriptUrl:        answers.appsScriptUrl.trim()    || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  webviewUrl:           answers.webviewUrl.trim(),
  assessmentUrl:        answers.assessmentUrl.trim() || (answers.webviewUrl.trim().replace(/\/$/, '') + '/assessment'),
  resultsUrl:           answers.resultsUrl.trim()    || (answers.webviewUrl.trim().replace(/\/$/, '') + '/results'),

  bundleId:             answers.bundleId.trim(),
  androidPackage:       answers.androidPackage.trim(),
  privacyPolicyUrl:     answers.privacyPolicyUrl.trim() || 'https://www.example.com/privacy',
  supportUrl:           answers.supportUrl.trim()        || 'https://www.example.com/support',
};

// ── Write branch.config.ts ────────────────────────────────────────────────────

const branchConfigContent = `// AUTO-GENERATED by scripts/setup-buyer.mjs — ${new Date().toISOString()}
// Buyer: ${cfg.branchName}
// To regenerate: npm run setup-buyer

const branchConfig = {
  // Branding
  appName:      '${cfg.appName}',
  logo:          require('./assets/${cfg.logoFile}'),
  primaryColor: '${cfg.primaryColor}',
  backgroundColor: '${cfg.backgroundColor}',

  // Branch identity
  branchName: '${cfg.branchName}',
  agentName:  '${cfg.agentName}',
  location:   '${cfg.location}',
  phone:      '${cfg.phone}',
  email:      '${cfg.email}',

  // Scheduling & contact
  calendlyUrl:     '${cfg.calendlyUrl}',
  messengerPageId: '${cfg.messengerPageId}',

  // Integrations
  n8nWebhook:    '${cfg.n8nWebhook}',
  googleSheetsKey: '${cfg.googleSheetsKey}',
  appsScriptUrl: '${cfg.appsScriptUrl}',

  // WebView URLs
  webviewUrl:    '${cfg.webviewUrl}',
  assessmentUrl: '${cfg.assessmentUrl}',
  resultsUrl:    '${cfg.resultsUrl}',

  // Store / build
  bundleId:        '${cfg.bundleId}',
  androidPackage:  '${cfg.androidPackage}',
  privacyPolicyUrl:'${cfg.privacyPolicyUrl}',
  supportUrl:      '${cfg.supportUrl}',
};

export default branchConfig;
`;

fs.writeFileSync(path.join(ROOT, 'branch.config.ts'), branchConfigContent, 'utf8');

// ── Patch app.json ────────────────────────────────────────────────────────────

const appJsonPath = path.join(ROOT, 'app.json');
const appJson     = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

appJson.expo.name                               = cfg.appName;
appJson.expo.primaryColor                       = cfg.primaryColor;
appJson.expo.splash.backgroundColor             = cfg.backgroundColor;
appJson.expo.ios.bundleIdentifier               = cfg.bundleId;
appJson.expo.android.package                    = cfg.androidPackage;
appJson.expo.android.adaptiveIcon.backgroundColor = cfg.backgroundColor;
appJson.expo.extra.privacyPolicyUrl             = cfg.privacyPolicyUrl;
appJson.expo.extra.supportUrl                   = cfg.supportUrl;

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n', 'utf8');

// ── Archive buyer snapshot ────────────────────────────────────────────────────

const slug      = slugify(cfg.branchName);
const buyerDir  = path.join(ROOT, 'buyers', slug);
fs.mkdirSync(buyerDir, { recursive: true });
fs.writeFileSync(
  path.join(buyerDir, 'config.json'),
  JSON.stringify(cfg, null, 2) + '\n',
  'utf8'
);

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n' + green('  ✓ branch.config.ts updated'));
console.log(green('  ✓ app.json patched'));
console.log(green(`  ✓ Snapshot saved → buyers/${slug}/config.json`));

console.log('\n' + bold('  Config summary:'));
const rows = [
  ['App name',      cfg.appName],
  ['Branch',        cfg.branchName],
  ['Agent',         cfg.agentName],
  ['Primary colour',cfg.primaryColor],
  ['WebView',       cfg.webviewUrl],
  ['Bundle ID',     cfg.bundleId],
  ['Android pkg',   cfg.androidPackage],
];
rows.forEach(([k, v]) => console.log(`    ${dim(k.padEnd(18))} ${v}`));

console.log('\n' + dim('  Next steps:'));
console.log(dim('    npm run generate:assets   # regenerate icons with new brand colour'));
console.log(dim('    npm run build:prod:all    # EAS production build'));
console.log('');
