export function errorResponse(
  message: string,
  status: number,
  headers?: HeadersInit
) {
  return Response.json({ error: message }, { status, headers });
}

export function jsonResponse<T>(
  data: T,
  init: number | ResponseInit = 200,
  headers?: HeadersInit
) {
  if (typeof init === "number") {
    return Response.json(data, { status: init, headers });
  }

  return Response.json(data, init);
}
