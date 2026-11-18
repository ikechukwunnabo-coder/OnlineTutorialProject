import { describe, expect, it } from "vitest";

import {
  ApiError,
  fieldErrors,
  isNetworkError,
  isNotFound,
  parseApiError,
} from "./errors";

describe("API error helpers", () => {
  it("parses the API error envelope", () => {
    const error = parseApiError(422, {
      error: {
        code: "validation_error",
        message: "Some fields need attention.",
        details: { email: ["Enter a valid email address."] },
        request_id: "req-123",
      },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_error");
    expect(error.message).toBe("Some fields need attention.");
    expect(error.requestId).toBe("req-123");
    expect(fieldErrors(error)).toEqual({ email: "Enter a valid email address." });
  });

  it("falls back to a safe message for unknown bodies", () => {
    expect(parseApiError(500, {}).message).toBe(
      "The service is temporarily unavailable. Please try again.",
    );
    expect(parseApiError(400, null).message).toBe("The request could not be completed.");
  });

  it("recognizes not-found and network errors", () => {
    const notFound = new ApiError("Missing", { status: 404, code: "not_found" });
    const network = new ApiError("Offline", { status: 0, code: "network_error" });

    expect(isNotFound(notFound)).toBe(true);
    expect(isNotFound(network)).toBe(false);
    expect(isNetworkError(network)).toBe(true);
  });

  it("extracts string and array field errors only", () => {
    const error = new ApiError("Bad input", {
      status: 400,
      details: {
        name: ["Name is required."],
        subject: "Subject is required.",
        ignored: [{ nested: true }],
      },
    });

    expect(fieldErrors(error)).toEqual({
      name: "Name is required.",
      subject: "Subject is required.",
    });
  });
});
