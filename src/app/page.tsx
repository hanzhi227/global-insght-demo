import { QuestionPanel } from '@/components/question-panel';
import { categories, categoryLabels } from '@/contracts';
import { loadCorpus } from '@/server/corpus/source';

export default async function Page() {
  const documents = await loadCorpus();
  return (
    <QuestionPanel>
      <h2 className="panel-title">Source documents</h2>
      <p className="hint">All 12 fictional demo documents. Download Markdown files to read the full procedures.</p>
      {categories.map((category) => (
        <div key={category}>
          <h3>{categoryLabels[category]}</h3>
          <ul>
            {documents.filter((document) => document.category === category).map((document) => (
              <li key={document.name}>
                <a href={`/demo/${category}/${document.name}`} download={document.name}>
                  {document.text.split('\n')[0].replace(/^#\s+/, '')}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </QuestionPanel>
  );
}
