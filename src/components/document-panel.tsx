'use client';

import { useCallback, useEffect, useState } from 'react';
import { categories, categoryLabels, type DocumentSummary } from '@/contracts';
import { failureOf, listDocuments, type Failure } from './api-client';
import { Notice } from './notice';

export function DocumentPanel() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [loadFailure, setLoadFailure] = useState<Failure | null>(null);

  const load = useCallback(async () => {
    setLoadFailure(null);
    try {
      const { documents: loaded } = await listDocuments();
      setDocuments(loaded);
    } catch (error) {
      setLoadFailure(failureOf(error));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="panel documents" aria-labelledby="documents-title">
      <h2 id="documents-title" className="panel-title">Plant documents</h2>
      <p className="hint">Managed by the demo operator. These documents are read-only.</p>
      {loadFailure ? (
        <Notice tone="danger" action={loadFailure.retryable ? (
          <button type="button" className="button secondary" onClick={() => void load()}>Try again</button>
        ) : null}>
          {loadFailure.message}
        </Notice>
      ) : documents === null ? (
        <p className="progress-line" role="status">Loading plant documents…</p>
      ) : (
        <>
          {documents.length === 0 && <p className="empty">Plant documents are not ready. Contact the demo operator.</p>}
          <ul className="board" aria-label="Plant documents by category">
            {categories.map((item) => {
              const inCategory = documents.filter((document) => document.category === item);
              return (
                <li key={item} className={`outline outline-${item}${inCategory.length === 0 ? ' is-empty' : ''}`}>
                  <h3 className="outline-title">{categoryLabels[item]}</h3>
                  {inCategory.length > 0 && (
                    <ul className="tools" aria-label={`${categoryLabels[item]} documents`}>
                      {inCategory.map((document) => (
                        <li key={document.id} className="tool">
                          <span className="tool-name">{document.name}</span>
                          <span className="tool-meta">{document.chunkCount} passages</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
