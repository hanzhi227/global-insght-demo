'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { MAX_DOCUMENTS, categories, categoryLabels, type Category, type DocumentSummary } from '@/contracts';
import { failureOf, listDocuments, uploadDocument, type Failure } from './api-client';
import { Notice } from './notice';

export function DocumentPanel() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [loadFailure, setLoadFailure] = useState<Failure | null>(null);
  const [category, setCategory] = useState<Category | ''>('');
  const [uploading, setUploading] = useState(false);
  const [uploadFailure, setUploadFailure] = useState<Failure | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    setLoadFailure(null);
    try {
      const { documents: loaded } = await listDocuments();
      setDocuments(loaded);
    } catch (error) {
      setLoadFailure(failureOf(error));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !category || inFlight.current) return;
    inFlight.current = true;
    setUploading(true);
    setUploadFailure(null);
    try {
      const { document } = await uploadDocument(file, category);
      setDocuments((current) => [...(current ?? []), document]);
      formRef.current?.reset();
      setCategory('');
    } catch (error) {
      setUploadFailure(failureOf(error));
    } finally {
      inFlight.current = false;
      setUploading(false);
    }
  }

  const retryUpload = () => formRef.current?.requestSubmit();

  return (
    <section className="panel documents" aria-labelledby="documents-title">
      <h2 id="documents-title" className="panel-title">
        Plant documents
      </h2>

      <form ref={formRef} className="upload" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="document-file" className="field-label">
            Document
          </label>
          <input
            id="document-file"
            ref={fileRef}
            name="file"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            aria-describedby="upload-hint"
            required
            disabled={uploading}
          />
        </div>

        <div className="field">
          <label htmlFor="document-category" className="field-label">
            Category
          </label>
          <select
            id="document-category"
            name="category"
            required
            value={category}
            disabled={uploading}
            onChange={(event) => setCategory(event.target.value as Category | '')}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </select>
        </div>

        <p id="upload-hint" className="hint">
          {`TXT or Markdown · up to 1 MB per file · up to ${MAX_DOCUMENTS} documents`}
        </p>

        <button type="submit" className="button primary" disabled={uploading}>
          Upload and index
        </button>
      </form>

      <p className="progress-line" role="status">
        {uploading ? 'Indexing document…' : ''}
      </p>

      {uploadFailure && (
        <Notice
          tone="danger"
          action={
            uploadFailure.retryable ? (
              <button type="button" className="button secondary" onClick={retryUpload}>
                Try again
              </button>
            ) : null
          }
        >
          {uploadFailure.message}
        </Notice>
      )}

      {loadFailure ? (
        <Notice
          tone="danger"
          action={
            loadFailure.retryable ? (
              <button type="button" className="button secondary" onClick={() => void load()}>
                Try again
              </button>
            ) : null
          }
        >
          {loadFailure.message}
        </Notice>
      ) : documents === null ? (
        <ul className="doc-list doc-list-loading" aria-busy="true" aria-hidden="true">
          <li />
          <li />
        </ul>
      ) : documents.length === 0 ? (
        <p className="empty">Upload a document and choose its category to get started.</p>
      ) : (
        <ul className="doc-list" aria-label="Uploaded documents">
          {documents.map((document) => (
            <li key={document.id} className="doc">
              <span className="doc-name">{document.name}</span>
              <span className="doc-meta">
                <span className="chip">{categoryLabels[document.category]}</span>
                <span>{document.chunkCount} passages</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
