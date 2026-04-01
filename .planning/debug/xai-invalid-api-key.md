# Debug Session: xai-invalid-api-key

## Objective
Investigate issue: Chat completions failing with `AI_APICallError` due to invalid xAI API key.

**Summary:** `[AI_APICallError]: Bad Request ... "error":"Incorrect API key provided: xa***..."` during `POST /api/chat` calls.

## Symptoms
- **Expected:** Chatbot should respond using the currently configured AI provider.
- **Actual:** Fails with a 400 Bad Request error from `api.x.ai` showing `Incorrect API key provided: xa***...`.
- **Timeline:** Occurs during active Next.js dev server session when invoking `/api/chat`.
- **Reproduction:** Submit a chat message in the UI while `AI_PROVIDER_MODE` is set to `production` and `XAI_API_KEY` is a dummy placeholder (`xai-...`).

## Hypothesis
The `.env.local` contains `AI_PROVIDER_MODE=production`. This setting defaults the chat model to use the `XAI_API_KEY` under the hood. However, `XAI_API_KEY` is currently set exactly to `xai-...` which is a placeholder and not a real API key. The application attempts to send it to the `api.x.ai` endpoint, causing a credentials collision.

## Action Plan
1. Switch `AI_PROVIDER_MODE` from `production` to `test` in `.env.local` to use the fully configured `NVIDIA_NIM_API_KEY` local testing infrastructure.
2. Start the development server (`npm run dev`) since the previous process was terminated.
3. Test that chat now handles requests via NVIDIA NIM correctly instead of throwing XAI key errors.

## Resolution
- Validated that `XAI_API_KEY` was indeed an incomplete placeholder (`xai-...`).
- Replaced `AI_PROVIDER_MODE=production` with `AI_PROVIDER_MODE=test` in `.env.local` so that the setup falls back correctly to the tested NVIDIA NIM `glm4.7` instance.
- Restarted the Next.js dev server to properly ingest the environment variable change.
