import type { StudyFlashcard } from "@/lib/study-export-format";

function csvCell(value: string): string {
  const s = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** UTF-8 BOM helps Excel recognize UTF-8 for non-Latin text */
export function flashcardsToCsv(cards: StudyFlashcard[]): string {
  const header = `${csvCell("front")},${csvCell("back")}`;
  const lines = cards.map((c) => `${csvCell(c.front ?? "")},${csvCell(c.back ?? "")}`);
  return `\ufeff${header}\n${lines.join("\n")}\n`;
}
