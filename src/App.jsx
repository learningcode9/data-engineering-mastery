import { useState, useMemo, useCallback, useEffect, memo, lazy, Suspense } from 'react';
import Sidebar from './components/layout/Sidebar.jsx';
import TopHeader from './components/layout/TopHeader.jsx';
import RightRail from './components/layout/RightRail.jsx';
import { SummaryGrid, ContinueCard, PlanCard, SmartBanner } from './components/sections/Dashboard.jsx';
import Topics from './components/sections/Topics.jsx';
import AchievementToast from './components/ui/AchievementToast.jsx';
import { ToastContainer } from './components/ui/Toast.jsx';
import { useAchievements } from './hooks/useAchievements.js';
import { ScrollToTop } from './components/ui/ScrollToTop.jsx';
import { ScrollProgress } from './components/ui/ScrollProgress.jsx';
import { MobileBottomNav } from './components/ui/MobileBottomNav.jsx';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useSqlProgress } from './hooks/useSqlProgress.js';
import { useToast } from './hooks/useToast.js';
import { useXP, XP_PER_TASK, XP_PER_TOPIC } from './hooks/useXP.js';
import { useStreak } from './hooks/useStreak.js';
import { computeSearchResults } from './utils/searchUtils.js';
import { topics } from './data/topics.js';
import { checklist } from './data/appData.js';
import { projectDetails } from './data/projectDetails.js';
import { toast } from './utils/toast.js';
import useSimulationStore from './store/simulationStore.js';
import useLearningStore from './store/learningStore.js';
import { SimulationHUD } from './components/ui/SimulationHUD.jsx';
import { InvestigationWorkspace } from './components/sections/InvestigationWorkspace.jsx';
import { CommandPalette } from './components/ui/CommandPalette.jsx';

const SQLLab = lazy(() => import('./components/sections/SQLLab.jsx'));
const RoadmapTracks = lazy(() => import('./components/sections/RoadmapTracks.jsx'));
const Projects = lazy(() => import('./components/sections/Projects.jsx'));
const InterviewPrep = lazy(() => import('./components/sections/InterviewPrep.jsx'));
const AILearning = lazy(() => import('./components/sections/AILearning.jsx'));
const ArchDiagrams = lazy(() => import('./components/sections/ArchDiagrams.jsx'));
const DatabricksNB = lazy(() => import('./components/sections/DatabricksNB.jsx'));
const Analytics = lazy(() => import('./components/sections/Analytics.jsx'));
const Scenarios = lazy(() => import('./components/sections/Scenarios.jsx'));
const FloatingCoach = lazy(() => import('./components/ui/FloatingCoach.jsx'));
const EnterpriseSimulator = lazy(() => import('./components/sections/EnterpriseSimulator.jsx').then(m => ({ default: m.EnterpriseSimulator })));
const SkillGraph = lazy(() => import('./components/sections/SkillGraph.jsx').then(m => ({ default: m.SkillGraph })));
const IncidentSimulator = lazy(() => import('./components/sections/IncidentSimulator.jsx').then(m => ({ default: m.IncidentSimulator })));
const InterviewWarRoom = lazy(() => import('./components/sections/InterviewWarRoom.jsx').then(m => ({ default: m.InterviewWarRoom })));
const DailyStandup = lazy(() => import('./components/sections/DailyStandup.jsx').then(m => ({ default: m.DailyStandup })));

function SectionFallback() {
  return (
    <section className="section section-loading" aria-label="Loading section">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line skeleton-line--short" />
    </section>
  );
}

