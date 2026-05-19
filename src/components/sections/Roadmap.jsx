import { memo, useCallback } from 'react';
import { RoadmapCard } from '../ui/Card.jsx';
import { roadmapCards } from '../../data/appData.js';

const CARD_SECTION_MAP = {
  'Foundations':        'topics',
  'Batch Pipelines':    'topics',
  'Cloud Data':         'topics',
  'Production Skills':  'interview-prep',
};

const Roadmap = memo(function Roadmap({ onNavigate }) {
  const scrollToSection = useCallback(sectionId => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <section className="section" id="roadmap">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Roadmap</p>
          <h2>Roadmap Overview</h2>
        </div>
        <a href="#topics" onClick={e => { e.preventDefault(); onNavigate('topics'); }}>
          View topics
        </a>
      </div>
      <div className="roadmap-grid">
        {roadmapCards.map(card => (
          <RoadmapCard
            key={card.title}
            {...card}
            onClick={() => scrollToSection(CARD_SECTION_MAP[card.title] ?? 'topics')}
          />
        ))}
      </div>
    </section>
  );
});

export default Roadmap;
