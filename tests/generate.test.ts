import { describe, expect, it } from "vitest";
import {
  generateLlmsTxt,
  validateLlmsDocument,
  validateLlmsText,
} from "../src/index.js";

const example = {
  name: "Example Studio",
  summary: "A product engineering studio.",
  canonicalUrl: "https://example.com/",
  contact: "hello@example.com",
  sections: [
    {
      title: "Services",
      links: [
        {
          label: "Product engineering",
          url: "https://example.com/services",
          description: "Delivery capabilities and operating model.",
        },
      ],
    },
  ],
} as const;

describe("generateLlmsTxt", () => {
  it("renders a stable, readable document", () => {
    expect(generateLlmsTxt(example)).toContain(
      "- [Product engineering](https://example.com/services): Delivery capabilities",
    );
    expect(generateLlmsTxt(example).endsWith("\n")).toBe(true);
  });

  it("rejects malformed URLs", () => {
    const result = validateLlmsDocument({
      ...example,
      canonicalUrl: "javascript:alert(1)",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      path: "canonicalUrl",
      message: "Must be an HTTP(S) URL.",
    });
  });

  it("checks generated text", () => {
    expect(validateLlmsText(generateLlmsTxt(example))).toMatchObject({
      valid: true,
    });
  });
});
