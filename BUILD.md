# AdvisorAI — EAS Build & Submit Runbook

## Prerequisites
1. Expo account → https://expo.dev/signup
2. Apple Developer account (for iOS) → https://developer.apple.com
3. Google Play Console account (for Android)

## One-time setup

```bash
# Login to Expo
npx eas-cli login          # or: ./node_modules/.bin/eas login

# Link project to Expo (generates projectId in app.json)
npx eas-cli init           # select existing or create new project

# Configure credentials (interactive — EAS manages certs/keystores)
npx eas-cli credentials
```

After `eas init`, replace `YOUR_EAS_PROJECT_ID` in `app.json` → `extra.eas.projectId`.

## Before first iOS build
1. Register bundle ID `com.advisorai.app` in Apple Developer portal
2. Replace placeholders in `eas.json` → `submit.production.ios`:
   - `appleId`     → your Apple ID email
   - `ascAppId`    → App Store Connect numeric app ID
   - `appleTeamId` → 10-char team ID from developer.apple.com

## Build commands

| Command | Description |
|---------|-------------|
| `npm run build:prod:all`        | iOS + Android production builds (EAS cloud) |
| `npm run build:prod:ios`        | iOS only |
| `npm run build:prod:android`    | Android only (.aab) |
| `npm run build:preview:ios`     | iOS internal distribution (.ipa) |
| `npm run build:dev:ios`         | iOS simulator build |

## Submit to stores

```bash
# After a successful production build:
npm run submit:ios       # uploads to App Store Connect via EAS
npm run submit:android   # uploads to Google Play via service account
```

### Google Play service account
Place the JSON key at `secrets/google-play-service-account.json`  
(already listed in .gitignore — never commit this file).

## OTA updates (post-release)

```bash
npm run update   # publishes a JS-only OTA update via EAS Update
```

## Asset regeneration

```bash
npm run generate:assets        # regenerates icon / splash / adaptive-icon / favicon
npm run generate:screenshots   # regenerates placeholder App Store screenshots
```

Real screenshots should be captured from the iOS Simulator or a physical device  
and placed in `store/screenshots/<device>/` before submitting.

## App Store metadata
`store/metadata.json` — title, description, keywords, privacy policy URL, categories.  
Upload via App Store Connect or with `fastlane deliver` / `eas metadata`.

## Privacy policy
URL configured in `app.json → extra.privacyPolicyUrl`:  
`https://www.prubsq.com/privacy-policy`
