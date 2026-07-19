# @kembali/mobile — the branded app shell

Capacitor shell around the customer PWA (`/app`), one brand config per chain
(APP.md Stages 2–5). The shell loads the PWA remotely, so every card
improvement ships to web and app together. No staff mode: cashiers stay on
the web admin.

## How a brand becomes an app

1. Add `brands/<id>.json` — appId (the chain's own bundle id), appName,
   tenant slug, dev and prod URLs. `pnpm build` validates every config.
2. `BRAND=<id> pnpm exec cap sync` regenerates the native projects with that
   brand's identity.
3. Icons and splash screens per brand: planned via `@capacitor/assets`
   (Stage 4), one source image per brand.

## One-time machine setup (founder)

The repo machine has no native toolchains yet. In order:

1. **Xcode** from the App Store (~12 GB, then `sudo xcode-select -s
   /Applications/Xcode.app` and accept the license).
2. **CocoaPods**: `brew install cocoapods` (Capacitor's iOS dependency
   manager).
3. **Android Studio** (installs the Android SDK; accept licenses via
   `sdkmanager --licenses`).
4. Then, from `apps/mobile`: `pnpm add:ios && pnpm add:android` to generate
   the native projects, and `pnpm run:ios` to run on the simulator.

## Device testing

- Simulator reaches the dev server at `http://localhost:3000`.
- A real phone cannot see localhost: run with
  `APP_URL=http://<your-mac-lan-ip>:3000/app pnpm exec cap sync` first, with
  the phone on the same wifi.
- Production builds point at `prodUrl` — blocked on the real domain
  (kembali.app is unregistered) and real OTP delivery (`OTP_PROVIDER=none`
  refuses to boot in production).

## Store submission (Stage 5, per client)

- Apple requires white-label apps to ship from the client's own developer
  account (guideline 4.2.6); Google Play likewise under the brand's account.
- Review-risk mitigations for webview shells (guideline 4.2): native push,
  offline card cache, deep links — the Stage 3 work.
- In-app account deletion is mandatory (5.1.1(v)); the flow is designed in
  the Stage 1 demo and needs its backend endpoint (APP.md §5).
