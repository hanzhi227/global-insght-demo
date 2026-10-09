'use client';

import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { askResponseSchema, categoryLabels, type AskResponse } from '@/contracts';
import { askQuestion, failureOf, type Failure } from './api-client';
import { CHAT_STORAGE_KEY, MAX_SAVED_CHATS, readChats, writeChats, type ChatTurn } from './chat-history';
import { Notice } from './notice';
import { SourcePassage } from './source-passage';

type Phase =
  | { kind: 'idle' }
  | { kind: 'asking' }
  | { kind: 'answered' }
  | { kind: 'failed'; failure: Failure; question: string };

const statusLabels: Record<AskResponse['status'], string> = {
  answered: 'Answered', needs_clarification: 'Needs clarification', insufficient_evidence: 'Insufficient evidence', blocked: 'Blocked', out_of_scope: 'Out of scope'
};
const statusTones: Record<AskResponse['status'], 'neutral' | 'warn' | 'danger'> = {
  answered: 'neutral', needs_clarification: 'warn', insufficient_evidence: 'warn', blocked: 'danger', out_of_scope: 'neutral'
};

export function QuestionPanel() {
  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [canPersist, setCanPersist] = useState(true);
  const [storageWarning, setStorageWarning] = useState('');
  const inFlight = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const asking = phase.kind === 'asking';

  useEffect(() => {
    try { setTurns(readChats(window.localStorage)); }
    catch {
      setCanPersist(false);
      setStorageWarning('Saved chats could not be loaded. Clear history to reset it, or continue without saving.');
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (phase.kind === 'answered' || phase.kind === 'failed') resultRef.current?.focus();
  }, [phase]);

  async function ask(text: string) {
    if (inFlight.current || !loaded) return;
    inFlight.current = true;
    setPhase({ kind: 'asking' });
    try {
      const response = askResponseSchema.parse(await askQuestion(text));
      const next = [...turns, { question: text, savedAt: new Date().toISOString(), response }].slice(-MAX_SAVED_CHATS);
      setTurns(next);
      // shortcut: tabs save their own snapshots, add storage-event merging if concurrent-tab editing is needed.
      if (canPersist) {
        try { writeChats(window.localStorage, next); }
        catch {
          setCanPersist(false);
          setStorageWarning('Chats are visible here but could not be saved. Browser storage may be full or unavailable.');
        }
      }
      setQuestion('');
      setPhase({ kind: 'answered' });
    } catch (error) {
      setPhase({ kind: 'failed', failure: failureOf(error), question: text });
    } finally { inFlight.current = false; }
  }

  function clearHistory() {
    if (asking || !window.confirm('Clear saved chats from this browser? This cannot be undone.')) return;
    try {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
      setTurns([]); setCanPersist(true); setStorageWarning(''); setPhase({ kind: 'idle' });
    } catch { setStorageWarning('Saved chats could not be cleared. Check your browser storage settings.'); }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (text) void ask(text);
  }

  return (
    <section className="panel questions" aria-labelledby="question-title">
      <div className="chat-heading">
        <h2 id="question-title" className="panel-title">Questions and answers</h2>
        <button type="button" className="button secondary" onClick={clearHistory} disabled={!loaded || asking || (!turns.length && !storageWarning)}>Clear history</button>
      </div>
      <p className="hint">Last {MAX_SAVED_CHATS} chats saved in this browser only. Anyone using this browser can see them.</p>
      {storageWarning && <Notice tone="warn">{storageWarning}</Notice>}
      {!loaded && <p className="progress-line" role="status">Loading saved chats…</p>}
      {turns.length > 0 && (
        <ol className="chat-history" aria-label="Saved questions and answers">
          {turns.map((turn, index) => (
            <li key={turn.response.requestId} className="chat-turn">
              <p className="chat-question"><strong>You asked</strong>{turn.question}</p>
              <AnswerView response={turn.response} resultRef={index === turns.length - 1 ? resultRef : undefined} />
            </li>
          ))}
        </ol>
      )}
      <form className="ask" onSubmit={onSubmit}>
        <label htmlFor="question" className="field-label">What do you need to know?</label>
        <textarea id="question" name="question" rows={3} maxLength={1000} required disabled={asking || !loaded}
          placeholder="What checks are required before restarting conveyor C-12?" value={question} onChange={(event) => setQuestion(event.target.value)} />
        <div className="ask-actions">
          <button type="submit" className="button primary" disabled={asking || !loaded || !question.trim()}>Ask</button>
          <p className="progress-line" role="status">{asking ? 'Checking the question and finding relevant procedures…' : phase.kind === 'answered' ? 'Answer ready.' : ''}</p>
        </div>
        {asking && <div className="progress" aria-hidden="true" />}
      </form>
      {phase.kind === 'failed' && (
        <div className="result result-failed" ref={resultRef} tabIndex={-1}>
          <Notice tone="danger" action={phase.failure.retryable ? (
            <button type="button" className="button secondary" onClick={() => void ask(phase.question)}>Try again</button>
          ) : null}>{phase.failure.message}</Notice>
        </div>
      )}
      {turns.length > 0 && <p className="hint">Saved answers may be out of date. Each question is answered independently.</p>}
    </section>
  );
}

function AnswerView({ response, resultRef }: { response: AskResponse; resultRef?: RefObject<HTMLDivElement | null> }) {
  const tone = statusTones[response.status];
  return (
    <div className={`result result-${response.status}`} ref={resultRef} tabIndex={-1}>
      <div className="answer-head"><span className={`status status-${tone}`}>{statusLabels[response.status]}</span></div>
      <p className="answer-text">{response.answer}</p>
      {response.categories.length > 0 && (
        <div className="routed">
          <span className="routed-label">Routed to</span>
          <ul className="chips" aria-label="Categories searched">
            {response.categories.map((category) => <li key={category} className={`chip chip-${category}`}>{categoryLabels[category]}</li>)}
          </ul>
        </div>
      )}
      {response.citations.length > 0 && (
        <details className="sources">
          <summary className="sources-title">Sources used</summary>
          <ol className="passages">{response.citations.map((passage) => <SourcePassage key={passage.id} passage={passage} />)}</ol>
        </details>
      )}
    </div>
  );
}
