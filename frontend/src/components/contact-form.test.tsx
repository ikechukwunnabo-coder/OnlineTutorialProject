import { describe, expect, it } from "vitest";

import { contactSchema } from "./contact-form";

const validMessage = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  subject: "Question about loops",
  message: "I am stuck on the second example in the loops chapter.",
  website: "",
};

describe("contactSchema", () => {
  it("accepts a complete message", () => {
    expect(contactSchema.safeParse(validMessage).success).toBe(true);
  });

  it("rejects invalid email and short messages", () => {
    const result = contactSchema.safeParse({
      ...validMessage,
      email: "not-an-email",
      message: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.email?.[0]).toBe("Enter a valid email address.");
      expect(errors.message?.[0]).toBe("Add at least 10 characters so we can help.");
    }
  });

  it("trims whitespace before validating names and subjects", () => {
    const result = contactSchema.safeParse({
      ...validMessage,
      name: "   ",
      subject: "  ",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name?.[0]).toBe("Tell us your name.");
      expect(errors.subject?.[0]).toBe("Add a short subject.");
    }
  });
});
