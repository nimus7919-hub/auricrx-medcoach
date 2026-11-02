# Local backend and AI checks

Use Node 22. From `server`, run `npm ci`, configure `server/.env` using
`.env.example`, then run `npm start` (default port 4000). Replace all placeholders;
use MODEL=gpt-4o-mini and PORT=4000 for the existing defaults. The full backend also
uses DATABASE_URL, Stripe configuration, Firebase Admin credentials and
IDENTITY_HASH_SALT. Keep server credentials out of root/client env files.

Set API_BASE_URL in the app's .env.development (or .env.production for release)
to http://localhost:4000 for a local simulator/web, http://10.0.2.2:4000 for
Android emulator, or http://YOUR_COMPUTER_LAN_IP:4000 for a physical phone.
Restart Metro with `npx expo start --clear` after changing client env files.
The deployed backend remains the default when API_BASE_URL is unset.

POST /api/ai/stream accepts {messages:[{role:"user",content:"Hello"}],stream:false}
and returns plain text. Omit stream:false for raw streamed text. /ask-stream
remains an alias; /ask and /api/ai/drug-interactions retain their existing contracts.
OpenAI model selection and credentials stay on the server. AI routes share the
existing 10 requests/minute IP limiter.

Run `node --test ai-endpoint.test.js` from server for isolated mocked tests.
With real server configuration, open AI Consultant and send a question; verify
its reply and loading state. Run the AI Health drug interaction check and verify
its result. Inspect network traffic: calls should go to the configured backend,
with no OpenAI authorization header. Verify signup still behaves as before.
Rebuild release bundles after clearing Metro caches so old keys are absent.
Rotate OPENAI_API_KEY because previous client bundles exposed it.
