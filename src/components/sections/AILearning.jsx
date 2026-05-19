import { memo } from 'react';

const AILearning = memo(function AILearning() {
  return (
    <section className="section ai-card" id="ai-learning">
      <div>
        <p className="eyebrow">AI Learning</p>
        <h2>AI study coach</h2>
        <p>
          Generate practice data, summarize concepts, and turn notes into focused review questions.
        </p>
      </div>
      <button type="button">Open coach</button>
    </section>
  );
});

export default AILearning;
