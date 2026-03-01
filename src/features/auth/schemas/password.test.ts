import { describe, it, expect } from "vitest";
import { passwordSchema, signupSchema, loginSchema } from "./password";

describe("passwordSchema", () => {
  it("rejects passwords shorter than 12 characters", () => {
    const result = passwordSchema.safeParse("Ab1!xxxxxxx"); // 11 chars
    expect(result.success).toBe(false);
  });

  it("rejects passwords longer than 128 characters", () => {
    const longPass = "Ab1!" + "x".repeat(125); // 129 chars
    const result = passwordSchema.safeParse(longPass);
    expect(result.success).toBe(false);
  });

  it("rejects passwords without lowercase", () => {
    const result = passwordSchema.safeParse("ABCDEFGH1234!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without uppercase", () => {
    const result = passwordSchema.safeParse("abcdefgh1234!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a number", () => {
    const result = passwordSchema.safeParse("Abcdefghijkl!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords without a special character", () => {
    const result = passwordSchema.safeParse("Abcdefghijk1");
    expect(result.success).toBe(false);
  });

  it("accepts a valid NIST-compliant password", () => {
    const result = passwordSchema.safeParse("MySecure#Pass1");
    expect(result.success).toBe(true);
  });

  it("accepts a long passphrase", () => {
    const result = passwordSchema.safeParse("This is a very long Passphrase with Numb3rs & $pecial!");
    expect(result.success).toBe(true);
  });
});

describe("signupSchema", () => {
  const validData = {
    name: "Test User",
    email: "test@example.com",
    password: "MySecure#Pass1",
    confirmPassword: "MySecure#Pass1",
  };

  it("accepts valid signup input", () => {
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      ...validData,
      confirmPassword: "DifferentPass1!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = signupSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "bad-email",
      password: "somepassword",
    });
    expect(result.success).toBe(false);
  });
});
