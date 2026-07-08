// Text normalization shared by the guess input and answer matching.
// Strips accents/case/extra spaces so "Megane" and "megane" compare equal.

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