const App = memo(function App() {
  const [isDark, setIsDark]                   = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [sidebarCompact, setSidebarCompact]   = useLocalStorage('dem-sidebar-compact', false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [engineeringMode, setEngineeringMode] = useLocalStorage('dem-engineering-mode', false);
  const { toasts } = useToast();
  const { xp, level, addXP } = useXP();
  const { streak, recordActivity } = useStreak();
  const { check: checkAchievements, pendingAchievement, shiftQueue, unlockedCount: unlockedAchCount } = useAchievements();

  const [selectedTopicId, setSelectedTopicId] = useLocalStorage('dem-selected-topic', topics[0].id);
  const [lastOpenTopicId, setLastOpenTopicId] = useLocalStorage('dem-last-topic', topics[0].id);

  const completedTopics = useLearningStore(s => s.completedTopics);
  const setCompletedTopics = useLearningStore(s => s.setCompletedTopics);
  const [topicNotes,       setTopicNotes]       = useLocalStorage('dem-topic-notes', {});
  const [practiceProgress, setPracticeProgress] = useLocalStorage('dem-practice-progress', {});
  const dailyPlan = useLearningStore(s => s.dailyTasks);
  const setDailyPlan = useLearningStore(s => s.setDailyTasks);
  const [activityLog,      setActivityLog]      = useLocalStorage('dem-activity-log', []);
  const [learnedSet]                           = useLocalStorage('dem-interview-learned', {});

  useEffect(() => {
    if (Object.keys(dailyPlan ?? {}).length > 0) return;
    setDailyPlan(Object.fromEntries(checklist.map(c => [c.id, c.done])));
  }, [dailyPlan, setDailyPlan]);

  // Track last-opened topic for resume.
  useEffect(() => {
    if (!selectedTopicId) return;
    setLastOpenTopicId(selectedTopicId);
  }, [selectedTopicId, setLastOpenTopicId]);

  const completedCount = useMemo(
    () => topics.filter(t => completedTopics[t.id]).length,
    [completedTopics]
  );

  const sqlSections = useMemo(() => topics.find(t => t.id === 'sql')?.module?.sections, []);
  const sqlProgress = useSqlProgress(sqlSections, practiceProgress);

  // Generic progress for all topics
  const allTopicsProgress = useMemo(() => {
    const result = {};
    for (const t of topics) {
      const sections = t.module?.sections ?? [];
      const practisable = sections.filter(s => s.subtopics.some(st => st.practice));
      if (practisable.length === 0) { result[t.id] = 0; continue; }
      const done = practisable.filter(s =>
        s.subtopics.filter(st => st.practice).every(st => !!practiceProgress?.[st.id])
      ).length;
      result[t.id] = Math.round((done / practisable.length) * 100);
    }
    return result;
  }, [practiceProgress]);

  const inProgressCount = useMemo(
    () => topics.filter(t => (allTopicsProgress[t.id] ?? 0) > 0 && !completedTopics[t.id]).length,
    [allTopicsProgress, completedTopics]
  );

  const enrichedTopics = useMemo(() =>
    topics.map(t => ({
      ...t,
      progress:   `${allTopicsProgress[t.id] ?? 0}%`,
      completed:  !!completedTopics[t.id],
      inProgress: (allTopicsProgress[t.id] ?? 0) > 0 && !completedTopics[t.id],
    })),
    [allTopicsProgress, completedTopics]
  );

  const searchResults = useMemo(
    () => computeSearchResults(searchTerm, { topics, projects: projectDetails }),
    [searchTerm]
  );

  // Achievement checks — run whenever key state changes
  useEffect(() => {
    const totalTasks = Object.values(practiceProgress ?? {}).filter(Boolean).length;
    const completedTopicsCount = Object.values(completedTopics).filter(Boolean).length;
    checkAchievements({
      totalTasks,
      streak,
      progress: allTopicsProgress,
      completedTopicsCount,
      learnedCount: Object.values(learnedSet).filter(Boolean).length,
      engineeringMode,
      isDark,
    });
  }, [practiceProgress, streak, allTopicsProgress, completedTopics, learnedSet, engineeringMode, isDark, checkAchievements]);

  const addToActivityLog = useCallback((text, type = 'default', xp = 0) => {
    setActivityLog(prev => [
      { text, type, xp, date: new Date().toISOString() },
      ...prev,
    ].slice(0, 20));
  }, [setActivityLog]);

  const toggleComplete = useCallback(id => {
    setCompletedTopics(p => {
      const wasComplete = p[id];
      if (!wasComplete) {
        addXP(XP_PER_TOPIC);
        recordActivity();
        const topicTitle = topics.find(t => t.id === id)?.title ?? id;
        addToActivityLog(`Finished topic: ${topicTitle}`, 'topic', XP_PER_TOPIC);
        toast(`Topic complete! +${XP_PER_TOPIC} XP`, 'success');
      }
      return { ...p, [id]: !p[id] };
    });
  }, [setCompletedTopics, addXP, recordActivity, addToActivityLog]);

  const updateNotes    = useCallback((id, text) => setTopicNotes(p => ({ ...p, [id]: text })), [setTopicNotes]);
  const togglePlan     = useCallback(id => setDailyPlan(p => ({ ...p, [id]: !p[id] })), [setDailyPlan]);

  const togglePractice = useCallback((id, title) => {
    const isCurrentlyDone = !!practiceProgress[id];
    if (!isCurrentlyDone) {
      addXP(XP_PER_TASK);
      recordActivity();
      addToActivityLog(
        title ? `Completed: ${title}` : 'Completed a practice task',
        'practice',
        XP_PER_TASK
      );
    }
    setPracticeProgress(p => ({ ...p, [id]: !p[id] }));
  }, [practiceProgress, setPracticeProgress, addXP, recordActivity, addToActivityLog]);

  // Command palette
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Global simulation tick — escalates unresolved incidents every 30s
  const tickIncidents   = useSimulationStore(s => s.tickIncidents);
  const investigatingId = useSimulationStore(s => s.investigatingIncidentId);
  const openInvestigation = useSimulationStore(s => s.openInvestigation);
  const activeSimIncidents = useSimulationStore(s => s.activeIncidents);

  useEffect(() => {
    const id = setInterval(tickIncidents, 30_000);
    return () => clearInterval(id);
  }, [tickIncidents]);

  const [activeSection, setActiveSection] = useState('dashboard');

  // Scroll-based active section detection — uses actual DOM element IDs
  useEffect(() => {
    const SECTION_IDS = [
      'topics', 'roadmap', 'projects', 'architecture',
      'enterprise', 'skill-graph', 'incidents', 'war-room', 'standup',
      'databricks', 'interview-prep', 'analytics', 'ai-learning',
    ];
    const targets = SECTION_IDS.map(id => document.getElementById(id)).filter(Boolean);
    if (!targets.length) return;

    const obs = new IntersectionObserver(entries => {
      let topmost = null;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!topmost || entry.boundingClientRect.top < topmost.boundingClientRect.top) {
            topmost = entry;
          }
        }
      }
      if (topmost) setActiveSection(topmost.target.id);
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });

    targets.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const navigate = useCallback(section => {
    setActiveSection(section);
    setSidebarOpen(false);
    if (section !== 'dashboard') {
      setTimeout(() => {
        document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  function scrollToTopicSection(topicId, idx) {
    const sectionEl = document.getElementById(`${topicId}-section-${idx}`);
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
          setTimeout(() => scrollToTopicSection('sql', sqlProgress.nextSectionIndex), 380);
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
      const tid = result.topicId ?? 'sql';
      setSelectedTopicId(tid);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById('topics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => scrollToTopicSection(tid, result.sectionIdx), 380);
        });
      });
    } else if (result.type === 'interview') {
      document.getElementById('interview-prep')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (result.type === 'project') {
      document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [setSelectedTopicId]);

  return (
    <div className={`app-shell${isDark ? ' dark-mode' : ''}${engineeringMode ? ' engineering-mode' : ''}${sidebarCompact ? ' sidebar-compact' : ''}`}>
      <ScrollProgress />
      <ToastContainer toasts={toasts} />
      <ScrollToTop />
      <Sidebar
        isOpen={sidebarOpen}
        activeSection={activeSection}
        onClose={() => setSidebarOpen(false)}
        onNavigate={navigate}
        compact={sidebarCompact}
        onToggleCompact={() => setSidebarCompact(c => !c)}
      />
      {/* Global overlays — outside main to cover everything */}
      {investigatingId && <InvestigationWorkspace />}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
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
          xp={xp}
          level={level}
          streak={streak}
          onNavigate={navigate}
          engineeringMode={engineeringMode}
          onToggleEngineeringMode={() => setEngineeringMode(m => !m)}
          unlockedAchCount={unlockedAchCount}
          onOpenCmdPalette={() => setCmdPaletteOpen(true)}
          activityLog={activityLog}
        />

        <SimulationHUD
          onOpenIncidents={() => navigate('incidents')}
          onOpenInvestigation={() => {
            const first = activeSimIncidents[0];
            if (first) openInvestigation(first.uid);
          }}
        />
        <SmartBanner allTopicsProgress={allTopicsProgress} streak={streak} onNavigate={navigate} />
        <SummaryGrid completedCount={completedCount} totalTopics={topics.length} inProgressCount={inProgressCount} />

        <div className="dashboard-grid">
          <div className="primary-column">

            {/* 1. Continue Learning + Daily Plan */}
            <div className="learning-row">
              <ContinueCard sqlProgress={sqlProgress} onResume={handleResume} />
              <PlanCard checkedItems={dailyPlan} onTogglePlan={togglePlan} />
            </div>

            {/* 2. Learning Topics */}
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

            <Suspense fallback={<SectionFallback />}>
              {/* 3. Roadmap Tracks */}
              <RoadmapTracks />

              {/* 4. Architecture Diagrams */}
              <ArchDiagrams />

              {/* 5. Enterprise Simulation */}
              <EnterpriseSimulator />

              {/* 6. Skill Dependency Graph */}
              <SkillGraph onNavigate={navigate} />

              {/* 6. Production Incident Simulator */}
              <IncidentSimulator />

              {/* 7. Interview War Room */}
              <InterviewWarRoom />

              {/* 8. Daily Engineering Standup */}
              <DailyStandup />

              {/* 9. Projects */}
              <Projects />

              {/* 6. SQL Lab */}
              <SQLLab />

              {/* 6b. Databricks Notebook Simulator */}
              <DatabricksNB />

              {/* 7. Interview Prep */}
              <InterviewPrep />

              {/* 8. Day in the Life Scenarios */}
              <Scenarios />

              {/* 9. Analytics Dashboard */}
              <Analytics
                topics={enrichedTopics}
                progress={allTopicsProgress}
                practiceProgress={practiceProgress}
                activityLog={activityLog}
                xp={xp}
                streak={streak}
                learnedCount={Object.values(learnedSet).filter(Boolean).length}
              />

              {/* 10. AI Coach */}
              <AILearning />
            </Suspense>
          </div>

          <RightRail onNavigate={navigate} />
        </div>
      </main>

      <Suspense fallback={null}>
        <FloatingCoach activeSection={activeSection} engineeringMode={engineeringMode} />
      </Suspense>
      {pendingAchievement && (
        <AchievementToast achievement={pendingAchievement} onDismiss={shiftQueue} />
      )}
      <MobileBottomNav activeSection={activeSection} onNavigate={navigate} />
    </div>
  );
});

export default App;
