# SnapCalora AI — fixes (prepared 2026-10-29, PUSHED 2026-10-29)

Pushed to GitHub as commit `818a0b1` (main) on 2026-10-29, verified via
`git ls-remote`. Nothing has been deployed to Render yet — deploy only
after the Render env vars in step 1 are set.

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

## 6. Background walking / running tracker — checked 2026-10-29, PUSHED 2026-10-29 (commit 4d2c3e6)

Verdict: background tracking was NOT working, and it was not a bug in
one line — it was missing entirely. Evidence: no `expo-task-manager`,
no background fetch, no foreground service, no `FOREGROUND_SERVICE` /
`RECEIVE_BOOT_COMPLETED` permissions; `usePedometer` only ran
`Pedometer.watchStepCount` while the Home screen was mounted and
re-fetched on foreground return, and its watch effect restarted (and
could drop session steps on Android) every time the past total changed.
Expo's own docs state pedometer updates are not delivered while the
app is in the background, and `getStepCountAsync` is iOS-only — so on
Android, steps taken while the app was closed could not be recovered.

What was built instead:
- `mobile/src/hooks/useWalkRunSession.ts` — Start Walk / Start Run
  session: live steps, elapsed time, distance (walk 0.762 m/step,
  run 1.0 m/step, estimates), calories (walk 0.04, run 0.06 per step,
  estimates), pace, pause/resume, stop-and-save, and a session history
  in AsyncStorage. A session interrupted by closing the app restores
  as PAUSED — it does not pretend steps taken while closed were counted.
  Session steps are NOT posted to `/analytics/steps` again (the daily
  pedometer already counts them), so totals are not double-counted.
- `mobile/src/components/WalkRunTracker.tsx` — the card on the Home
  screen (after the Steps card), with the background limit stated in
  the card itself so users are not misled.
- `mobile/src/hooks/usePedometer.ts` — watch subscription no longer
  restarts when the past total changes (past total now read via a ref).

What this does NOT do: true always-on background step counting on
Android. That needs a native foreground service or Health Connect —
a separate native build with Play policy declarations, not a JS change,
and it cannot be verified from this VM (no Android device). Until
then: keep the app open during a walk/run session.

Test on a real Android device (dev build, not Expo Go): Start Walk,
walk 50+ steps, check the live count; pause, resume, stop and check
the session appears in Recent sessions; close the app mid-session,
reopen, and confirm it comes back Paused, not as if it kept counting.

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

## 7. General bug + UI audit — 2026-10-29, PUSHED 2026-10-29 (commit 22b6588)

Found and fixed, all in the mobile app:

1. **Dead "View Trends & Activity" button (Search tab):** it called
   `navigation.navigate('Analytics')`, which is not a route in either
   navigator, so tapping it did nothing. It now goes to
   `MainTabs > AnalyticsTab`. The neighbouring "Search & Log Meal"
   button was also pushing a duplicate Search screen on top of itself;
   it now just closes the modal (you are already on the search tab).
2. **Session expiry left the user stuck:** when a refresh token failed,
   the API client logged the user out of Redux but left MainTabs on
   screen, so every query kept failing with 401. A new global
   navigation ref (`mobile/src/navigation/navigationRef.ts`, wired in
   `App.tsx`) now resets the stack to Login on refresh failure — the
   same reset the Profile logout button already used.
3. **Profile edit could overwrite real data with defaults:** the Edit
   form's weight/height/age/goal state was initialised once from a
   profile that had not loaded yet (70 kg / 175 cm / 25 yrs). Saving
   before the query returned would have written those defaults.
   The form now syncs from the loaded profile whenever it is not
   being edited.
4. **Fake health data removed (Search tab + Home):**
   - Home "Stand" hours were `current hour - 6`, i.e. derived from
     the clock, not a sensor. The Activity card now shows Move,
     Exercise (labelled est.) and real step-goal %, and its third ring
     is step-goal progress.
   - Home "Walking Steadiness" claimed "Verified / Normal stride".
     Nothing measures stride, so it now says "Not measured".
   - Search health categories showed invented values for Cycle
     (Day 14), Hearing (62 dB), Heart (68 BPM), Medications (3 of 3),
     Mental wellbeing, Mobility (4.8 km/h, 1.2% asymmetry) and
     Respiratory (98% SpO2), plus invented trend sparklines for
     Activity, Body (a fake 72→70 kg weight loss), Steps, Nutrition
     and Sleep. Unmeasured categories now show "— / Not connected";
     sparklines with no history data now render nothing instead of
     a made-up trend (the sparkline component's own fake default
     data was also removed). Activity calories falling back to 450
     when nothing was eaten is also gone — 0 now shows as 0.
5. **Fake nutrition scores removed:** Trends showed 85 with no meals
   logged and forced calorie-based scores into 70–99; AI Insights
   showed 85 when no analysis existed. Both now show no score
   ("No score yet" / "—") until the backend returns a real one.
6. **Unverified marketing claims removed (Onboarding):** "99.4%
   Accuracy", "99.4% Macro Accuracy", "in 1.2s", "Clinical" and
   "Circadian Timers" are gone — no measurement supports them.
7. **UI:** the stack navigator's hardcoded dark `#090A0F` background,
   which flashed behind light-theme screens, was removed.

Checked and left alone: camera/barcode scan flow and meal logging
(quantity multiplier is applied consistently), water/weight/sleep
endpoints, the 7-day step history (the backend already fills missing
days, so the modal's "Today" row is correct), and the walk/run
session tracker from §6.

Not fixed here (needs a product decision, not a code patch): sleep
score still uses a fixed 20-point consistency component and estimates
deep sleep at 22% of hours when only hours are entered; step dates
are server-time based, so "today" can shift near midnight in IST.
Both are now documented limitations, not silent fake readings.

Verification: all 11 changed/new mobile files pass a TypeScript
transpile check. Not tested on a real device. Pushed 2026-10-29 on
his yes (commit 22b6588, verified as remote HEAD).
