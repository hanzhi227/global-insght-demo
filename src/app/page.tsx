import { DocumentPanel } from '@/components/document-panel';
import { QuestionPanel } from '@/components/question-panel';

export default function Page() {
  return (
    <>
      <header className="masthead">
        <div className="container">
          <h1>Plant documentation assistant</h1>
          <p className="lede">Ask about safety, maintenance, quality, or operations. Answers cite the relevant plant documents.</p>
        </div>
      </header>

      <main className="container">
        <p className="demo-notice" role="note">
          Demo only. Use fictional documents; answers are not approved for plant operations.
        </p>

        <div className="workspace">
          <DocumentPanel />
          <QuestionPanel />
        </div>
      </main>
    </>
  );
}
