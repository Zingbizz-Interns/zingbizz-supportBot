interface ErrorResponseBody {
  error?: string;
}

export function extractErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  return error instanceof Error ? error.message : fallback;
}

export async function fetchJsonOrThrow<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({}))) as ErrorResponseBody;

    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}
