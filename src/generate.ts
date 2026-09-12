import type { LlmsDocument, LlmsLink } from "./types.js";
import { assertLlmsDocument } from "./validate.js";

const renderLink = ({ label, url, description }: LlmsLink): string =>
  `- [${label}](${url})${description ? `: ${description}` : ""}`;

export const generateLlmsTxt = (input: LlmsDocument): string => {
  const document = assertLlmsDocument(input);
  const lines: string[] = [
    `# ${document.name.trim()}`,
    "",
    `> ${document.summary.trim()}`,
    "",
    `Canonical: ${document.canonicalUrl}`,
  ];

  for (const detail of document.details ?? []) {
    lines.push("", detail.trim());
  }

  if (document.contact) lines.push("", `Contact: ${document.contact}`);
  if (document.lastUpdated)
    lines.push("", `Last updated: ${document.lastUpdated}`);

  if (document.profiles?.length) {
    lines.push(
      "",
      "## Official profiles",
      "",
      ...document.profiles.map(renderLink),
    );
  }

  for (const section of document.sections ?? []) {
    lines.push("", `## ${section.title.trim()}`, "");
    if (section.description) lines.push(section.description.trim(), "");
    lines.push(...section.links.map(renderLink));
  }

  if (document.accuracyNotes?.length) {
    lines.push("", "## Accuracy notes", "");
    lines.push(...document.accuracyNotes.map((note) => `- ${note.trim()}`));
  }

  return `${lines.join("\n")}\n`;
};
