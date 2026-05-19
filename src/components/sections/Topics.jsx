import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TopicCard } from '../ui/Card.jsx';
import TopicDetails from './TopicDetails.jsx';

function matchesSubtopic(st, lc) {
  return (
    st.id?.toLowerCase().includes(lc) ||
    st.title?.toLowerCase().includes(lc) ||
    st.explanation?.toLowerCase().includes(lc) ||
    st.why?.toLowerCase().includes(lc) ||
    st.syntax?.toLowerCase().includes(lc) ||
    st.example?.toLowerCase().includes(lc) ||
    st.expectedOutput?.toLowerCase().includes(lc) ||
    st.practice?.toLowerCase().includes(lc) ||
    st.hint?.toLowerCase().includes(lc) ||
    st.solution?.toLowerCase().includes(lc) ||
    st.interview?.question?.toLowerCase().includes(lc) ||
    st.interview?.answer?.toLowerCase().includes(lc)
  );
}

function matchesTopic(topic, q) {
  if (!q) return true;
  const lc = q.toLowerCase();
  if (
    topic.title.toLowerCase().includes(lc) ||
    topic.body.toLowerCase().includes(lc) ||
    topic.category.toLowerCase().includes(lc)
  ) return true;

  // Search quick Q&A
  if (topic.questions?.some(q => q.question?.toLowerCase().includes(lc) || q.answer?.toLowerCase().includes(lc))) return true;

  // Deep search: sections and subtopics
  if (topic.module?.sections) {
    for (const section of topic.module.sections) {
      if (section.title.toLowerCase().includes(lc)) return true;
      for (const st of section.subtopics) {
        if (matchesSubtopic(st, lc)) return true;
      }
    }
  }
  return false;
}

const Topics = memo(function Topics({
  topics,
  selectedTopicId,
  onSelectTopic,
  completedTopics,
  notes,
  onNotesChange,
  onToggleComplete,
  searchTerm,
  practiceProgress,
  onTogglePractice,
}) {
  const filtered = useMemo(
    () => topics.filter(t => matchesTopic(t, searchTerm)),
    [topics, searchTerm]
  );

  const selectedTopic = useMemo(
    () => topics.find(t => t.id === selectedTopicId),
    [topics, selectedTopicId]
  );

  const detailsRef  = useRef(null);
  const sectionRef  = useRef(null);
  const closeTimer  = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleSelect = useCallback(id => {
    // Clear any in-flight close timer
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    if (id === selectedTopicId && !isClosing) {
      // Same topic clicked — animate close, then clear selection
      setIsClosing(true);
      closeTimer.current = setTimeout(() => {
        setIsClosing(false);
        onSelectTopic(null);
        closeTimer.current = null;
      }, 220);
      return;
    }

    // New topic or re-opening after close
    setIsClosing(false);
    onSelectTopic(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, [selectedTopicId, isClosing, onSelectTopic]);

  // Cleanup on unmount
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  // Auto-select first matching topic when search filters out the current selection
  useEffect(() => {
    if (!searchTerm) return;
    const inFiltered = filtered.some(t => t.id === selectedTopicId);
    if (!inFiltered && filtered.length > 0) {
      onSelectTopic(filtered[0].id);
    }
  }, [filtered, searchTerm, selectedTopicId, onSelectTopic]);

  // Scroll to this section when the user starts searching
  useEffect(() => {
    if (!searchTerm || !sectionRef.current) return;
    sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [searchTerm]);

  return (
    <section className="section" id="topics" ref={sectionRef}>
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Topics</p>
          <h2>Learning Topics</h2>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>
          {filtered.length} / {topics.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No topics match "{searchTerm}"</p>
        </div>
      ) : (
        <div className="topic-grid">
          {filtered.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              selected={topic.id === selectedTopicId}
              onClick={() => handleSelect(topic.id)}
            />
          ))}
        </div>
      )}

      {(selectedTopic || isClosing) && (
        <div
          ref={detailsRef}
          className={`topic-details-panel${isClosing ? ' topic-details-panel--closing' : ''}`}
        >
          <TopicDetails
            key={selectedTopicId}
            topic={selectedTopic}
            completed={!!completedTopics[selectedTopicId]}
            notes={notes[selectedTopicId]}
            onNotesChange={onNotesChange}
            onToggleComplete={onToggleComplete}
            searchTerm={searchTerm}
            practiceProgress={practiceProgress}
            onTogglePractice={onTogglePractice}
          />
        </div>
      )}
    </section>
  );
});

export default Topics;
