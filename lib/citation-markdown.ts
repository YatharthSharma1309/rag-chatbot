/**
 * Turn [#n] into markdown links (#cite-n) so ReactMarkdown can render citation buttons.
 * Skips fenced ``` blocks so citations inside examples stay literal.
 */
export function linkifyCitationsOutsideCode(markdown: string): string {
  const parts = markdown.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      return part.replace(/\[#(\d+)\]/g, "[$&](#cite-$1)");
    })
    .join("");
}
