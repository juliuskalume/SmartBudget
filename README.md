# SmartBudget

SmartBudget is a cloud-backed personal finance app for students. It combines SMS-based transaction import, AI categorization, spending analysis, and Smart Save+ value protection.

## Stack

- React + Vite frontend
- Supabase auth and per-user cloud storage
- Groq-powered AI endpoints for categorization and advice
- Yahoo-powered live market screening for what-if analysis and investment suggestions
- Capacitor Android wrapper for native SMS import

SmartBudget uses a cached Yahoo market screen across 100 curated instruments by default, with Twelve Data kept as a secondary backup.

## Local Setup

```bash
npm install
```

Create a `.env` file from `.env.example`:

```bash
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
GROQ_API_KEY="your-groq-api-key"
TWELVE_DATA_API_KEY="your-twelve-data-api-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
APP_URL="https://your-app.vercel.app"
```

Run the local dev server:

```bash
npm run dev
```

The local server provides the `/api/ai/*` routes used by the app.

## Supabase

Run the SQL in [supabase/schema.sql](./supabase/schema.sql) in your Supabase project.

That creates the `user_app_state` table used to store:

- transactions
- Smart Save+ goal
- target currency

Supabase auth owns the user session. Browser local storage is only used for device-level UI state such as the active screen and Android SMS permission hint.

In the Supabase dashboard, set Auth URL Configuration so email verification returns to your deployed site:

- Site URL: `https://hamid-smart-budget.vercel.app`
- Redirect URLs:
  - `https://hamid-smart-budget.vercel.app/*`
  - `http://localhost:3000/*`

## Vercel

This repo is ready to host on Vercel.

Use these environment variables in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `TWELVE_DATA_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Vercel will serve the Vite build and the serverless functions in `api/ai/*`.

## Android

Build the native Android wrapper with Capacitor:

```bash
npm run build
npm run android:sync
npm run android:open
```

The Android app includes native SMS inbox import. SMS content is read locally on the device after permission is granted, then parsed transactions are saved to the user's cloud account.

The Android wrapper defaults to `https://hamid-smart-budget.vercel.app` and opens the hosted client URL instead of bundled `dist` assets. Set `APP_URL` only when you want to override that for staging or another deployment.

For manual installs, use the Android SDK `platform-tools/adb` binary. Old `Minimal ADB and Fastboot` builds can fail on modern APK signatures with `INSTALL_PARSE_FAILED_NO_CERTIFICATES`.

If USB `adb install` corrupts the APK in transit on your device or ROM, switch to wireless ADB:

```bash
adb tcpip 5555
adb connect <phone-ip>:5555
adb -s <phone-ip>:5555 install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Scripts

- `npm run dev` - local dev server with AI API routes
- `npm run build` - production frontend build
- `npm run preview` - preview the built app
- `npm run android:sync` - build and sync Capacitor Android
- `npm run android:open` - open Android Studio
- `npm run android:run` - run on an attached Android device
