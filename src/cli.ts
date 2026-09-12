#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateLlmsTxt } from "./generate.js";
import {
  assertLlmsDocument,
  validateLlmsDocument,
  validateLlmsText,
} from "./validate.js";

const usage = `Usage:
  llms-txt generate <config.json> [--output llms.txt]
  llms-txt check <llms.txt>
  llms-txt check-config <config.json>`;

const report = (result: ReturnType<typeof validateLlmsDocument>): void => {
  for (const issue of result.errors)
    console.error(`error ${issue.path}: ${issue.message}`);
  for (const issue of result.warnings)
    console.warn(`warning ${issue.path}: ${issue.message}`);
};

const readUtf8 = (path: string): Promise<string> =>
  readFile(resolve(path), "utf8");

const main = async (): Promise<void> => {
  const [command, file, option, output] = process.argv.slice(2);
  if (!command || !file) throw new Error(usage);

  if (command === "generate") {
    const input: unknown = JSON.parse(await readUtf8(file));
    const validation = validateLlmsDocument(input);
    report(validation);
    if (!validation.valid) process.exitCode = 1;
    else {
      const generated = generateLlmsTxt(assertLlmsDocument(input));
      if (option === "--output" && output)
        await writeFile(resolve(output), generated, "utf8");
      else process.stdout.write(generated);
    }
    return;
  }

  if (command === "check-config") {
    const validation = validateLlmsDocument(
      JSON.parse(await readUtf8(file)) as unknown,
    );
    report(validation);
    if (!validation.valid) process.exitCode = 1;
    return;
  }

  if (command === "check") {
    const validation = validateLlmsText(await readUtf8(file));
    report(validation);
    if (!validation.valid) process.exitCode = 1;
    return;
  }

  throw new Error(usage);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
