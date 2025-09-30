# Firebase Functions for Yatzy

This folder contains a scheduled Cloud Function that performs token regeneration server-side so tokens can increase even when clients are offline.

Quick deploy steps:

1. Install Firebase CLI and log in:

   npm install -g firebase-tools
   firebase login

2. Initialize functions (if not done) and deploy:

   cd functions
   npm install
   firebase deploy --only functions:scheduledTokenRegen

Notes:
- The function reads `/players` and updates `tokens` and `nextTokenTime` fields. It's idempotent and uses an atomic `update()` for bulk writes.
- Adjust schedule in `index.js` if you want a different cadence.
- Make sure your Firebase project has billing enabled if scheduled functions require it for your plan.

Important: The client no longer uses a 5s dev override for regeneration. EFFECTIVE_REGEN_INTERVAL is set to the production value (1.6h).
To ensure tokens regenerate while users are offline, deploy `scheduledTokenRegen` to your Firebase project before releasing the APK.
