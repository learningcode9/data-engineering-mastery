import { memo, useMemo, useState } from 'react';
import { curriculumPhaseGroups, getCurriculumTopicMeta } from '../../data/curriculum.js';

const TRACK_CONFIG = {
  core: {
    id: 'core',
    title: 'Core Azure Data Engineer Path',
    icon: '☁',
    color: '#0f766e',
    description: 'Mandatory phases for Senior Azure Data Engineer readiness in 2026.',
    badge: 'Core',
  },
  ai: {
    id: 'ai',
    title: 'AI for Data Engineers',
    icon: '◉',
    color: '#6b7cdb',
    description: 'A separate specialization track for LLM fundamentals, RAG, and AI-assisted data pipelines.',
    badge: 'AI specialization',
  },
  optional: {
    id: 'optional',
    title: 'Optional Technologies',
    icon: '◎',
    color: '#64748b',
    description: 'Adjacent tools to broaden your toolkit without changing the core Azure learning path.',
    badge: 'Optional',
  },
};

const TRACK_ORDER = ['core', 'ai', 'optional'];

function isCompletedTopic(topicStates, topicId) {
  const state = topicStates?.[topicId]?.state;
  return state === 'completed' || state === 'mastered';
}

function getPhaseProgress(phase, topicStates) {
  const topicIds = phase.topicIds ?? [];
  if (!topicIds.length) return 0;
  const completed = topicIds.filter(topicId => isCompletedTopic(topicStates, topicId)).length;
  return Math.round((completed / topicIds.length) * 100);
}

function buildTrack(trackType, topicStates) {
  const config = TRACK_CONFIG[trackType];
  const phaseSummaries = curriculumPhaseGroups[trackType] ?? [];
  const phases = phaseSummaries.map((phase, index) => {
    const topicMetas = (phase.topicIds ?? [])
      .map(topicId => getCurriculumTopicMeta(topicId))
      .filter(Boolean);

    return {
      ...phase,
      index: index + 1,
      topics: topicMetas,
      progress: getPhaseProgress(phase, topicStates),
      topicCount: topicMetas.length,
    };
  });

  const totalHours = phaseSummaries.reduce((sum, phase) => sum + (phase.estimatedHours ?? 0), 0);
  const totalTopics = phaseSummaries.reduce((sum, phase) => sum + (phase.topicIds?.length ?? 0), 0);
  const completedTopics = phaseSummaries.reduce(
    (sum, phase) => sum + (phase.topicIds ?? []).filter(topicId => isCompletedTopic(topicStates, topicId)).length,
    0
  );

  return {
    ...config,
    trackType,
    phases,
    phaseCount: phases.length,
    totalHours,
    totalTopics,
    completedTopics,
    progressPct: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
  };
}

function TrackCard({ track, onSelect, isSelected }) {
  return (
    <button
      type="button"
      className={`rt-track-card${isSelected ? ' rt-track-card--active' : ''}`}
      onClick={() => onSelect(track.trackType)}
      style={isSelected ? { borderColor: track.color, boxShadow: `0 0 0 2px ${track.color}30` } : {}}
    >
      <div className="rt-track-icon" style={{ background: `${track.color}18`, color: track.color }}>
        {track.icon}
      </div>
      <div className="rt-track-info">
        <strong className="rt-track-title">{track.title}</strong>
        <span className="rt-track-duration">{track.phaseCount} phases · {track.totalHours}h</span>
      </div>
      <span className="rt-track-difficulty" style={{ color: track.color }}>
        {track.progressPct}%
      </span>
    </button>
  );
}

