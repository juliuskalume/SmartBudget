
# SmartBudget

AI-powered student finance app prototype.

## Run

```bash
npm install
npm run dev
```

## Android

```bash
npm run build
npm run android:sync
npm run android:open
```

The Android app is packaged with Capacitor and runs the SmartBudget UI in a native WebView.
If the local backend is not running, the app falls back to local parsing and advice.

## Features

- SMS-based transaction import
- Automatic transaction categorization
- Financial dashboard and spending analysis
- Smart Save+ value protection simulator
- AI recommendation cards
