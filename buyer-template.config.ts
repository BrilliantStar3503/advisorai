/**
 * buyer-template.config.ts
 *
 * Master template for all buyer-configurable fields in AdvisorAI.
 * Run `npm run setup-buyer` to generate a filled branch.config.ts
 * interactively, or edit branch.config.ts directly.
 *
 * Every field marked REQUIRED must be provided before building.
 * Optional fields fall back to the defaults shown here.
 */

export type BuyerConfig = {
  // ── Branding ──────────────────────────────────────────────────────────────
  /** Display name of the app (shown in Setup screen & Settings).  REQUIRED */
  appName: string;
  /** Relative path to logo image inside /assets/. Default: 'icon.png' */
  logoFile: string;
  /** Primary brand colour (hex). Used for accents, progress bar, CTAs. REQUIRED */
  primaryColor: string;
  /** Dark background colour (hex). Default: '#0F172A' */
  backgroundColor: string;
  /** Splash/background alternative (hex). Default: same as backgroundColor */
  splashBackgroundColor: string;

  // ── Branch identity ───────────────────────────────────────────────────────
  /** Branch/agency display name shown in Settings.  REQUIRED */
  branchName: string;
  /** Agent / advisor full name.  REQUIRED */
  agentName: string;
  /** Street address shown in Settings */
  location: string;
  /** Contact phone number */
  phone: string;
  /** Contact email address */
  email: string;

  // ── Integrations ─────────────────────────────────────────────────────────
  /** Calendly scheduling URL */
  calendlyUrl: string;
  /** Facebook Messenger Page ID */
  messengerPageId: string;
  /** n8n webhook URL for CRM/automation */
  n8nWebhook: string;
  /** Google Sheets API key (read-only public sheets) */
  googleSheetsKey: string;
  /** Google Apps Script deployment URL */
  appsScriptUrl: string;

  // ── WebView ───────────────────────────────────────────────────────────────
  /** Root URL loaded in the Home tab.  REQUIRED */
  webviewUrl: string;
  /** URL for the Assessment tab (defaults to webviewUrl + /assessment) */
  assessmentUrl: string;
  /** URL for the Results tab (defaults to webviewUrl + /results) */
  resultsUrl: string;

  // ── Store / build metadata ────────────────────────────────────────────────
  /** iOS bundle identifier. Format: com.company.appname  REQUIRED */
  bundleId: string;
  /** Android package name. Same format as bundleId.  REQUIRED */
  androidPackage: string;
  /** Privacy policy URL shown in App Store listing */
  privacyPolicyUrl: string;
  /** Support / contact URL */
  supportUrl: string;
};

/**
 * Canonical defaults — every field has a safe fallback.
 * `setup-buyer` script overlays buyer answers on top of this object.
 */
export const BUYER_DEFAULTS: BuyerConfig = {
  appName:              'AdvisorAI',
  logoFile:             'icon.png',
  primaryColor:         '#DC2626',
  backgroundColor:      '#0F172A',
  splashBackgroundColor:'#0F172A',

  branchName:           'My Branch',
  agentName:            'My Agent',
  location:             '123 Main St, City, State 00000',
  phone:                '+1 (555) 000-0000',
  email:                'advisor@example.com',

  calendlyUrl:          'https://calendly.com/your-link',
  messengerPageId:      '000000000000000',
  n8nWebhook:           'https://your-n8n-instance.com/webhook/your-id',
  googleSheetsKey:      'YOUR_GOOGLE_SHEETS_API_KEY',
  appsScriptUrl:        'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',

  webviewUrl:           'https://www.prubsq.com',
  assessmentUrl:        'https://www.prubsq.com/assessment',
  resultsUrl:           'https://www.prubsq.com/results',

  bundleId:             'com.advisorai.app',
  androidPackage:       'com.advisorai.app',
  privacyPolicyUrl:     'https://www.prubsq.com/privacy-policy',
  supportUrl:           'https://www.prubsq.com/support',
};
