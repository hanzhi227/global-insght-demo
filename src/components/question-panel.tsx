'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { askResponseSchema, categoryLabels, type AskResponse } from '@/contracts';
import { askQuestion, failureOf, type Failure } from './api-client';
import { CHAT_STORAGE_KEY, MAX_SAVED_CHATS, readChats, writeChats, type ChatTurn } from './chat-history';
import { Notice } from './notice';
import { DocumentMenu } from './document-menu';
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

const sampleQuestions = [
  { category: 'Safety', questions: [
    'How long is a C-12 isolation authorization valid, and what happens at expiry?',
    'How long must fire watch continue after hot work?'
  ] },
  { category: 'Maintenance', questions: [
    'What preventive maintenance inspections apply to conveyor C-12?',
    'What maximum pressure decay is allowed in the HP-4 pressure-hold test?'
  ] },
  { category: 'Quality', questions: [
    'How many brackets are sampled at AX-210 final inspection, and how many failures are accepted?',
    'What is the caliper calibration interval? Is there an overdue grace period?'
  ] },
  { category: 'Operations', questions: [
    'What information belongs in the production shift handover?',
    'How many AX-210 brackets may be in one production container, and may batches be mixed?'
  ] },
  { category: 'Across categories', questions: [
    'What final inspection sample does Quality require for AX-210, and what container capacity does Operations allow?'
  ] },
  { category: 'Missing evidence', questions: [
    'What is the lubrication interval for conveyor C-99?'
  ] }
];

export function QuestionPanel({ children }: { children?: ReactNode }) {
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
    if (inFlight.current || !window.confirm('Clear saved chats from this browser? This cannot be undone.')) return;
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
    <>
      <div className="brand-bar">
        <div className="container menu-bar">
          <Image src="/brand/insight-global-logo.png" alt="Insight Global" width={1176} height={303} priority className="brand-logo" />
          <nav aria-label="Main menu">
            <details className="sample-questions">
              <summary>Example questions</summary>
              <div className="example-menu">
                <p className="hint">Choose a question to fill the box, then select Ask.</p>
                {sampleQuestions.map((group) => (
                  <div key={group.category}>
                    <h3>{group.category}</h3>
                    <ul>
                      {group.questions.map((sample) => (
                        <li key={sample}>
                          <button type="button" className="button secondary" disabled={asking || !loaded} onClick={(event) => {
                            setQuestion(sample);
                            event.currentTarget.closest('details')?.removeAttribute('open');
                            document.getElementById('question')?.focus();
                          }}>{sample}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          </nav>
          <DocumentMenu>{children}</DocumentMenu>
        </div>
      </div>
      <header className="masthead">
        <div className="container">
          <h1>Plant documentation assistant</h1>
          <p className="lede">Ask about safety, maintenance, quality, or operations. Answers cite the relevant plant documents.</p>
        </div>
      </header>
      <main className="container">
        <p className="demo-notice" role="note">Demo only. Documents are fictional; answers are not approved for plant operations.</p>
        <div className="workspace">
    <section className="panel questions" aria-labelledby="question-title">
      <div className="chat-heading">
        <h2 id="question-title" className="panel-title">Questions and answers</h2>
        <button type="button" className="button secondary" onClick={clearHistory} disabled={!loaded || asking || (!turns.length && !storageWarning)}>Clear history</button>
      </div>
      <p className="hint">Last {MAX_SAVED_CHATS} chats saved in this browser only. Anyone using this browser can see them.</p>
      {storageWarning && <Notice tone="warn">{storageWarning}</Notice>}
      {!loaded && <p className="progress-line" role="status">Loading saved chats…</p>}
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
      {turns.length > 0 && (
        <>
          <ol className="chat-history" aria-label="Saved questions and answers, newest first">
            {[...turns].reverse().map((turn, index) => (
              <li key={turn.response.requestId} className="chat-turn">
                <p className="chat-question"><strong>You asked</strong>{turn.question}</p>
                <AnswerView response={turn.response} resultRef={phase.kind === 'answered' && index === 0 ? resultRef : undefined} />
              </li>
            ))}
          </ol>
          <p className="hint">Saved answers may be out of date. Each question is answered independently.</p>
        </>
      )}
    </section>
        </div>
      </main>
    </>
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
          <summary className="sources-title">
            <svg className="sources-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Sources used</span>
            <span className="sources-count">{response.citations.length} {response.citations.length === 1 ? 'excerpt' : 'excerpts'}</span>
          </summary>
          <ol className="passages" aria-label="Cited source excerpts">{response.citations.map((passage, index) => <SourcePassage key={passage.id} passage={passage} number={index + 1} />)}</ol>
        </details>
      )}
    </div>
  );
}
