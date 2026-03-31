# Changes Log

## 2026-03-31

### Verified and corrected issues

- Source deletion for uploaded files:
  Updated `deleteDocumentsBySource()` to delete documents by either `metadata->>'url'` or `metadata->>'file_name'`, so uploaded sources can now be removed correctly.

- SSRF risk in `/api/train`:
  Added a guard so file fetching only allows `https` Blob URLs on `*.vercel-storage.com` before any server-side fetch occurs.

- `/api/chat` streaming contract mismatch:
  Confirmed the implementation uses a plain text response stream plus the `X-Sources` response header, and updated the API docs to match that contract.

- Training lifecycle docs drift:
  Updated the docs to describe the actual single fire-and-forget ingestion pipeline that ends at `ready` or `error`, instead of the old Phase 1 / Phase 2 / `complete` flow.

- Setup page lifecycle mismatch:
  Updated the dashboard setup flow to treat `ready` as the terminal success state and changed the success copy to say the chatbot is ready.

- Upload docs drift:
  Clarified that `/api/upload` returns a full Vercel Blob URL in `key`, and that the same URL is passed back through `fileKeys` to `/api/train`.

- Project structure docs drift:
  Corrected the route-protection file reference from `middleware.ts` to `proxy.ts`, which matches the actual repository layout.

- Sources API docs drift:
  Updated the documented `/api/chatbots/[id]/sources` response shape to match the real snake_case payload returned by the API.
