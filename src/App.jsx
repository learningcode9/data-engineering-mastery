import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import Sidebar from './components/layout/Sidebar.jsx';
import TopHeader from './components/layout/TopHeader.jsx';
import RightRail from './components/layout/RightRail.jsx';
import { SummaryGrid, ContinueCard, PlanCard } from './components/sections/Dashboard.jsx';
import Roadmap from './components/sections/Roadmap.jsx';
import Topics from './components/sections/Topics.jsx';
import Projects from './components/sections/Projects.jsx';
import InterviewPrep from './components/sections/InterviewPrep.jsx';
import AILearning from './components/sections/AILearning.jsx';
import { ToastContainer } from './components/ui/Toast.jsx';
import { ScrollToTop } from './components/ui/ScrollToTop.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useSqlProgress } from './hooks/useSqlProgress.js';
import { useToast } from './hooks/useToast.js';
import { computeSearchResults } from './utils/searchUtils.js';
import { topics } from './data/topics.js';
import { checklist, projects } from './data/appData.js';

const App = memo(function App() {
  const [isDark, setIsDark]           = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const { toasts } = useToast();
  const [selectedTopicId, setSelectedTopicId] = useLocalStorage('dem-selected-topic', topics[0].id);
  const [lastOpenTopicId, setLastOpenTopicId] = useLocalStorage('dem-last-topic', topics[0].id);

  // Track the last non-null opened topic so Resume can reopen it
  useEffect(() => {
    if (selectedTopicId) setLastOpenTopicId(selectedTopicId);
  }, [selectedTopicId, setLastOpenTopicId]);

  const [completedTopics,  setCompletedTopics]  = useLocalStorage('dem-completed-topics', {});
  const [topicNotes,       setTopicNotes]       = useLocalStorage('dem-topic-notes', {});
  const [practiceProgress, setPracticeProgress] = useLocalStorage('dem-practice-progress', {});
  const [dailyPlan,        setDailyPlan]        = useLocalStorage(
    'dem-daily-plan',
    Object.fromEntries(checklist.map(c => [c.id, c.done]))
  );

  const completedCount = useMemo(
    () => topics.filter(t => completedTopics[t.id]).length,
    [completedTopics]
  );

  const sqlSections = useMemo(() => topics.find(t => t.id === 'sql')?.module?.sections, []);
  const sqlProgress = useSqlProgress(sqlSections, practiceProgress);

  const enrichedTopics = useMemo(() =>
    topics.map(t => t.id === 'sql' ? { ...t, progress: `${sqlProgress.percent}%` } : t),
    [sqlProgress.percent]
  );

  const searchResults = useMemo(
    () => computeSearchResults(searchTerm, { topics, projects }),
    [searchTerm]
  );

  const toggleComplete   = useCallback(id => setCompletedTopics(p => ({ ...p, [id]: !p[id] })), [setCompletedTopics]);
  const updateNotes      = useCallback((id, text) => setTopicNotes(p => ({ ...p, [id]: text })), [setTopicNotes]);
  const togglePlan       = useCallback(id => setDailyPlan(p => ({ ...p, [id]: !p[id] })), [setDailyPlan]);
  const togglePractice   = useCallback(id => setPracticeProgress(p => ({ ...p, [id]: !p[id] })), [setPracticeProgress]);

  const [activeSection, setActiveSection] = useState('dashboard');
  const navigate = useCallback(section => {
    setActiveSection(section);
    setSidebarOpen(false);
  }, []);

  // Scroll to a specific sql-section element, opening the accordion if closed
  function scrollToSqlSection(idx) {
    const sectionEl = document.getElementById(`sql-section-${idx}`);
    if (!sectionEl) return;
    const trigger = sectionEl.querySelector('.accordion-trigger');
    const wasClosed = trigger?.getAttribute('aria-expanded') === 'false';
    if (wasClosed) trigger.click();
    setTimeout(() => {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, wasClosed ? 320 : 0);
  }

  const handleResume = useCallback(() => {
    const targetId = lastOpenTopicId || 'sql';
    setSelectedTopicId(targetId);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('topics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (targetId === 'sql') {
          setTimeout(() => scrollToSqlSection(sqlProgress.nextSectionIndex), 380);
        }
      });
    });
  }, [lastOpenTopicId, sqlProgress.nextSectionIndex, setSelectedTopicId]);

  const handleSearchResultClick = useCallback(result => {
    setSearchTerm('');

    if (result.type === 'topic') {
      setSelectedTopicId(result.topicId);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById('topics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    } else if (result.type === 'section') {
      setSelectedTopicId('sql');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById('topics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => scrollToSqlSection(result.sectionIdx), 380);
        });
      });
    } else if (result.type === 'interview') {
      document.getElementById('interview-prep')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (result.type === 'project') {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [setSelectedTopicId]);

  return (
    <div className={`app-shell${isDark ? ' dark-mode' : ''}`}>
      <ToastContainer toasts={toasts} />
      <ScrollToTop />
      <Sidebar
        isOpen={sidebarOpen}
        activeSection={activeSection}
        onClose={() => setSidebarOpen(false)}
        onNavigate={navigate}
      />
      <main className="main-content">
        <TopHeader
          isDark={isDark}
          onMenuClick={() => setSidebarOpen(true)}
          onSearchChange={setSearchTerm}
          onThemeToggle={() => setIsDark(d => !d)}
          searchTerm={searchTerm}
          searchResults={searchResults}
          onResultClick={handleSearchResultClick}
        />

        <SummaryGrid completedCount={completedCount} totalTopics={topics.length} />

        <div className="dashboard-grid">
          <div className="primary-column">
            <div className="learning-row">
              <ContinueCard sqlProgress={sqlProgress} onResume={handleResume} />
              <PlanCard checkedItems={dailyPlan} onTogglePlan={togglePlan} />
            </div>

            <Roadmap onNavigate={navigate} />

            <Topics
              topics={enrichedTopics}
              selectedTopicId={selectedTopicId}
              onSelectTopic={setSelectedTopicId}
              completedTopics={completedTopics}
              notes={topicNotes}
              onNotesChange={updateNotes}
              onToggleComplete={toggleComplete}
              searchTerm={searchTerm}
              practiceProgress={practiceProgress}
              onTogglePractice={togglePractice}
            />

            <div className="lower-grid">
              <Projects />
              <InterviewPrep />
            </div>

            <AILearning />
          </div>

          <RightRail onNavigate={navigate} />
        </div>
      </main>
    </div>
  );
});

export default App;
