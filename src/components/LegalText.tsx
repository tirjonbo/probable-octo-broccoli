/** Выводит текст из админки: пустая строка — новый абзац. Без HTML, поэтому безопасно. */
export function LegalText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} style={{ whiteSpace: "pre-line" }}>
            {para}
          </p>
        ))}
    </>
  );
}
