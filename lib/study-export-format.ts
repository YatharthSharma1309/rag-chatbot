export interface StudyFlashcard {
  front: string;
  back: string;
}

export function buildStudyPackMarkdown(params: {
  sourceTitle: string;
  outline: string;
  flashcards: StudyFlashcard[];
}): string {
  const trimmedOutline = params.outline.trim() || "_No outline generated._";
  const cards = params.flashcards.filter((c) => c.front?.trim() || c.back?.trim());

  const flashBlocks =
    cards.length === 0
      ? "_No flashcards generated._"
      : cards
          .map((c, i) => {
            const front = (c.front ?? "").trim();
            const back = (c.back ?? "").trim();
            return `### Card ${i + 1}\n\n**Front:** ${front}\n\n**Back:** ${back}`;
          })
          .join("\n\n---\n\n");

  return `# Study pack\n\n_Source:_ ${params.sourceTitle}\n\n---\n\n## Outline\n\n${trimmedOutline}\n\n---\n\n## Flashcards\n\n${flashBlocks}\n`;
}
