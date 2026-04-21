# Chatbot Advanced Customization — Design Spec

**Date:** 2026-04-21
**Status:** Approved

## Overview

Extend the existing chatbot customization page with logo upload, personality trait selection, tone selection, and response style selection. All new fields are saved alongside the existing fields with a single Save button. Personality, tone, and response style feed directly into the RAG system prompt to shape the chatbot's runtime behavior.

---

## 1. Data Layer

### New columns on `chatbots`

| Column | SQL type | Default | Nullable |
|---|---|---|---|
| `logo_url` | `text` | — | yes |
| `personality` | `text` | `'friendly'` | no |
| `tone` | `text` | `'professional'` | no |
| `response_style` | `text` | `'concise'` | no |

### Migration

New file: `drizzle/migrations/0007_chatbot_personality.sql`

```sql
ALTER TABLE chatbots ADD COLUMN logo_url text;
ALTER TABLE chatbots ADD COLUMN personality text NOT NULL DEFAULT 'friendly';
ALTER TABLE chatbots ADD COLUMN tone text NOT NULL DEFAULT 'professional';
ALTER TABLE chatbots ADD COLUMN response_style text NOT NULL DEFAULT 'concise';
```

### Schema changes (`lib/db/schema.ts`)

Add the four columns to the `chatbots` pgTable definition. `Chatbot` and `NewChatbot` types auto-update via Drizzle inference.

### Query changes (`lib/db/queries/chatbots.ts`)

Extend the `data` parameter of `updateChatbot` to accept `logoUrl`, `personality`, `tone`, `responseStyle`.

### Type changes (`types/chatbot.ts`)

`ChatbotConfig` gains:

```ts
logoUrl: string | null;
personality: string;
tone: string;
responseStyle: string;
```

---

## 2. API Layer

### New endpoint: `POST /api/agents/[id]/logo`

- Auth + ownership check (same pattern as the existing PATCH handler)
- Accepts `multipart/form-data` with a single `image` field
- Validation:
  - Allowed MIME types: `image/png`, `image/jpeg`, `image/gif`, `image/webp`
  - Max size: 2 MB
- Upload with `put()` from `@vercel/blob` (server-side, no client token needed)
- Does NOT persist to DB — returns `{ logoUrl: string }` only
- The client includes `logoUrl` in the subsequent PATCH call, which is the single DB write

### Extended PATCH `/api/agents/[id]`

`updateChatbotSchema` gains optional fields:

```ts
logoUrl: z.string().url().nullable().optional()
personality: z.enum(['friendly','professional','empathetic','authoritative','witty']).optional()
tone: z.enum(['formal','casual','professional','conversational','direct']).optional()
responseStyle: z.enum(['concise','detailed','conversational','technical']).optional()
```

