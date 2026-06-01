import { memo, useMemo, useState } from 'react';
import { AppCard, Badge, SectionHeader, StatPill } from '../ui/design-system.jsx';
import { storyBuilderItems } from '../../data/storyBuilder.js';

function StoryLineList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="rsb-line-list" role="list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>
          <span className="rsb-dot" aria-hidden="true">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StarBlock({ label, text }) {
  return (
    <div className="rsb-star-block">
      <p className="rsb-star-label">{label}</p>
      <p className="rsb-star-text">{text}</p>
    </div>
  );
}

const PREVIEW_LIMIT = 3;

const ResumeStoryBuilder = memo(function ResumeStoryBuilder({
  previewOnly = false,
  onOpenStoryBuilder,
}) {
  const [activeId, setActiveId] = useState(storyBuilderItems[0]?.id ?? '');

  const activeStory = useMemo(
    () => storyBuilderItems.find(item => item.id === activeId) ?? storyBuilderItems[0] ?? null,
    [activeId]
  );

  if (previewOnly) {
    return (
      <section className="resume-story-section section" id="resume-story-builder">
        <AppCard className="rsb-preview-compact">
          <div className="rsb-preview-compact-top">
            <div>
              <p className="eyebrow" style={{ marginBottom: 6 }}>Career translation</p>
              <h3>Resume & Interview Story Builder</h3>
              <p className="rsb-preview-compact-copy">
                Turn completed projects and labs into resume bullets, STAR stories, and interview-ready explanations.
              </p>
            </div>
            <Badge variant="accent">Story layer</Badge>
          </div>

          <div className="rsb-summary-row rsb-summary-row--compact">
            <StatPill label="Resume examples" value={storyBuilderItems.length} icon="▣" variant="success" />
            <StatPill label="STAR stories" value={storyBuilderItems.length} icon="★" variant="info" />
            <StatPill label="Senior wording" value={storyBuilderItems.length} icon="▤" variant="accent" />
          </div>

          <div className="rsb-preview-chip-row" aria-label="Story categories">
            {storyBuilderItems.slice(0, PREVIEW_LIMIT).map(item => (
              <button
                key={item.id}
                type="button"
                className={`rsb-preview-chip${item.id === activeStory?.id ? ' rsb-preview-chip--active' : ''}`}
                onClick={() => setActiveId(item.id)}
                aria-pressed={item.id === activeStory?.id}
              >
                <strong>{item.title}</strong>
                <span>{item.badge}</span>
              </button>
            ))}
          </div>

          <div className="rsb-preview-mini">
            <span className="rsb-preview-mini-label">Selected story</span>
            <strong>{activeStory?.title ?? 'Story'}</strong>
            <p>{activeStory?.resumeBullets?.[0] ?? 'Keep the wording honest, outcome-focused, and easy to explain in an interview.'}</p>
          </div>

          <div className="rsb-preview-compact-actions">
            <button
              type="button"
              className="rsb-workspace-btn"
              onClick={() => onOpenStoryBuilder?.()}
            >
              Open Story Builder →
            </button>
          </div>
        </AppCard>
      </section>
    );
  }

  return (
    <section className="resume-story-section section" id="resume-story-builder">
      <SectionHeader
        eyebrow="Career translation"
        title="Resume & Interview Story Builder"
        description="Turn completed projects and labs into resume bullets, STAR stories, and interview-ready explanations."
        badge={<Badge variant="accent">Story layer</Badge>}
      />

      <div className="rsb-summary-row">
        <StatPill label="Resume examples" value={storyBuilderItems.length} icon="▣" variant="success" />
        <StatPill label="STAR stories" value={storyBuilderItems.length} icon="★" variant="info" />
        <StatPill label="Senior wording" value={storyBuilderItems.length} icon="▤" variant="accent" />
      </div>

      <div className="rsb-workspace">
        <div className="rsb-layout">
          <div className="rsb-list-column">
            {storyBuilderItems.map(item => {
              const active = item.id === activeStory?.id;
              return (
                <AppCard
                  key={item.id}
                  as="button"
                  type="button"
                  interactive
                  compact
                  className={`rsb-item${active ? ' rsb-item--active' : ''}`}
                  onClick={() => setActiveId(item.id)}
                  aria-pressed={active}
                >
                  <div className="rsb-item-top">
                    <div>
                      <p className="rsb-item-title">{item.title}</p>
                      <p className="rsb-item-summary">{item.summary}</p>
                    </div>
                    <Badge variant={active ? 'success' : 'muted'}>{item.badge}</Badge>
                  </div>
                  <div className="rsb-item-bottom">
                    <span>{item.resumeBullets.length} resume bullets</span>
                    <span>{item.interviewNotes.length} interview notes</span>
                  </div>
                </AppCard>
              );
            })}
          </div>

          <AppCard className="rsb-detail-card">
            <div className="rsb-detail-header">
              <div>
                <p className="eyebrow" style={{ marginBottom: 8 }}>Selected story</p>
                <h3>{activeStory?.title}</h3>
              </div>
              <Badge variant="accent">{activeStory?.badge ?? 'Story'}</Badge>
            </div>

            <div className="rsb-detail-section">
              <p className="rsb-section-label">Resume bullet examples</p>
              <StoryLineList items={activeStory?.resumeBullets} />
            </div>

            <div className="rsb-detail-section">
              <p className="rsb-section-label">STAR format</p>
              <div className="rsb-star-grid">
                <StarBlock label="Situation" text={activeStory?.star?.situation} />
                <StarBlock label="Task" text={activeStory?.star?.task} />
                <StarBlock label="Action" text={activeStory?.star?.action} />
                <StarBlock label="Result" text={activeStory?.star?.result} />
              </div>
            </div>

            <div className="rsb-detail-columns">
              <div className="rsb-detail-section">
                <p className="rsb-section-label">Project explanation template</p>
                <p className="rsb-detail-copy">{activeStory?.projectTemplate}</p>
              </div>
              <div className="rsb-detail-section">
                <p className="rsb-section-label">How to explain this in interview</p>
                <p className="rsb-detail-copy">{activeStory?.explanation}</p>
              </div>
            </div>

            <div className="rsb-detail-columns">
              <div className="rsb-detail-section">
                <p className="rsb-section-label">Senior wording suggestions</p>
                <div className="rsb-chip-row">
                  {activeStory?.seniorWording?.map(word => (
                    <Badge key={word} variant="info">{word}</Badge>
                  ))}
                </div>
              </div>
              <div className="rsb-detail-section">
                <p className="rsb-section-label">Interview notes</p>
                <StoryLineList items={activeStory?.interviewNotes} />
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </section>
  );
});

export default ResumeStoryBuilder;
