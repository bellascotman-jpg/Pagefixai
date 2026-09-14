# Audit engine

The audit pipeline is deliberately evidence-first:

`URL validation → browser rendering → extraction → deterministic rules → evidence → findings → prioritization → optional AI interpretation → QA → report`

## Security

The target URL must use HTTP(S), must not contain credentials, and is resolved before browser acquisition. Loopback, private, link-local, cloud metadata and internal hosts are blocked. Redirect handling must preserve these controls.

## Evidence

Evidence types are stored in the database and linked to findings. AI is not allowed to introduce an unsupported observation or evidence ID.

## Browser evidence

Desktop and mobile rendering captures visible text, headings, buttons, links, forms, images, metadata, canonical, JSON-LD and observable price/availability patterns. The browser must never submit an order or payment.

## Limitations

An audit cannot determine actual conversion rate, revenue impact, traffic quality, intent, checkout abandonment, margin or LTV unless analytics are connected.
