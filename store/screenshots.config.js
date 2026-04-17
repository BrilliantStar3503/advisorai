/**
 * App Store screenshot configuration.
 *
 * Required sizes:
 *   iPhone 6.7"  (iPhone 15 Pro Max)  — 1290 × 2796  (mandatory)
 *   iPhone 6.5"  (iPhone 14 Plus)     — 1284 × 2778  (optional but recommended)
 *   iPad 12.9"   (iPad Pro 6th gen)   — 2048 × 2732  (required if supportsTablet)
 *
 * Android Play Store:
 *   Phone  — 1080 × 1920  (min), up to 1080 × 2340
 *   Tablet — 1200 × 1600
 *
 * Screenshots are placed in store/screenshots/<device>/<order>_<name>.png
 * and uploaded via `eas submit` or Transporter / fastlane deliver.
 */

module.exports = {
  devices: {
    // ── iOS ──────────────────────────────────────────────────────────────────
    'iphone-67': {
      label: 'iPhone 6.7" (1290×2796)',
      width: 1290,
      height: 2796,
      platform: 'ios',
      required: true,
      outputDir: 'store/screenshots/iphone-67',
      frames: [
        { name: '1_home',       caption: 'Your advisor, in your pocket.' },
        { name: '2_assessment', caption: 'Start a financial assessment.' },
        { name: '3_results',    caption: 'Review results instantly.' },
        { name: '4_settings',   caption: 'Manage your profile & Sheet.' },
      ],
    },
    'iphone-65': {
      label: 'iPhone 6.5" (1284×2778)',
      width: 1284,
      height: 2778,
      platform: 'ios',
      required: false,
      outputDir: 'store/screenshots/iphone-65',
    },
    // ── Android ──────────────────────────────────────────────────────────────
    'android-phone': {
      label: 'Android Phone (1080×1920)',
      width: 1080,
      height: 1920,
      platform: 'android',
      required: true,
      outputDir: 'store/screenshots/android-phone',
    },
  },

  // Shared caption style for framed screenshots (used by generate-screenshots.js)
  style: {
    backgroundColor: '#0F172A',
    accentColor: '#DC2626',
    textColor: '#F9FAFB',
    fontFamily: 'Helvetica Neue',
    captionFontSize: 72,
    captionFontWeight: '700',
  },
};
