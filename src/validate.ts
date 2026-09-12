import type {
  LlmsDocument,
  LlmsLink,
  ValidationIssue,
  ValidationResult,
} from "./types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

const requireSingleLine = (
  value: unknown,
  path: string,
  errors: ValidationIssue[],
): value is string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push({ path, message: "Must be a non-empty string." });
    return false;
  }

  if (/\r|\n/.test(value)) {
    errors.push({ path, message: "Must not contain line breaks." });
    return false;
  }

  return true;
};

const validateLink = (
  value: unknown,
  path: string,
  errors: ValidationIssue[],
): value is LlmsLink => {
  if (!isRecord(value)) {
    errors.push({ path, message: "Must be an object." });
    return false;
  }

  const labelValid = requireSingleLine(value.label, `${path}.label`, errors);
  const urlValid = requireSingleLine(value.url, `${path}.url`, errors);
  if (urlValid && !isHttpUrl(value.url as string)) {
    errors.push({ path: `${path}.url`, message: "Must be an HTTP(S) URL." });
  }

  if (value.description !== undefined) {
    requireSingleLine(value.description, `${path}.description`, errors);
  }

  return labelValid && urlValid && isHttpUrl(value.url as string);
};

export const validateLlmsDocument = (input: unknown): ValidationResult => {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: [{ path: "$", message: "Document must be an object." }],
      warnings,
    };
  }

  requireSingleLine(input.name, "name", errors);
  requireSingleLine(input.summary, "summary", errors);

  if (requireSingleLine(input.canonicalUrl, "canonicalUrl", errors)) {
    if (!isHttpUrl(input.canonicalUrl)) {
      errors.push({ path: "canonicalUrl", message: "Must be an HTTP(S) URL." });
    }
  }

  for (const field of ["details", "accuracyNotes"] as const) {
    const value = input[field];
    if (value !== undefined) {
      if (!Array.isArray(value)) {
        errors.push({ path: field, message: "Must be an array of strings." });
      } else {
        value.forEach((entry, index) =>
          requireSingleLine(entry, `${field}[${index}]`, errors),
        );
      }
    }
  }

  if (input.contact !== undefined) {
    requireSingleLine(input.contact, "contact", errors);
  }

  if (input.lastUpdated !== undefined) {
    if (requireSingleLine(input.lastUpdated, "lastUpdated", errors)) {
      const parsed = Date.parse(input.lastUpdated);
      if (Number.isNaN(parsed)) {
        errors.push({
          path: "lastUpdated",
          message: "Must be an ISO-compatible date.",
        });
      }
    }
  }

  if (input.profiles !== undefined) {
    if (!Array.isArray(input.profiles)) {
      errors.push({ path: "profiles", message: "Must be an array of links." });
    } else {
      input.profiles.forEach((link, index) =>
        validateLink(link, `profiles[${index}]`, errors),
      );
    }
  }

  if (input.sections !== undefined) {
    if (!Array.isArray(input.sections)) {
      errors.push({
        path: "sections",
        message: "Must be an array of sections.",
      });
    } else {
      input.sections.forEach((section, sectionIndex) => {
        const path = `sections[${sectionIndex}]`;
        if (!isRecord(section)) {
          errors.push({ path, message: "Must be an object." });
          return;
        }

        requireSingleLine(section.title, `${path}.title`, errors);
        if (section.description !== undefined) {
          requireSingleLine(section.description, `${path}.description`, errors);
        }
        if (!Array.isArray(section.links) || section.links.length === 0) {
          errors.push({
            path: `${path}.links`,
            message: "Must contain at least one link.",
          });
        } else {
          section.links.forEach((link, linkIndex) =>
            validateLink(link, `${path}.links[${linkIndex}]`, errors),
          );
        }
      });
    }
  }

  if (!Array.isArray(input.sections) || input.sections.length === 0) {
    warnings.push({
      path: "sections",
      message:
        "A useful llms.txt normally links to the most important content.",
    });
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const assertLlmsDocument = (input: unknown): LlmsDocument => {
  const result = validateLlmsDocument(input);
  if (!result.valid) {
    const details = result.errors
      .map(({ path, message }) => `${path}: ${message}`)
      .join("\n");
    throw new TypeError(`Invalid llms.txt document:\n${details}`);
  }

  return input as unknown as LlmsDocument;
};

export const validateLlmsText = (text: string): ValidationResult => {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!/^# [^#\n].+/m.test(normalized)) {
    errors.push({
      path: "text",
      message: 'Missing top-level "# Name" heading.',
    });
  }
  if (!/^> \S.+/m.test(normalized)) {
    errors.push({ path: "text", message: "Missing blockquote summary." });
  }
  if (!/^- \[[^\]]+\]\(https?:\/\/[^)]+\)/m.test(normalized)) {
    warnings.push({
      path: "text",
      message: "No HTTP(S) resource links were found.",
    });
  }

  return { valid: errors.length === 0, errors, warnings };
};
