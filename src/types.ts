export interface LlmsLink {
  label: string;
  url: string;
  description?: string;
}

export interface LlmsSection {
  title: string;
  description?: string;
  links: readonly LlmsLink[];
}

export interface LlmsDocument {
  name: string;
  summary: string;
  canonicalUrl: string;
  details?: readonly string[];
  contact?: string;
  profiles?: readonly LlmsLink[];
  sections?: readonly LlmsSection[];
  accuracyNotes?: readonly string[];
  lastUpdated?: string;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}
