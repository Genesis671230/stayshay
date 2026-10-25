# Mobile app (Expo SDK 58)

- `apps/mobile`, expo-router, React Native 0.88, no Reanimated (RN `Animated` only), expo-image, expo-image-picker, react-native-svg.
- Bundle id / package: `ae.stayshay.app`. Expo account: **stayshay** (logged in on the founder's Mac: `npx eas-cli whoami`).
- API base: `EXPO_PUBLIC_API_URL` (eas.json per profile) → `app.json extra.apiUrl` → `https://stayshay.com`.
- Screens: Explore (hero, categories, rails, Shay FAB), Search, Roommates (board + profile with photo), List (photos → submit for review), Saved, Listing detail (viewing request → WhatsApp), Chat (Shay).

## Commands
```bash
cd apps/mobile
npx tsc --noEmit
CI=1 npx expo export --platform ios --platform android --output-dir "$(mktemp -d)"   # bundle check
node scripts/make-icons.mjs                     # icons/splash/store graphics from the Shay mark
npx eas-cli build -p android --profile preview  # APK link for testers (no store)
npx eas-cli build -p all --profile production   # store builds
npx eas-cli submit -p ios --latest              # needs Apple Developer + ascAppId in eas.json
npx eas-cli submit -p android --latest          # first upload by hand in Play Console
npx eas-cli update --branch production          # JS-only updates
```
No Xcode on the founder's Mac — iOS builds go through EAS. Full store checklist + copy: `docs/LAUNCH.md`.
Monorepo note: EAS uploads the git tree from the repo root; gitignored test data never ships.
