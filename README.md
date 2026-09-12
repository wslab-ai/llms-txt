# @wslab-ai/llms-txt

A small, dependency-free TypeScript library and CLI for generating and validating [`llms.txt`](https://llmstxt.org/) files from structured JSON.

It helps teams keep human-readable AI discovery metadata in source control without building strings by hand. It does not guarantee indexing or model citations.

## Install

```sh
npm install --save-dev @wslab-ai/llms-txt
```

## CLI

Create `llms.config.json`:

```json
{
  "name": "Example Studio",
  "summary": "A product engineering studio.",
  "canonicalUrl": "https://example.com/",
  "contact": "hello@example.com",
  "sections": [
    {
      "title": "Services",
      "links": [
        {
          "label": "Product engineering",
          "url": "https://example.com/services",
          "description": "Capabilities and operating model."
        }
      ]
    }
  ]
}
```

Generate or validate a file:

```sh
npx llms-txt generate llms.config.json --output static/llms.txt
npx llms-txt check static/llms.txt
npx llms-txt check-config llms.config.json
```

## Library

```ts
import { generateLlmsTxt, validateLlmsDocument } from "@wslab-ai/llms-txt";

const result = validateLlmsDocument(config);
if (!result.valid) throw new Error(JSON.stringify(result.errors));

const text = generateLlmsTxt(config);
```

The exported types cover documents, sections, links and validation results. URLs are restricted to HTTP(S), and heading-like fields must stay on one line so untrusted input cannot alter the document structure.

## Development

```sh
npm install
npm run verify
```

Requires Node.js 20 or newer. Licensed under MIT.