function PhaseList({ phases, onPhaseOpen, onTopicOpen }) {
  return (
    <div className="rt-phases">
      {phases.map((phase, index) => (
        <div key={phase.id} className={`rt-phase${phase.progress >= 100 ? ' rt-phase--done' : ''}`}>
          <div className="rt-phase-header rt-phase-header--static">
            <button
              type="button"
              className="rt-phase-header-btn"
              onClick={() => onPhaseOpen(phase)}
            >
              <div className="rt-phase-left">
                <span className={`rt-phase-dot${phase.progress >= 100 ? ' rt-phase-dot--done' : ''}`}>
                  {phase.progress >= 100 ? '✓' : index + 1}
                </span>
                <div className="rt-phase-info">
                  <strong className="rt-phase-title">{phase.title}</strong>
                  <span className="rt-phase-duration">{phase.estimatedHours}h · {phase.topicCount} topics</span>
                </div>
              </div>
            </button>
            <div className="rt-phase-right">
              <span className="rt-phase-milestone-count">{phase.progress}%</span>
              <button
                type="button"
                className="rt-phase-open-btn"
                onClick={() => onPhaseOpen(phase)}
              >
                Open
              </button>
            </div>
          </div>

          <div className="rt-phase-body">
            <p className="rt-phase-desc">{phase.description}</p>
            <div className="rt-phase-mentor">
              <div>
                <span>Exit criteria</span>
                <p>{phase.exitCriteria}</p>
              </div>
              <div>
                <span>Prerequisites</span>
                <p>{(phase.prerequisites ?? []).join(' · ') || 'None'}</p>
              </div>
            </div>
            <div className="rt-skills-row">
              <span className="rt-skills-label">Topics</span>
              <div className="rt-skills-chips">
                {phase.topics.map(topic => (
                  <button
                    key={topic.id}
                    type="button"
                    className="rt-topic-chip"
                    onClick={() => onTopicOpen(topic, phase)}
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {index < phases.length - 1 && <div className="rt-phase-connector" />}
        </div>
      ))}
    </div>
  );
}

function TrackDetail({ track, onNavigate }) {
  const handlePhaseOpen = phase => {
    onNavigate?.('topics', {
      focusTarget: { type: 'phase', id: phase.id },
      clearSearch: true,
    });
  };

  const handleTopicOpen = (topic, phase) => {
    onNavigate?.('topics', {
      focusTarget: { type: 'topic', id: topic.id, phaseId: phase.id },
      clearSearch: true,
    });
  };

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
          <span className="rt-meta-value">{track.totalHours}h</span>
        </div>
        <div className="rt-meta-item">
          <span className="rt-meta-label">Phases</span>
          <span className="rt-meta-value">{track.phaseCount}</span>
        </div>
        <div className="rt-meta-item">
          <span className="rt-meta-label">Topics</span>
          <span className="rt-meta-value">{track.totalTopics}</span>
        </div>
        <div className="rt-meta-item">
          <span className="rt-meta-label">Complete</span>
          <span className="rt-meta-value">{track.progressPct}%</span>
        </div>
      </div>

      <div className="rt-detail-progress">
        <div className="progress-track">
          <div style={{ width: `${track.progressPct}%` }} />
        </div>
        <span className="rt-detail-progress-label">
          {track.completedTopics}/{track.totalTopics} topics complete
        </span>
      </div>

      <div className="rt-prerequisites">
        <span className="rt-prereq-label">Track type</span>
        <div className="rt-prereq-chips">
          <span className="rt-prereq-chip" style={{ color: track.color, borderColor: `${track.color}55`, background: `${track.color}12` }}>
            {track.badge}
          </span>
        </div>
      </div>

      <PhaseList
        phases={track.phases}
        onPhaseOpen={handlePhaseOpen}
        onTopicOpen={handleTopicOpen}
      />
    </div>
  );
}

const RoadmapTracks = memo(function RoadmapTracks({ topicStates = {}, onNavigate }) {
  const [selectedTrackType, setSelectedTrackType] = useState('core');

  const roadmapTracks = useMemo(
    () => TRACK_ORDER.map(trackType => buildTrack(trackType, topicStates)),
    [topicStates]
  );

  const selectedTrack = roadmapTracks.find(track => track.trackType === selectedTrackType) ?? roadmapTracks[0];

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
        Follow the same phase-based curriculum used by Learning Path so the roadmap and learning flow stay in sync.
      </p>

      <div className="rt-layout">
        <div className="rt-sidebar">
          {roadmapTracks.map(track => (
            <TrackCard
              key={track.trackType}
              track={track}
              onSelect={setSelectedTrackType}
              isSelected={track.trackType === selectedTrackType}
            />
          ))}
        </div>
        <div className="rt-main">
          {selectedTrack && (
            <TrackDetail
              track={selectedTrack}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </div>
    </section>
  );
});

export default RoadmapTracks;
