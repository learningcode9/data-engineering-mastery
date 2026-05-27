import { useState, useMemo, useCallback, useEffect, useRef, memo, lazy, Suspense } from 'react';
import Sidebar from './components/layout/Sidebar.jsx';
import TopHeader from './components/layout/TopHeader.jsx';
import RightRail from './components/layout/RightRail.jsx';
import {
  SummaryGrid, ContinueCard, SmartBanner, OnboardingCTA,
  JobReadinessChecklist, StartHereCard, DailyGoalCard,
  WeeklyProgress, NextActionCard, SectionPreviewGrid,
  DashboardHero, ProgressOverviewCard, TodaysFocusSimple, AchievementShelf,
  UpcomingMilestoneCard, MotivationCard, LearningConsistencyCard,
  CareerReadinessCard, QuickLinksCard,
} from './components/sections/Dashboard.jsx';
import Topics from './components/sections/Topics.jsx';
import LessonPage from './components/sections/LessonPage.jsx';
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
import { computeAllTopicStates, getNextRecommendedAction, computeOverallReadiness } from './utils/learningState.js';
import { computeLearningPathProgress } from './utils/learningPathProgress.js';
import { topics } from './data/topics.js';
import { checklist } from './data/appData.js';
import { projectDetails } from './data/projectDetails.js';
import { toast } from './utils/toast.js';
import useSimulationStore from './store/simulationStore.js';
import useLearningStore from './store/learningStore.js';
import { SimulationHUD } from './components/ui/SimulationHUD.jsx';
import { InvestigationWorkspace } from './components/sections/InvestigationWorkspace.jsx';
import { CommandPalette } from './components/ui/CommandPalette.jsx';
import { useUser } from './providers/UserProvider';
import { useSyncXP } from './hooks/useSyncXP.js';
import { syncPracticeTask, useHydrateFromSupabase } from './hooks/useSyncProgress.js';
import * as notesService from './services/supabase/notes';
import { useOnboarding } from './hooks/useOnboarding';
import { getRecommendation, DEFAULT_RECOMMENDATION } from './services/recommendations/recommendationEngine';

// ── Guide completions — module-level singleton ─────────────────────────────────
// Stored outside React state so there are zero stale-closure / StrictMode issues.
// A tick counter inside App forces re-renders when completions change.
const _gc = (() => {
  try { return JSON.parse(localStorage.getItem('dem-guide-completions') ?? '{}') ?? {}; }
  catch { return {}; }
})();
function _gcMark(id) {
  if (_gc[id]) return false;
  Object.assign(_gc, { [id]: true });
  try { localStorage.setItem('dem-guide-completions', JSON.stringify(_gc)); } catch {}
  return true;
}
function _gcGet() { return _gc; }

// ── Lazy-loaded page sections ──────────────────────────────────────────────────
const SQLLab            = lazy(() => import('./components/sections/SQLLab.jsx'));
const ResumeOutput      = lazy(() => import('./components/sections/ResumeOutput.jsx'));
const AuthPage          = lazy(() => import('./pages/AuthPage.tsx').then(m => ({ default: m.AuthPage })));
const OnboardingPage    = lazy(() => import('./pages/OnboardingPage.tsx').then(m => ({ default: m.OnboardingPage })));
const RoadmapTracks     = lazy(() => import('./components/sections/RoadmapTracks.jsx'));
const Projects          = lazy(() => import('./components/sections/Projects.jsx'));
const InterviewPrep     = lazy(() => import('./components/sections/InterviewPrep.jsx'));
const AILearning        = lazy(() => import('./components/sections/AILearning.jsx'));
const ArchDiagrams      = lazy(() => import('./components/sections/ArchDiagrams.jsx'));
const DatabricksNB      = lazy(() => import('./components/sections/DatabricksNB.jsx'));
const Analytics         = lazy(() => import('./components/sections/Analytics.jsx'));
const Scenarios         = lazy(() => import('./components/sections/Scenarios.jsx'));
const AICopilotPanel    = lazy(() => import('./components/ai/AICopilotPanel.tsx').then(m => ({ default: m.AICopilotPanel })));
const EnterpriseSimulator = lazy(() => import('./components/sections/EnterpriseSimulator.jsx').then(m => ({ default: m.EnterpriseSimulator })));
const SkillGraph        = lazy(() => import('./components/sections/SkillGraph.jsx').then(m => ({ default: m.SkillGraph })));
const IncidentSimulator = lazy(() => import('./components/sections/IncidentSimulator.jsx').then(m => ({ default: m.IncidentSimulator })));
const InterviewWarRoom  = lazy(() => import('./components/sections/InterviewWarRoom.jsx').then(m => ({ default: m.InterviewWarRoom })));
const DailyStandup      = lazy(() => import('./components/sections/DailyStandup.jsx').then(m => ({ default: m.DailyStandup })));

