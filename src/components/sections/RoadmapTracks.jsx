import { memo, useState } from 'react';
import { roadmapTracks } from '../../data/roadmaps.js';
import { getPhaseByTopicIds, getPhaseMentorship } from '../../data/careerGuidance.js';

function PhaseTimeline({ phases, trackProgress }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="rt-phases">
      {phases.map((phase, i) => {
        const isOpen = expanded === i;
        const isDone = (trackProgress?.[phase.id] ?? 0) >= 100;
        return (
          <div key={phase.id} className={`rt-phase${isDone ? ' rt-phase--done' : ''}`}>
            <button
              type="button"
              className="rt-phase-header"
              onClick={() => setExpanded(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <div className="rt-phase-left">
                <span className={`rt-phase-dot${isDone ? ' rt-phase-dot--done' : ''}`}>
                  {isDone ? '✓' : i + 1}
                </span>
                <div className="rt-phase-info">
                  <strong className="rt-phase-title">{phase.title}</strong>
                  <span className="rt-phase-duration">{phase.duration}</span>
                </div>
              </div>
              <div className="rt-phase-right">
                <span className="rt-phase-milestone-count">{phase.milestones.length} milestones</span>
                <span className="rt-phase-chevron">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="rt-phase-body">
                {(() => {
                  const mentor = getPhaseMentorship(getPhaseByTopicIds(phase.topicIds));
                  return (
                    <div className="rt-phase-mentor">
                      <div>
                        <span>Why this matters</span>
                        <p>{mentor.why}</p>
                      </div>
                      <div>
                        <span>Jobs require it</span>
                        <p>{mentor.jobs}</p>
                      </div>
                      <div>
                        <span>Used in companies for</span>
                        <p>{mentor.companiesUse}</p>
                      </div>
                      <div>
                        <span>Confidence milestone</span>
                        <p>{mentor.confidence}</p>
                      </div>
                    </div>
                  );
                })()}
                <p className="rt-phase-desc">{phase.description}</p>
                <div className="rt-phase-skills">
                  {phase.skills.map(s => (
                    <span key={s} className="rt-skill-chip">{s}</span>
                  ))}
                </div>
                <div className="rt-milestones">
                  <p className="rt-milestones-label">Milestones</p>
                  <ul>
                    {phase.milestones.map((m, j) => (
                      <li key={j} className="rt-milestone">
                        <span className="rt-milestone-check" aria-hidden="true">◎</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {i < phases.length - 1 && <div className="rt-phase-connector" />}
          </div>
        );
      })}
    </div>
  );
}

function TrackCard({ track, onSelect, isSelected }) {
  const difficulty = track.difficulty ?? 'All levels';
  const difficultyColor = {
    'Beginner → Intermediate': '#2f756e',
    'Beginner → Advanced': '#f59e0b',
    'Intermediate → Advanced': '#e25a1c',
    'Advanced': '#dc2626',
    'All levels': '#6b7cdb',
  }[difficulty] ?? '#687a76';

  return (
    <button
      type="button"
      className={`rt-track-card${isSelected ? ' rt-track-card--active' : ''}`}
      onClick={() => onSelect(track.id)}
      style={isSelected ? { borderColor: track.color, boxShadow: `0 0 0 2px ${track.color}30` } : {}}
    >
      <div className="rt-track-icon" style={{ background: `${track.color}18`, color: track.color }}>
        {track.icon}
      </div>
      <div className="rt-track-info">
        <strong className="rt-track-title">{track.title}</strong>
        <span className="rt-track-duration">{track.duration}</span>
      </div>
      <span className="rt-track-difficulty" style={{ color: difficultyColor }}>
        {difficulty.split(' → ').pop()}
      </span>
    </button>
  );
}

function TrackDetail({ track }) {
  const prerequisites = track.prerequisites ?? [];
  const skills = track.skills ?? [];

  return (
    <div className="rt-track-detail">
      <div className="rt-detail-header">
        <span className="rt-detail-icon" style={{ background: `${track.color}18` }}>{track.icon}</span>
        <div>
          <h3 className="rt-detail-title">{track.title}</h3>
          <p className="rt-detail-desc">{track.description}</p>
        </div>
      </div>

      <div className="rt-detail-meta">
        <div className="rt-meta-item">
          <span className="rt-meta-label">Duration</span>
          <span className="rt-meta-value">{track.duration}</span>
        </div>
        <div className="rt-meta-item">
          <span className="rt-meta-label">Level</span>
          <span className="rt-meta-value">{track.difficulty ?? 'All levels'}</span>
        </div>
        <div className="rt-meta-item">
          <span className="rt-meta-label">Phases</span>
          <span className="rt-meta-value">{track.phases.length}</span>
        </div>
      </div>

      {prerequisites.length > 0 && (
        <div className="rt-prerequisites">
          <span className="rt-prereq-label">Prerequisites</span>
          <div className="rt-prereq-chips">
            {prerequisites.map(p => (
              <span key={p} className="rt-prereq-chip">{p}</span>
            ))}
          </div>
        </div>
      )}

      <div className="rt-skills-row">
        <span className="rt-skills-label">Key skills</span>
        <div className="rt-skills-chips">
          {skills.map(s => (
            <span key={s} className="rt-skill-chip">{s}</span>
          ))}
        </div>
      </div>

      <PhaseTimeline phases={track.phases} />
    </div>
  );
}

const RoadmapTracks = memo(function RoadmapTracks() {
  const [selectedId, setSelectedId] = useState(roadmapTracks[0].id);
  const selectedTrack = roadmapTracks.find(t => t.id === selectedId);

  return (
    <section className="section" id="roadmap">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Career Tracks</p>
          <h2>Data Engineering Roadmaps</h2>
        </div>
        <span className="rt-track-count">{roadmapTracks.length} tracks</span>
      </div>
      <p className="rt-intro">
        Choose a specialisation track and follow the structured learning path with phases, milestones, and skill checklists.
      </p>

      <div className="rt-layout">
        <div className="rt-sidebar">
          {roadmapTracks.map(track => (
            <TrackCard
              key={track.id}
              track={track}
              onSelect={setSelectedId}
              isSelected={track.id === selectedId}
            />
          ))}
        </div>
        <div className="rt-main">
          {selectedTrack && <TrackDetail track={selectedTrack} />}
        </div>
      </div>
    </section>
  );
});

export default RoadmapTracks;
