---
status: awaiting_human_verify
trigger: "empty-stream-blank-bubble — blank assistant bubble when LLM stream yields no tokens"
created: 2026-04-02T00:00:00Z
updated: 2026-04-02T00:01:00Z
---

## Current Focus

hypothesis: Two confirmed failure points: (1) route.ts commits HTTP 200 before the stream body is consumed — if the upstream xAI stream stalls or yields nothing, the client receives 200 + empty body with no way to distinguish from a valid response; (2) widget ui.ts pushes `fullContent` (which may be "") into the history array unconditionally on stream completion.
test: Reading source files to confirm exact locations and then applying targeted fixes.
expecting: After fix — empty streams surface as error state in widget, empty assistant turns are never pushed to history.
next_action: Apply fix to widget-src/ui.ts (guard history push + show error on empty) and app/api/chat/route.ts (wrap stream body to detect and signal empty output).

## Symptoms

expected: When /api/chat streams a response, the widget displays the assistant's reply. If the stream fails/stalls, an error state or retry should be shown — NOT a blank bubble.
actual: POST /api/chat returns 200 in 50s, but the streamed body is empty. The widget pushes an empty string as the assistant message into conversation history. Subsequent requests include `{"role":"assistant","content":""}` which degrades follow-up question quality.
errors: No error thrown — HTTP 200 returned even when stream body is empty. Debug log shows assistant turn is "" in the messages array sent back.
reproduction: Ask the chatbot "give me a brief about each project" (a complex multi-context question) — the response takes ~50s and returns empty body.
started: Ongoing — likely present since initial implementation

## Eliminated

(none yet — root cause pre-confirmed from known_analysis)

## Evidence

- timestamp: 2026-04-02T00:00:00Z
  checked: app/api/chat/route.ts lines 51-64
  found: `result.stream.toTextStreamResponse()` is called immediately and its body forwarded — HTTP 200 is committed at this point. Any upstream failure happening inside the stream body arrives after the status line is sent. The outer try/catch (lines 65-71) cannot intercept it.
  implication: Client always sees 200 even on empty/failed streams.

- timestamp: 2026-04-02T00:00:00Z
  checked: widget-src/ui.ts lines 133-147 (handleSend onDone callback)
  found: `history.push({ role: "assistant", content: fullContent })` is executed unconditionally in the onDone callback. `fullContent` starts as "" and is only non-empty if tokens were received.
  implication: An empty stream results in `{"role":"assistant","content":""}` being pushed to history and shown as a blank bubble.

- timestamp: 2026-04-02T00:00:00Z
  checked: widget-src/api.ts lines 38-45
  found: The read loop calls `onDone(sources)` after the reader finishes regardless of whether any tokens were received. There is no token-received flag or empty-body check.
  implication: onDone fires even when zero bytes streamed, triggering the unconditional history push in ui.ts.

- timestamp: 2026-04-02T00:00:00Z
  checked: lib/ai/chat.ts — streamText call
  found: `streamText()` from Vercel AI SDK returns a result object; `toTextStreamResponse()` in route.ts converts it to a streaming HTTP response. If the model times out or returns an empty completion, the stream closes normally (no HTTP error) from the SDK's perspective.
  implication: Confirms the 200-on-empty behavior is inherent to how toTextStreamResponse works — the fix must be on the consumer side (widget) and optionally a server-side stream wrapper.

## Resolution

root_cause: Two compounding bugs: (1) HTTP 200 is committed before stream content is verified — empty streams are indistinguishable from successful ones at the HTTP layer. (2) The widget's onDone handler pushes the assistant turn to history unconditionally, even when fullContent is "".
fix: |
  1. widget-src/api.ts — added `tokensReceived` boolean flag; strips NUL sentinel (\x00) via replace before counting; passes flag to onDone signature.
  2. widget-src/ui.ts — onDone now receives `tokensReceived`; if false or fullContent.trim() === "" the streaming bubble is replaced with a user-friendly error message (styled with cb-msg-error), history push is skipped, and input is re-enabled. Normal path unchanged.
  3. widget-src/styles.ts — added .cb-msg-assistant.cb-msg-error rule (red-tint background, italic text) so error messages are visually distinct.
  4. app/api/chat/route.ts — added guardEmptyStream() TransformStream wrapper; if the upstream model stream closes with zero bytes forwarded, a single NUL byte (0x00) sentinel is flushed. The widget strips this sentinel and keeps tokensReceived=false, triggering the error UI branch.
verification: tsc --noEmit passes (only pre-existing unrelated errors). npm run build:widget succeeds — widget.js 8.9 KB.
files_changed: [widget-src/api.ts, widget-src/ui.ts, widget-src/styles.ts, app/api/chat/route.ts]
