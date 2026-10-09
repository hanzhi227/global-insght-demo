import { categoryLabels, type Passage } from '@/contracts';

export function SourcePassage({ passage }: { passage: Passage }) {
  const lines = passage.excerpt.split('\n');
  const span = `Lines ${passage.startLine}–${passage.endLine}`;
  return (
    <li className="passage">
      <header className="passage-head">
        <span className="passage-name">{passage.documentName}</span>
        <span className="passage-meta">
          {categoryLabels[passage.category]} · {span}
        </span>
      </header>
      <div
        className="excerpt"
        role="region"
        tabIndex={0}
        aria-label={`Excerpt from ${passage.documentName}, ${span.toLowerCase()}`}
      >
        {lines.map((line, index) => (
          <div className="excerpt-row" key={index}>
            <span className="gutter" aria-hidden="true">
              {passage.startLine + index}
            </span>
            <span className="excerpt-text">{line}</span>
          </div>
        ))}
      </div>
    </li>
  );
}
