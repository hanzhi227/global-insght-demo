import Image from 'next/image';
import { DocumentPanel } from '@/components/document-panel';
import { QuestionPanel } from '@/components/question-panel';

export default function Page() {
  return (
    <>
      <div className="brand-bar">
        <div className="container">
          <Image
            src="/brand/insight-global-logo.png"
            alt="Insight Global"
            width={1176}
            height={303}
            priority
            className="brand-logo"
          />
        </div>
      </div>

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
