// Splits text into masked characters for staggered entrance animations.
export default function Split({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`split ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, wi, words) => (
        <span key={wi} className="split-word" aria-hidden>
          {Array.from(word).map((ch, ci) => (
            <span key={ci} className="split-char" style={{ "--i": wi * 4 + ci } as React.CSSProperties}>
              {ch}
            </span>
          ))}
          {wi < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}
