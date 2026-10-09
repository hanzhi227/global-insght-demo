'use client';

import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { categoryLabels, type AskResponse } from '@/contracts';
import { askQuestion, failureOf, type Failure } from './api-client';
import { Notice } from './notice';
import { SourcePassage } from './source-passage';

type Phase =
  | { kind: 'idle' }
  | { kind: 'asking' }
  | { kind: 'answered'; response: AskResponse }
  | { kind: 'failed'; failure: Failure };

const statusLabels: Record<AskResponse['status'], string> = {
  answered: 'Answered',
  needs_clarification: 'Needs clarification',
  insufficient_evidence: 'Insufficient evidence',
  blocked: 'Blocked',
  out_of_scope: 'Out of scope',
};

const statusTones: Record<AskResponse['status'], 'neutral' | 'warn' | 'danger'> = {
  answered: 'neutral',
  needs_clarification: 'warn',
  insufficient_evidence: 'warn',
  blocked: 'danger',
  out_of_scope: 'neutral',
};

export function QuestionPanel() {
  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const inFlight = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const asking = phase.kind === 'asking';

  // Move focus to the result once it arrives: the Ask button was disabled while
  // the request ran, and focus would otherwise fall back to the document body.
  useEffect(() => {
    if (phase.kind === 'answered' || phase.kind === 'failed') resultRef.current?.focus();
  }, [phase]);

  async function ask(text: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPhase({ kind: 'asking' });
    try {
      const response = await askQuestion(text);
      setPhase({ kind: 'answered', response });
    } catch (error) {
      setPhase({ kind: 'failed', failure: failureOf(error) });
    } finally {
      inFlight.current = false;
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    void ask(text);
  }

  return (
    <section className="panel questions" aria-labelledby="question-title">
      <h2 id="question-title" className="visually-hidden">
        Ask a question
      </h2>

      <form className="ask" onSubmit={onSubmit}>
        <label htmlFor="question" className="field-label">
          What do you need to know?
        </label>
        <textarea
          id="question"
          name="question"
          rows={3}
          maxLength={1000}
          required
          placeholder="What checks are required before restarting conveyor C-12?"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
        />
        <div className="ask-actions">
          <button type="submit" className="button primary" disabled={asking || !question.trim()}>
            Ask
          </button>
          <p className="progress-line" role="status">
            {asking ? 'Checking the question and finding relevant procedures…' : ''}
          </p>
        </div>
        {asking && <div className="progress" aria-hidden="true" />}
      </form>

      {phase.kind === 'failed' && (
        <div className="result result-failed" ref={resultRef} tabIndex={-1}>
          <Notice
            tone="danger"
            action={
              phase.failure.retryable ? (
                <button type="button" className="button secondary" onClick={() => void ask(question.trim())}>
                  Try again
                </button>
              ) : null
            }
          >
            {phase.failure.message}
          </Notice>
        </div>
      )}

      {phase.kind === 'answered' && (
        <AnswerView response={phase.response} resultRef={resultRef} />
      )}
    </section>
  );
}

function AnswerView({
  response,
  resultRef,
}: {
  response: AskResponse;
  resultRef: RefObject<HTMLDivElement | null>;
}) {
  const tone = statusTones[response.status];
  return (
    <div className={`result result-${response.status}`} ref={resultRef} tabIndex={-1}>
      <div className="answer-head">
        <span className={`status status-${tone}`}>{statusLabels[response.status]}</span>
      </div>

      <p className="answer-text">{response.answer}</p>

      {response.categories.length > 0 && (
        <div className="routed">
          <span className="routed-label">Routed to</span>
          <ul className="chips" aria-label="Categories searched">
            {response.categories.map((category) => (
              <li key={category} className={`chip chip-${category}`}>
                {categoryLabels[category]}
              </li>
            ))}
          </ul>
        </div>
      )}

      {response.citations.length > 0 && (
        <section className="sources" aria-labelledby="sources-title">
          <h3 id="sources-title" className="sources-title">
            Sources used
          </h3>
          <ol className="passages">
            {response.citations.map((passage) => (
              <SourcePassage key={passage.id} passage={passage} />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
