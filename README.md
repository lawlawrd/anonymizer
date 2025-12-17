# Anonymizer

Browser-based tool for redacting sensitive text with [Microsoft Presidio](https://github.com/microsoft/presidio). The app ships an Express server that proxies to Presidio's analyzer/anonymizer services and serves a React UI where you can paste rich text, pick NER models, tune thresholds, and review or export anonymized results.

## Features
- Paste or edit rich text and anonymize it via Presidio with a single click.
- Choose the NER model (English and Dutch available by default) and filter by entity types.
- Tune confidence thresholds, add allow/deny lists, and toggle individual findings.
- Switch between light/dark themes, copy redacted text or HTML, and save runs for quick recall (saved runs live in server memory; presets are stored in your browser).

## Requirements
- Node.js 18+ (for native `fetch` and ES modules).
- Running Presidio services:
  - Analyzer: defaults to `http://localhost:5002`
  - Anonymizer: defaults to `http://localhost:5001`

## Setup
```bash
# Install dependencies
npm install

# Build production assets (CSS + JS bundle)
npm run build
```

## Running the app
```bash
# Start the server on port 9628 by default
npm start

# Or develop with file watching (Sass, Webpack, nodemon)
npm run dev
```
Then open http://localhost:9628/ in your browser.

## Configuration
Environment variables:
- `PORT` – port for the Express server (default `9628`).
- `PRESIDIO_ANALYZER_URL` – URL of the Presidio analyzer service (default `http://localhost:5002`).
- `PRESIDIO_ANONYMIZER_URL` – URL of the Presidio anonymizer service (default `http://localhost:5001`).

## Using the UI
1. Paste or type text into the editor. Formatting is preserved for the HTML export.
2. Pick a NER model and (optionally) filter entity types.
3. Adjust confidence threshold or add allow/deny lists to refine what is redacted.
4. Click **Anonymize**. Toggle findings on/off to refine the result.
5. Copy the anonymized plain text or HTML, or save the run for later recall.

Notes on storage:
- Saved anonymizations are held in server memory and clear when the server restarts.
- Presets (NER model, threshold, lists, entity type selection) are stored in browser `localStorage`.

## API (optional)
You can call the backend directly if you just need the proxy to Presidio:
```bash
curl -X POST http://localhost:9628/api/anonymize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "John Doe lives in Amsterdam.",
    "nerModel": "en_core_web_lg",
    "entityTypes": ["PERSON", "LOCATION"],
    "threshold": 0.5
  }'
```
The response includes `anonymizedText`, `items` from Presidio, and the filtered `entities` that were sent to the anonymizer.

## Scripts
- `npm run dev` – watch Sass, bundle JS, and restart the server on changes.
- `npm run build` – compile Sass and the production JS bundle.
- `npm start` – start the Express server (expects built assets in `public/`).
