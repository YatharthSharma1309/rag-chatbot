const STUDY_EXPORT_PROMPT = `You are a study assistant. Given the document excerpts below, respond with ONLY valid JSON — no markdown fences, no commentary outside JSON:

{
  "outline": "A Markdown string using ## and ### headings plus bullet lists (- item). Reflect how the document is organized and main ideas. Ground every bullet in the excerpts — do not invent facts.",
  "flashcards": [
    {"front":"Question or term","back":"Short answer grounded in the excerpts"},
    ...
  ]
}

Rules:
- Produce 10–14 flashcards unless the excerpts are too thin (then fewer).
- Front should be a question, cloze-style prompt, or key term; back should be 1–3 sentences max.
- If excerpts lack usable content, use empty arrays/strings where appropriate and explain briefly in outline.`;

export { STUDY_EXPORT_PROMPT };
