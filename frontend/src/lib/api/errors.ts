export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
    request_id?: string;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId?: string;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      details?: unknown;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code ?? "api_error";
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

export function parseApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === "object" && "error" in body) {
    const envelope = (body as ApiErrorBody).error;
    if (envelope && typeof envelope === "object") {
      return new ApiError(envelope.message || "The request could not be completed.", {
        status,
        code: envelope.code,
        details: envelope.details,
        requestId: envelope.request_id,
      });
    }
  }

  return new ApiError(
    status >= 500
      ? "The service is temporarily unavailable. Please try again."
      : "The request could not be completed.",
    { status },
  );
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "network_error";
}

export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== "object") {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [field, value] of Object.entries(error.details as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      result[field] = value[0];
    } else if (typeof value === "string") {
      result[field] = value;
    }
  }
  return result;
}