The PATCH handler destructures and passes these through `pickDefined` into `updateChatbot`. If `logoUrl` changes (new value differs from the chatbot's current `logoUrl`), the handler calls `del()` on the old blob URL before updating.

### Extended GET `/api/agents/[id]/config`

Add `logoUrl` to the public config response (widget needs it for the avatar):

```ts
{
  id, name, welcomeMessage, brandColor, isReady,
  logoUrl: chatbot.logoUrl ?? null,
}
```

---

## 3. Prompt Layer

### New file: `lib/ai/personality.ts`

Defines preset label → instruction mappings:

```ts
export const PERSONALITY_INSTRUCTIONS: Record<string, string> = {
  friendly:      "Be warm, approachable, and encouraging.",
  professional:  "Maintain a polished, businesslike manner.",
  empathetic:    "Show understanding and care for the user's situation.",
  authoritative: "Respond with confidence and expertise.",
  witty:         "Be clever and light-hearted while remaining helpful.",
};

export const TONE_INSTRUCTIONS: Record<string, string> = {
  formal:          "Use formal language. Avoid contractions and slang.",
  casual:          "Use relaxed, everyday language.",
  professional:    "Keep language clear, polished, and neutral.",
  conversational:  "Write as if having a natural back-and-forth conversation.",
  direct:          "Be straight to the point. Skip pleasantries.",
};

export const RESPONSE_STYLE_INSTRUCTIONS: Record<string, string> = {
  concise:         "Keep responses short and to the point.",
  detailed:        "Provide thorough explanations and cover relevant details.",
  conversational:  "Use a flowing, dialogue-style format.",
  technical:       "Use precise terminology and structured explanations.",
};
```

### Changes to `lib/ai/rag.ts`

`buildSystemPrompt` signature expands:

```ts
function buildSystemPrompt(
  chatbotName: string,
  context: string,
  fallbackMessage: string | null,
  personality: string,
  tone: string,
  responseStyle: string,
): string
```

The behavior profile block is injected after the role declaration:

```
You are ${chatbotName}, a helpful AI assistant.

Behavior profile:
- ${PERSONALITY_INSTRUCTIONS[personality]}
- ${TONE_INSTRUCTIONS[tone]}
- ${RESPONSE_STYLE_INSTRUCTIONS[responseStyle]}
```

`ragQuery` passes `chatbot.personality`, `chatbot.tone`, `chatbot.responseStyle` into `buildSystemPrompt`. No other RAG behavior changes (thresholds, deduplication, context injection all unchanged).

---

## 4. UI Layer

### `FormState` additions (`components/dashboard/customize-page-client.tsx`)

```ts
interface FormState {
  // existing
  name: string;
  welcomeMessage: string;
  fallbackMessage: string;
  brandColor: string;
  logoUrl: string | null;
  // new
  personality: string;
  tone: string;
  responseStyle: string;
}
```

A separate `pendingLogoFile: File | null` state tracks a newly-selected but not-yet-saved image (not part of `FormState` — it's transient).

### Save flow

1. User clicks Save
2. If `pendingLogoFile !== null`: POST to `/api/agents/[id]/logo` with FormData → receive `{ logoUrl }` → set `form.logoUrl` to the returned URL
3. PATCH `/api/agents/[id]` with full `FormState` (including `logoUrl`)
4. Clear `pendingLogoFile`

### New UI sections (in order on the form card)

**Logo Upload**
- 64×64 circular avatar: shows uploaded/preview image or initial letter fallback
- "Upload Logo" button → hidden `<input type="file" accept="image/*" />`
- Selecting a file sets `pendingLogoFile` and shows a local `URL.createObjectURL` preview
- Helper text: "PNG, JPG, GIF or WebP · max 2 MB"

**Personality** (below existing fields)
- Label: "Personality"
- 5 single-select pills: Friendly · Professional · Empathetic · Authoritative · Witty
- Selected pill: white text on `brandColor` background; unselected: muted style

**Tone**
- Label: "Tone"
- 5 pills: Formal · Casual · Professional · Conversational · Direct

**Response Style**
- Label: "Response Style"
- 4 pills: Concise · Detailed · Conversational · Technical

### Live preview changes

The avatar circle in the widget preview header shows the logo image (`pendingLogoFile` object URL, or `form.logoUrl`) if present. Falls back to the initial letter (existing behavior). No other preview changes.

### `ChatbotConfig` passed to the page

`customize/page.tsx` adds the four new fields when constructing `chatbotConfig`.

---

## Constraints & Notes

- Logo blobs live alongside document blobs in Vercel Blob. Use a distinct path prefix (`logos/`) to avoid collision.
- Logo upload has no separate rate limit — it goes through the existing upload rate limit bucket (`20 req / 10 min` per userId). The logo endpoint should call `uploadRateLimit.limit(userId)`.
- `pendingLogoFile` is never sent to the server raw. Only the Vercel Blob URL travels in the PATCH body.
- Widget (`widget-src/index.ts`) should be updated to render the logo image in the chat header if `logoUrl` is present in the config response.
- No changes to RAG thresholds (`SIMILARITY_THRESHOLD`, `MIN_CONTEXT_SIMILARITY`).
