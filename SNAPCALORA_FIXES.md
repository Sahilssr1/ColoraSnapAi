# SnapCalora AI — fixes (prepared 2026-10-29, NOT pushed yet)

Changes are in the local clone at `~/workspace/ColoraSnapAi` (uncommitted,
except the keystore removal which is staged). Nothing has been pushed to
GitHub and nothing has been deployed to Render. Push/deploy only after you
approve, and only after the Render env vars in step 1 are set.

## 0. What was actually broken (verified, not guessed)

1. **Backend 500 on `/auth/google` and `/auth/login`** (checked live
   2026-10-29: `/health` healthy, both auth endpoints 500). The error
   handler returned only "Internal server error" in production, so the
   real cause is hidden. Most likely candidates on a fresh Render deploy:
   Postgres tables never migrated, or DATABASE_URL wrong. Check Render
   logs first (step 1) — the code now also returns a usable error for
   those two cases (503, "Database tables are missing" / "Database
   unavailable") instead of a bare 500.
2. **Google sign-in was unverified.** The app sent only `googleId` /
   email / name and the backend trusted them with no check. Anyone could
   have signed in as anyone. Swagger already documented `/auth/google`
   as taking an `idToken` — the implementation had drifted from it.
3. **Food scan "worked" but gave fake data.** Gemini `gemini-1.5-flash`
   was retired by Google (Sept 2025) and now returns 404. The old code
   swallowed that error and returned the same hardcoded "salmon bowl"
   for every photo.
4. **Play target-API warning.** `app.json` said target 36, but the
   committed native build defaulted to compile 34 / target 35 because
   `gradle.properties` never set them, and `app.json` versionCode 5 was
   lower than the native build's 6.
5. **Upload keystore secret in the public repo.** `release.keystore`
   was tracked and its password was hardcoded in `build.gradle`.

## 1. Before you deploy — Render env vars (do these first)

Render dashboard → your backend service → Environment. Do NOT paste any
key in chat or commit it to the repo.

- `GROK_API_KEY` = your xAI Grok key (food scans now try Grok first).
  If you don't set it, scans fall back to Gemini, then OpenAI.
- `GROK_MODEL` = `grok-4` (default). If your xAI plan/model access
  differs, change this to the vision model your key can use, e.g.
  `grok-2-vision-latest`. A wrong model gives a clear 502 scan error
  now, not fake data.
- `GOOGLE_WEB_CLIENT_ID` = the WEB OAuth client ID from Google Cloud
  Console (APIs & Services → Credentials, type WEB — not the Android
  client). Without it, `/auth/google` returns a clear configuration
  error instead of a 500.
- `GEMINI_MODEL` = `gemini-2.5-flash` (default; only used if Grok is
  unset or fails and a Gemini key is set).
- Check `DATABASE_URL` points at a Postgres database that has the
  Prisma tables. If the new 503 "Database tables are missing" error
  appears, run `npx prisma migrate deploy` against that database
  (Render shell / deploy command), then retry.
- Then check Render → Logs for the first error line on a failed login:
  `P2021` = table missing, `P1001` = can't reach Postgres,
  `P1017` = server closed the connection. Send that code if it still
  fails — it names the fix.

## 2. Google sign-in — SHA-1 fingerprints (the DEVELOPER_ERROR / code 10 fix)

Google sign-in needs the signing certificate's SHA-1 registered for
package `com.calora.ai` in Google Cloud Console → your OAuth client →
Android:

1. Debug build: SHA-1 of `debug.keystore` (the standard Android debug key).
2. Upload key: SHA-1 of your upload keystore.
3. **Play build: SHA-1 from Play Console → Setup → App signing**
   (Play re-signs the AAB, so this is the one that matters for the
   Play build — the debug/upload SHA-1 alone will not fix a Play build).

Also: test Google sign-in in a real APK / dev build, never in Expo Go —
Expo Go has no native Google Sign-In module and will always show the
"Expo Go Limitation" alert. That is expected, not a bug.

## 3. Code changes in this fix

- `backend/src/services/auth.service.ts` — `/auth/google` now verifies
  the ID token at `https://oauth2.googleapis.com/tokeninfo`, checks
  `aud` = `GOOGLE_WEB_CLIENT_ID`, issuer = Google, expiry, and uses the
  token's `sub` as googleId and the token's email/name. Unverified
  googleId/email pairs are rejected.
- `backend/src/validators/auth.validator.ts` — `/auth/google` requires
  `idToken`.
- `mobile/src/api/googleAuth.ts` — returns `idToken`, handles both the
  v12 (`{ user, idToken }`) and newer (`{ data: { user, idToken } }`)
  shapes, and errors clearly if Google returns a profile with no token
  (wrong webClientId).
- `mobile/src/screens/auth/{Login,Register}Screen.tsx` — send `idToken`
  instead of `googleId`.
- `backend/src/services/aiVision.service.ts` — scan order: Grok
  (`https://api.x.ai/v1/chat/completions`, Bearer key, `GROK_MODEL`)
  → Gemini (`GEMINI_MODEL`, default `gemini-2.5-flash`) → OpenAI.
  The hardcoded simulated result is deleted. If all providers fail,
  the scan returns 502 with the upstream error; if none is configured,
  503 naming the missing env var.
- `backend/src/middlewares/error.middleware.ts` — Prisma `P2021`/`P2022`
  (missing table/column) and initialisation failures now return 503
  with an actionable message instead of a bare 500.
- `backend/src/config/env.ts`, `backend/.env.example` — new vars:
  `GROK_API_KEY`, `GROK_MODEL`, `GEMINI_MODEL`, `GOOGLE_WEB_CLIENT_ID`.
- `mobile/android/gradle.properties` — `compileSdkVersion=36`,
  `targetSdkVersion=36`, `buildToolsVersion=35.0.0`.
- `mobile/app.json` — synced to the native build: version `1.0.4`,
  `versionCode` 6. The NEXT Play upload must bump versionCode to 7
  (Play rejects a versionCode equal to or lower than the live one).
- `mobile/android/app/build.gradle` — release signing no longer
  hardcodes a password. It reads `mobile/android/keystore.properties`
  (gitignored; copy from `keystore.properties.example`) or
  `MYAPP_UPLOAD_*` in `~/.gradle/gradle.properties`.
- `mobile/android/app/release.keystore` — removed from git tracking
  (the file itself is still on disk locally). Deleting it from the
  repo does NOT undo the exposure: anyone who cloned the repo while
  it was public already has the file and the old password.

## 4. Keystore — rotate, don't just delete (do this before the next push)

1. If Play App Signing is ON: Play Console → Setup → App signing →
   request an upload-key reset, then generate a new upload key.
2. If Play App Signing is OFF: you cannot change the signing key
   without losing update continuity — generate a new key and accept
   that it will be a new app listing, or keep the old key but treat
   its password as compromised and never reuse that password elsewhere.
3. Put the NEW key's details in `keystore.properties` only, never in
   git, chat, or `build.gradle`.

## 5. Test after deploy (in this order)

1. `POST /auth/google` with a real ID token from a dev-build APK →
   expect 200 + Calora JWT. A 401 = token/aud problem; a 500 naming
   `GOOGLE_WEB_CLIENT_ID` = Render env var missing.
2. Email login with a real account → expect 200. A 503 = database
   tables/connection (see step 1).
3. Photo scan → expect a result that matches the photo, NOT the old
   salmon bowl. A 502 names the Grok/Gemini upstream error; a 503
   means no scan AI key is set on Render.
4. Build the Android release (`versionCode` 7 for the next Play upload)
   and confirm Play reports target SDK 36.

## Verification done locally (2026-10-29)

- Changed backend TS files transpile cleanly (TypeScript transpile
  check). A full `tsc --noEmit` could not pass here because
  `prisma generate` failed on a network reset (ECONNRESET) in this
  sandbox, so `@prisma/client` types were ungenerated — that is a
  sandbox/network limit, not a code error, and Render's build runs
  `prisma generate` itself. Re-run `npm run build` on Render / your
  machine before treating the backend as fully type-checked.
- Old patterns confirmed gone: no `googleId` post from the app, no
  `gemini-1.5-flash` call, no hardcoded keystore password in
  `build.gradle`.
