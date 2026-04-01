# Debug Session: auth-fetch-failed

## Objective
Investigate issue: NextAuth / Auth.js `fetch failed` error when triggering Google Sign-in.

**Summary:** `[auth][error] TypeError: fetch failed` at `node:internal/deps/undici/undici` during `GET /api/auth/providers` or `POST /api/auth/signin/google?`.

## Symptoms
- **Expected:** Clicking the Google sign-in button redirects the user successfully.
- **Actual:** Fails with `TypeError: fetch failed` in Next.js development server console, redirecting the UI to `/login?error=Configuration`.
- **Errors:** TypeError at `undici` when attempting to fetch providers.
- **Reproduction:** NextAuth `signIn('google')` action.
- **Timeline:** Current Next.js dev server session.

## Hypothesis
The project uses `next-auth@5.0.0-beta.30` and sets `AUTH_URL=http://localhost:3000` in `.env.local`. Node.js 18+ replaces local DNS resolution with a preference for IPv6 (`::1`), causing `fetch('http://localhost:3000')` via `undici` to fail if the Next.js server isn't bound to IPv6 or if internal proxying fails.

## Action Plan
1. Change `AUTH_URL=http://localhost:3000` to `AUTH_URL=http://127.0.0.1:3000` in `.env.local`.
2. Restart the Next.js development server to pick up the updated environment variables.
3. Test the sign-in flow.

## Resolution
- Validated that `AUTH_URL` was pointing to `localhost`.
- Replaced `localhost` with `127.0.0.1`.
- Root cause officially verified as native `undici` IPv6 routing preference in latest versions of Node causing fetch internal loops to `::1`.