function PageFallback() {
  return (
    <div className="page-loading" aria-label="Loading page">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line skeleton-line--short" />
    </div>
  );
}

const App = memo(function App() {
  // ─── Auth + onboarding ────────────────────────────────────────────────────────
  const { userId, authPageOpen, onboardingPageOpen, closeOnboardingPage, openOnboardingPage } = useUser();
  useSyncXP();
  const { onboardingProfile, isCompleted: onboardingCompleted } = useOnboarding();

  // ─── UI state ─────────────────────────────────────────────────────────────────
  const [isDark, setIsDark]                   = useState(false);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [sidebarCompact, setSidebarCompact]   = useLocalStorage('dem-sidebar-compact', false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [engineeringMode, setEngineeringMode] = useLocalStorage('dem-engineering-mode', false);
  const [activePage, setActivePage]           = useLocalStorage('dem-active-page', 'dashboard');
  const [lessonContext, setLessonContext]      = useState(null);

  const { toasts }      = useToast();
  const { xp, level, addXP } = useXP();
  const { streak, recordActivity } = useStreak();
  const {
    check: checkAchievements,
    pendingAchievement,
    shiftQueue,
    unlockedCount: unlockedAchCount,
    unlockedList,
    totalCount: totalAchCount,
  } = useAchievements();

  // ─── Learning data ─────────────────────────────────────────────────────────────
  const [selectedTopicId, setSelectedTopicId] = useLocalStorage('dem-selected-topic', topics[0].id);
  const [lastOpenTopicId, setLastOpenTopicId] = useLocalStorage('dem-last-topic', topics[0].id);

  const completedTopics    = useLearningStore(s => s.completedTopics);
  const setCompletedTopics = useLearningStore(s => s.setCompletedTopics);
  useHydrateFromSupabase(userId, setCompletedTopics);

  // Tick counter — incremented each time a guide lesson is completed.
  // allCompletedTopics depends on this so it always reads the freshest _gcGet().
  const [guideTick, setGuideTick] = useState(0);

  const [topicNotes,       setTopicNotes]       = useLocalStorage('dem-topic-notes', {});
  const [practiceProgress, setPracticeProgress] = useLocalStorage('dem-practice-progress', {});
  const dailyPlan    = useLearningStore(s => s.dailyTasks);
  const setDailyPlan = useLearningStore(s => s.setDailyTasks);
  const [activityLog, setActivityLog] = useLocalStorage('dem-activity-log', []);
  const [learnedSet]                  = useLocalStorage('dem-interview-learned', {});

  useEffect(() => {
    if (Object.keys(dailyPlan ?? {}).length > 0) return;
    setDailyPlan(Object.fromEntries(checklist.map(c => [c.id, c.done])));
  }, [dailyPlan, setDailyPlan]);

  useEffect(() => {
    if (!selectedTopicId) return;
    setLastOpenTopicId(selectedTopicId);
  }, [selectedTopicId, setLastOpenTopicId]);

  // ─── Merged completion map ─────────────────────────────────────────────────────
  const allCompletedTopics = useMemo(
    () => ({ ...(completedTopics ?? {}), ..._gcGet() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedTopics, guideTick]
  );

  // ─── Derived data ──────────────────────────────────────────────────────────────
  const completedCount = useMemo(
    () => topics.filter(t => (completedTopics ?? {})[t.id]).length,
    [completedTopics]
  );

  const sqlSections = useMemo(() => topics.find(t => t.id === 'sql')?.module?.sections, []);
  const sqlProgress = useSqlProgress(sqlSections, practiceProgress);

  const allTopicsProgress = useMemo(() => {
    const result = {};
    for (const t of topics) {
      const sections    = t.module?.sections ?? [];
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
    () => topics.filter(t => (allTopicsProgress[t.id] ?? 0) > 0 && !(completedTopics ?? {})[t.id]).length,
    [allTopicsProgress, completedTopics]
  );

  const topicStates = useMemo(
    () => computeAllTopicStates(topics, completedTopics, practiceProgress),
    [completedTopics, practiceProgress]
  );

  const learningPathProgress = useMemo(
    () => computeLearningPathProgress({
      completedMap: allCompletedTopics,
      topicStates,
    }),
    [allCompletedTopics, topicStates]
  );

  const nextAction = useMemo(
    () => getNextRecommendedAction(topics, topicStates),
    [topicStates]
  );

  const overallReadiness = useMemo(
    () => computeOverallReadiness(topics, topicStates),
    [topicStates]
  );

  const personalizedRec = useMemo(
    () => onboardingProfile
      ? getRecommendation(onboardingProfile, allTopicsProgress)
      : DEFAULT_RECOMMENDATION,
    [onboardingProfile, allTopicsProgress]
  );

  const enrichedTopics = useMemo(() =>
    topics.map(t => ({
      ...t,
      progress:   `${allTopicsProgress[t.id] ?? 0}%`,
      completed:  !!(completedTopics ?? {})[t.id],
      inProgress: (allTopicsProgress[t.id] ?? 0) > 0 && !(completedTopics ?? {})[t.id],
      topicState: topicStates[t.id]?.state ?? 'available',
      masteryPct: topicStates[t.id]?.masteryPct ?? 0,
      prereqsMet: topicStates[t.id]?.prereqsMet ?? true,
    })),
    [allTopicsProgress, completedTopics, topicStates]
  );

  const searchResults = useMemo(
    () => computeSearchResults(searchTerm, { topics, projects: projectDetails }),
    [searchTerm]
  );

  // ─── Achievements ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const totalTasks          = Object.values(practiceProgress ?? {}).filter(Boolean).length;
    const completedTopicsCount = Object.values(completedTopics ?? {}).filter(Boolean).length;
    checkAchievements({
      totalTasks, streak,
      progress: allTopicsProgress,
      completedTopicsCount,
      learnedCount: Object.values(learnedSet ?? {}).filter(Boolean).length,
      engineeringMode, isDark,
    });
  }, [practiceProgress, streak, allTopicsProgress, completedTopics, learnedSet, engineeringMode, isDark, checkAchievements]);

  // ─── Event handlers ───────────────────────────────────────────────────────────
  const addToActivityLog = useCallback((text, type = 'default', xpAmt = 0) => {
    setActivityLog(prev => [
      { text, type, xp: xpAmt, date: new Date().toISOString() },
      ...prev,
    ].slice(0, 20));
  }, [setActivityLog]);

  const toggleComplete = useCallback(id => {
    const isTopic = !!topics.find(t => t.id === id);

    if (isTopic) {
      // Regular topic: two-way toggle via Zustand
      setCompletedTopics(p => {
        const safe = p ?? {};
        if (!safe[id]) {
          addXP(XP_PER_TOPIC);
          recordActivity();
          const title = topics.find(t => t.id === id)?.title ?? id;
          addToActivityLog(`Finished topic: ${title}`, 'topic', XP_PER_TOPIC);
          toast(`Topic complete! +${XP_PER_TOPIC} XP`, 'success');
        }
        return { ...safe, [id]: !safe[id] };
      });
    } else {
      // Guide lesson: mark via module-level singleton, then tick to force re-render.
      if (!_gcMark(id)) return; // already done
      setGuideTick(t => t + 1);
      addXP(XP_PER_TOPIC);
      recordActivity();
      addToActivityLog(`Finished lesson: ${id}`, 'lesson', XP_PER_TOPIC);
      toast(`Lesson complete! +${XP_PER_TOPIC} XP`, 'success');
    }
  }, [setCompletedTopics, setGuideTick, addXP, recordActivity, addToActivityLog, topics]);

  const notesSyncTimers = useRef({});
  const updateNotes = useCallback((id, text) => {
    setTopicNotes(p => ({ ...p, [id]: text }));
    clearTimeout(notesSyncTimers.current[id]);
    notesSyncTimers.current[id] = setTimeout(() => {
      notesService.saveNote(userId, id, 'main', text).catch(() => {});
    }, 800);
  }, [userId, setTopicNotes]);

  const togglePractice = useCallback((id, title) => {
    const isDone = !!(practiceProgress ?? {})[id];
    if (!isDone) {
      addXP(XP_PER_TASK);
      recordActivity();
      addToActivityLog(title ? `Completed: ${title}` : 'Completed a practice task', 'practice', XP_PER_TASK);
      syncPracticeTask(userId, id);
    }
    setPracticeProgress(p => ({ ...p, [id]: !p[id] }));
  }, [userId, practiceProgress, setPracticeProgress, addXP, recordActivity, addToActivityLog]);

  // ─── Page navigation ──────────────────────────────────────────────────────────
  // Page-based nav: switching page replaces the view, no scroll-to-section needed
  const navigate = useCallback(page => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleLessonOpen = useCallback(ctx => {
    setLessonContext(ctx);
    setActivePage('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setActivePage]);

  const handleResume = useCallback(() => {
    const targetId = lastOpenTopicId || 'sql';
    setSelectedTopicId(targetId);
    navigate('topics');
  }, [lastOpenTopicId, setSelectedTopicId, navigate]);

  const handleSearchResultClick = useCallback(result => {
    setSearchTerm('');
    if (result.type === 'topic') {
      setSelectedTopicId(result.topicId);
      navigate('topics');
    } else if (result.type === 'section') {
      setSelectedTopicId(result.topicId ?? 'sql');
      navigate('topics');
    } else if (result.type === 'interview') {
      navigate('interview-prep');
    } else if (result.type === 'project') {
      navigate('projects');
    }
  }, [setSelectedTopicId, navigate]);

  // ─── Simulation ───────────────────────────────────────────────────────────────
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const tickIncidents      = useSimulationStore(s => s.tickIncidents);
  const investigatingId    = useSimulationStore(s => s.investigatingIncidentId);
  const openInvestigation  = useSimulationStore(s => s.openInvestigation);
  const activeSimIncidents = useSimulationStore(s => s.activeIncidents);

  useEffect(() => {
    const id = setInterval(tickIncidents, 30_000);
    return () => clearInterval(id);
  }, [tickIncidents]);

  // ─── Global ⌘K / Ctrl+K → command palette (works on all pages) ───────────────
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setCmdPaletteOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ─── Shared header props ───────────────────────────────────────────────────────
  const headerProps = {
    activePage,
    isDark, onMenuClick: () => setSidebarOpen(true),
    onSearchChange: setSearchTerm, onThemeToggle: () => setIsDark(d => !d),
    searchTerm, searchResults, onResultClick: handleSearchResultClick,
    xp, level, streak, onNavigate: navigate,
    engineeringMode, onToggleEngineeringMode: () => setEngineeringMode(m => !m),
    unlockedAchCount, onOpenCmdPalette: () => setCmdPaletteOpen(true),
    activityLog,
  };

  // ─── Shared learning props ─────────────────────────────────────────────────────
  const learnedCount = Object.values(learnedSet ?? {}).filter(Boolean).length;

  return (
    <div className={`app-shell${isDark ? ' dark-mode' : ''}${engineeringMode ? ' engineering-mode' : ''}${sidebarCompact ? ' sidebar-compact' : ''}`}>
      <ScrollProgress />
      <ToastContainer toasts={toasts} />
      <ScrollToTop />

      <Sidebar
        isOpen={sidebarOpen}
        activeSection={activePage}
        onClose={() => setSidebarOpen(false)}
        onNavigate={navigate}
        compact={sidebarCompact}
        onToggleCompact={() => setSidebarCompact(c => !c)}
        learningPathProgress={learningPathProgress}
      />

      {investigatingId && <InvestigationWorkspace />}
      <CommandPalette isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} onNavigate={navigate} />

      <main className={`main-content${activePage !== 'dashboard' ? ' main-content--no-header' : ''}`}>
        <TopHeader {...headerProps} />
        <SimulationHUD
          onOpenIncidents={() => navigate('incidents')}
          onOpenInvestigation={() => { const f = activeSimIncidents[0]; if (f) openInvestigation(f.uid); }}
        />

        {/* ── DASHBOARD PAGE ─────────────────────────────────────────────── */}
        {activePage === 'dashboard' && (
          <div className="page page--dashboard">
            <SmartBanner
              allCompletedTopics={allCompletedTopics}
              topicStates={topicStates}
              topics={topics}
              streak={streak}
              onNavigate={navigate}
              personalizedRec={personalizedRec}
            />
            {!onboardingCompleted && <OnboardingCTA onOpen={openOnboardingPage} />}

            <div className="dash-layout">
              {/* ── Main column ── */}
              <div className="dash-main">
                <DashboardHero
                  sqlProgress={sqlProgress}
                  onResume={handleResume}
                  onNavigate={navigate}
                />
                <AchievementShelf
                  achievements={unlockedList}
                  totalCount={totalAchCount}
                />

                <div className="dash-row-2">
                  <ProgressOverviewCard
                    completedCount={completedCount}
                    totalTopics={topics.length}
                    inProgressCount={inProgressCount}
                    learnedCount={learnedCount}
                    practiceProgress={practiceProgress}
                    topicStates={topicStates}
                    topics={topics}
                    activityLog={activityLog}
                    streak={streak}
                    overallReadiness={overallReadiness}
                    onSelectTopic={id => {
                      if (id) {
                        setSelectedTopicId(id);
                        navigate('topics');
                      }
                    }}
                  />
                  <TodaysFocusSimple
                    enrichedTopics={enrichedTopics}
                    onNavigate={navigate}
                  />
                </div>

                <CareerReadinessCard
                  topicStates={topicStates}
                  completedTopics={completedTopics}
                  learnedCount={learnedCount}
                  overallReadiness={overallReadiness}
                  topics={topics}
                />

                <SectionPreviewGrid onNavigate={navigate} />
              </div>

              {/* ── Right sidebar ── */}
              <aside className="dash-sidebar">
                <MotivationCard />
                <UpcomingMilestoneCard sqlProgress={sqlProgress} onNavigate={navigate} />
                <LearningConsistencyCard activityLog={activityLog} />
                <QuickLinksCard onNavigate={navigate} />
              </aside>
            </div>
          </div>
        )}

        {/* ── LEARNING PATH PAGE ─────────────────────────────────────────── */}
        {activePage === 'topics' && (
          <div className="page page--learning-path">
            <Topics
              topics={enrichedTopics}
              topicStates={topicStates}
              completedTopics={allCompletedTopics}
              onLessonOpen={handleLessonOpen}
              onNavigate={navigate}
              searchTerm={searchTerm}
              currentLessonId={lessonContext?.lessonId}
            />
            <Suspense fallback={<PageFallback />}>
              <ResumeOutput />
            </Suspense>
          </div>
        )}

        {/* ── LESSON PAGE ────────────────────────────────────────────────── */}
        {activePage === 'lesson' && lessonContext && (
          <LessonPage
            key={lessonContext.lessonId}
            lessonContext={lessonContext}
            topics={enrichedTopics}
            completedTopics={allCompletedTopics}
            notes={topicNotes}
            onNotesChange={updateNotes}
            onToggleComplete={toggleComplete}
            practiceProgress={practiceProgress}
            onTogglePractice={togglePractice}
            onBack={() => navigate('topics')}
            onLessonOpen={handleLessonOpen}
          />
        )}

        {/* ── SQL LAB PAGE ───────────────────────────────────────────────── */}
        {activePage === 'sql-lab' && (
          <div className="page page--sql-lab">
            <Suspense fallback={<PageFallback />}>
              <SQLLab />
            </Suspense>
          </div>
        )}

        {/* ── PROJECTS PAGE ──────────────────────────────────────────────── */}
        {activePage === 'projects' && (
          <div className="page page--projects">
            <Suspense fallback={<PageFallback />}>
              <Projects />
            </Suspense>
          </div>
        )}

        {/* ── INTERVIEW PREP PAGE ────────────────────────────────────────── */}
        {activePage === 'interview-prep' && (
          <div className="page page--interview-prep">
            <Suspense fallback={<PageFallback />}>
              <InterviewPrep />
            </Suspense>
          </div>
        )}

        {/* ── ROADMAPS PAGE ──────────────────────────────────────────────── */}
        {activePage === 'roadmap' && (
          <div className="page page--roadmap">
            <Suspense fallback={<PageFallback />}>
              <RoadmapTracks />
              <ArchDiagrams />
            </Suspense>
          </div>
        )}

        {/* ── AI COACH PAGE ──────────────────────────────────────────────── */}
        {activePage === 'ai-learning' && (
          <div className="page page--ai-coach">
            <Suspense fallback={<PageFallback />}>
              <AILearning onNavigate={navigate} />
            </Suspense>
          </div>
        )}

        {/* ── LAB PAGES (accessible in both modes) ───────────────────────── */}
        {activePage === 'architecture' && (
          <div className="page"><Suspense fallback={<PageFallback />}><ArchDiagrams /></Suspense></div>
        )}
        {activePage === 'skill-graph' && (
          <div className="page"><Suspense fallback={<PageFallback />}><SkillGraph onNavigate={navigate} /></Suspense></div>
        )}
        {activePage === 'incidents' && (
          <div className="page"><Suspense fallback={<PageFallback />}><IncidentSimulator /></Suspense></div>
        )}
        {activePage === 'enterprise' && (
          <div className="page"><Suspense fallback={<PageFallback />}><EnterpriseSimulator /></Suspense></div>
        )}
        {activePage === 'war-room' && (
          <div className="page"><Suspense fallback={<PageFallback />}><InterviewWarRoom /></Suspense></div>
        )}
        {activePage === 'standup' && (
          <div className="page"><Suspense fallback={<PageFallback />}><DailyStandup /></Suspense></div>
        )}
        {activePage === 'databricks' && (
          <div className="page"><Suspense fallback={<PageFallback />}><DatabricksNB /></Suspense></div>
        )}
        {activePage === 'analytics' && (
          <div className="page">
            <Suspense fallback={<PageFallback />}>
              <Analytics
                topics={enrichedTopics} progress={allTopicsProgress}
                practiceProgress={practiceProgress} activityLog={activityLog}
                xp={xp} streak={streak} learnedCount={learnedCount}
              />
            </Suspense>
          </div>
        )}
        {activePage === 'scenarios' && (
          <div className="page"><Suspense fallback={<PageFallback />}><Scenarios /></Suspense></div>
        )}
      </main>

      <Suspense fallback={null}>
        <AICopilotPanel activeSection={activePage} engineeringMode={engineeringMode} />
      </Suspense>

      {pendingAchievement && <AchievementToast achievement={pendingAchievement} onDismiss={shiftQueue} />}
      <MobileBottomNav activeSection={activePage} onNavigate={navigate} />

      <Suspense fallback={null}>
        {authPageOpen && <AuthPage />}
      </Suspense>
      <Suspense fallback={null}>
        {onboardingPageOpen && (
          <OnboardingPage onComplete={closeOnboardingPage} onSkip={closeOnboardingPage} />
        )}
      </Suspense>
    </div>
  );
});

export default App;
