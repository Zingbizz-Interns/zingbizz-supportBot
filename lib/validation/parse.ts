import { z } from "zod";

type ParseOk<T> = { ok: true; data: T };
type ParseFail = { ok: false; response: Response };
type ParseResult<T> = ParseOk<T> | ParseFail;

/**
 * Safely parse unknown input against a Zod schema.
 * Returns either the validated data or a ready-to-return 400 Response.
 *
 * Usage:
 *   const parsed = parseBody(mySchema, body);
 *   if (!parsed.ok) return parsed.response;
 *   const { field } = parsed.data;
 */
export function parseBody<T>(
  schema: z.ZodType<T>,
  input: unknown,
  extraHeaders?: Record<string, string>
): ParseResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const message = result.error.issues[0]?.message ?? "Invalid input";
  return {
    ok: false,
    response: Response.json(
      { error: message },
      { status: 400, headers: extraHeaders }
    ),
  };
}
