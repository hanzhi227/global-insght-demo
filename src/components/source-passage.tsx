import { categoryLabels, type Passage } from '@/contracts';

export function SourcePassage({ passage, number }: { passage: Passage; number: number }) {
  const lines = passage.excerpt.split('\n');
  const span = passage.startLine === passage.endLine ? `Line ${passage.startLine}` : `Lines ${passage.startLine}–${passage.endLine}`;
  return (
    <li className="passage">
      <header className="passage-head">
        <a
          className="passage-link"
          href={`/demo/${passage.category}/${encodeURIComponent(passage.documentName)}`}
          download={passage.documentName}
        >
          <span className="visually-hidden">Download </span>
          <span className="passage-number">Source {number}</span>
          <span className="passage-info">
            <span className="passage-name">{passage.documentName}</span>
            <span className="passage-meta">{categoryLabels[passage.category]} · {span}</span>
          </span>
          <svg className="passage-download" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
          </svg>
        </a>
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
