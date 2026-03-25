import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, History, Settings as SettingsIcon, Timer as TimerIcon, BellRing, BookOpen, Layout, ChevronLeft, ChevronRight, Sparkles, FolderKanban, FileText, FlaskConical } from 'lucide-react';
import { TodayTab } from './components/TodayTab';
import { ProjectHubTab } from './components/ProjectHubTab';
import { HistoryTab } from './components/HistoryTab';
import { TimersTab } from './components/TimersTab';
import { JournalTab } from './components/JournalTab';
import { SettingsModal } from './components/SettingsModal';
import { GuestView } from './components/GuestView';
import { useHistory } from './hooks/useHistory';
import { useTimers } from './hooks/useTimers';
import { SessionState, HistorySession } from './types';
import { getDateKey, exportPDF, downloadJSON } from './utils';
import * as LZString from 'lz-string';

function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'hub' | 'timers' | 'journal' | 'history'>('today');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    history,
    projects,
    decisions,
    settings,
    saveSettings,
    addSession,
    updateSession,
    deleteSession,
    clearAllHistory,
    addProject,
    updateProject,
    deleteProject,
    addDecision,
    updateDecision,
    deleteDecision,
    getStorageUsed,
    isMigrating
  } = useHistory();
  const timers = useTimers();

  const [session, setSession] = useState<SessionState>({
    status: 'idle',
    checkInTime: null,
    checkOutTime: null,
    breaks: [],
    logs: [],
    projectId: null,
    dailyIntent: '',
    activeTask: '',
    reflections: { win: '', blocker: '' }
  });

  const [guestData, setGuestData] = useState<any>(null);
  const isShared = new URLSearchParams(window.location.search).get('share') === 'true';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get('view') === 'guest' || params.get('share') === 'true') && params.get('data')) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(params.get('data')!);
        if (decompressed) setGuestData(JSON.parse(decompressed));
      } catch (e) { /* silent */ }
    }
  }, []);

  useEffect(() => {
    const storedSession = localStorage.getItem('timelog_active');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed.checkInTime) {
          const sessionDate = getDateKey(new Date(parsed.checkInTime));
          const todayDate = getDateKey(new Date());
          if (sessionDate !== todayDate && parsed.status !== 'checked_out') {
            let earnedValue = 0;
            if (parsed.projectId) {
              const project = projects.find(p => p.id === parsed.projectId);
              if (project) {
                let totalBreakMs = parsed.breaks.reduce((acc: number, b: any) => acc + ((b.end || Date.now()) - b.start), 0);
                let totalSessionMs = parsed.checkInTime ? (Date.now() - parsed.checkInTime) : 0;
                let effectiveMs = Math.max(0, totalSessionMs - totalBreakMs);
                earnedValue = (effectiveMs / (1000 * 60 * 60)) * project.rate;
              }
            }
            const incompleteSession: HistorySession = {
              id: `session_${parsed.checkInTime}`,
              date: sessionDate,
              dateFormatted: new Date(parsed.checkInTime).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
              status: 'incomplete',
              checkInTime: parsed.checkInTime,
              checkOutTime: null,
              breaks: parsed.breaks,
              logs: parsed.logs,
              projectId: parsed.projectId,
              dailyIntent: parsed.dailyIntent,
              activeTask: parsed.activeTask,
              reflections: parsed.reflections,
              summary: { totalSession: 0, totalBreak: 0, effectiveHours: 0, breakCount: parsed.breaks.length, earnedValue }
            };
            addSession(incompleteSession);
            setSession({ status: 'idle', checkInTime: null, checkOutTime: null, breaks: [], logs: [], projectId: null, dailyIntent: '', activeTask: '', reflections: { win: '', blocker: '' } });
            localStorage.removeItem('timelog_active');
            return;
          }
        }
        setSession(parsed);
      } catch (e) { /* silent */ }
    }
  }, [projects]);

  useEffect(() => {
    if (session.status !== 'idle') {
      localStorage.setItem('timelog_active', JSON.stringify(session));
    } else {
      localStorage.removeItem('timelog_active');
    }
  }, [session]);

  const handleCheckOut = (completedSession: SessionState) => {
    const dateKey = getDateKey(new Date(completedSession.checkInTime || Date.now()));
    let totalBreakMs = completedSession.breaks.reduce((acc, b) => acc + ((b.end || Date.now()) - b.start), 0);
    let totalSessionMs = completedSession.checkInTime ? ((completedSession.checkOutTime || Date.now()) - completedSession.checkInTime) : 0;
    let effectiveMs = Math.max(0, totalSessionMs - totalBreakMs);
    let earnedValue = 0;
    if (completedSession.projectId) {
      const project = projects.find(p => p.id === completedSession.projectId);
      if (project) earnedValue = (effectiveMs / (1000 * 60 * 60)) * project.rate;
    }
    const historySession: HistorySession = {
      id: `session_${completedSession.checkInTime}`,
      date: dateKey,
      dateFormatted: new Date(completedSession.checkInTime || Date.now()).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'complete',
      checkInTime: completedSession.checkInTime,
      checkOutTime: completedSession.checkOutTime,
      breaks: completedSession.breaks,
      logs: completedSession.logs,
      projectId: completedSession.projectId,
      dailyIntent: completedSession.dailyIntent,
      activeTask: completedSession.activeTask,
      reflections: completedSession.reflections,
      summary: { totalSession: totalSessionMs, totalBreak: totalBreakMs, effectiveHours: effectiveMs, breakCount: completedSession.breaks.length, earnedValue }
    };
    addSession(historySession);
    if (settings.autoExport) exportPDF(historySession, dateKey, projects);
    setTimeout(() => {
      setSession({ status: 'idle', checkInTime: null, checkOutTime: null, breaks: [], logs: [], projectId: null, dailyIntent: '', activeTask: '', reflections: { win: '', blocker: '' } });
    }, 1500);
  };

  const handleDownloadAll = () => {
    downloadJSON({ metadata: { exportedAt: new Date().toISOString(), totalSessions: history.length, version: '4.0' }, sessions: history, projects, decisions }, 'timelog_all_data.json');
  };

  if (isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <Clock className="text-white" size={20} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (guestData) return <GuestView data={guestData} />;

  /* ── NAV ITEMS ─────────────────────────────────────────────── */
  const navItems = [
    { id: 'today'   as const, icon: Sparkles,    label: 'Today'    },
    { id: 'hub'     as const, icon: FolderKanban, label: 'Projects' },
    { id: 'history' as const, icon: History,      label: 'Ledger'   },
    { id: 'journal' as const, icon: FileText,     label: 'Growth'   },
    { id: 'timers'  as const, icon: TimerIcon,    label: 'Timers'   },
  ] as const;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────── */}
      {!isShared && (
        <motion.aside 
          className="hidden md:flex h-full shrink-0 flex-col"
          animate={{ width: sidebarCollapsed ? 72 : 260 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
        >
          {/* Header with logo */}
          <div className="flex items-center gap-2 px-3 py-4 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <motion.div 
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
              style={{ background: 'var(--color-accent)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Clock className="text-white" size={16} />
            </motion.div>
            {!sidebarCollapsed && (
              <motion.div 
                className="flex items-center justify-between flex-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-sm font-bold tracking-tight whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>Timelog</span>
                <motion.button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 rounded-lg transition-all"
                  title="Settings"
                  whileHover={{ scale: 1.1, background: 'var(--color-surface-low)' }}
                  whileTap={{ scale: 0.9 }}
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <SettingsIcon size={16} />
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Nav items with icons */}
          <nav className="flex-1 flex flex-col gap-0.5 px-2 py-2 overflow-y-auto">
            {navItems.map(({ id, icon: Icon, label }) => {
              const active = activeTab === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="w-full text-left rounded-lg text-sm font-medium transition-all flex items-center gap-3"
                  style={{
                    color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    background: active ? 'var(--color-accent-muted)' : 'transparent',
                    fontWeight: active ? 600 : 500,
                    padding: '10px 12px',
                  }}
                  whileHover={{ x: 2, background: 'var(--color-surface-low)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={{ scale: active ? 1.1 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon size={18} />
                  </motion.div>
                  {!sidebarCollapsed && (
                    <motion.span 
                      className="whitespace-nowrap"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                    >
                      {label}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Bottom: expand canvas */}
          <div className="px-2 pb-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <motion.button
              onClick={() => {
                const iframe = document.querySelector('iframe');
                if (iframe?.requestFullscreen) iframe.requestFullscreen();
              }}
              className="w-full text-left rounded-lg text-sm font-medium transition-all flex items-center gap-3"
              style={{ color: 'var(--color-text-muted)', padding: '10px 12px' }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Layout size={18} />
              {!sidebarCollapsed && <span>Expand Canvas</span>}
            </motion.button>
            {/* Collapse toggle */}
            <motion.button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full text-left rounded-lg text-sm font-medium transition-all flex items-center gap-3 mt-1"
              style={{ color: 'var(--color-text-muted)', padding: '10px 12px' }}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </motion.button>
          </div>
        </motion.aside>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Mobile header */}
        {!isShared && (
          <header className="md:hidden h-14 flex items-center justify-between px-4 shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
                <Clock className="text-white" size={14} />
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Timelog</span>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-lg" style={{ color: 'var(--color-text-muted)' }}>
              <SettingsIcon size={18} />
            </button>
          </header>
        )}

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-5xl mx-auto w-full px-4 py-5 md:px-8 md:py-7 pb-28 md:pb-8">
            <AnimatePresence mode="wait">
              {activeTab === 'today' ? (
                <TodayTab key="today" session={session} setSession={setSession} onCheckOut={handleCheckOut} projects={projects} />
              ) : activeTab === 'hub' ? (
                <ProjectHubTab key="hub" projects={projects} updateProject={updateProject} activeProjectId={session.projectId} />
              ) : activeTab === 'timers' ? (
                <TimersTab key="timers" timers={timers} />
              ) : activeTab === 'journal' ? (
                <JournalTab key="journal" decisions={decisions} addDecision={addDecision} updateDecision={updateDecision} deleteDecision={deleteDecision} />
              ) : (
                <HistoryTab key="history" history={history} projects={projects} onUpdate={updateSession} onDelete={deleteSession} onClearAll={clearAllHistory} onDownloadAll={handleDownloadAll} storageUsed={getStorageUsed()} keepDays={settings.keepDays} />
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile bottom nav */}
        {!isShared && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 pb-safe z-40" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-around h-16 px-2">
              {navItems.map(({ id, icon: Icon, label }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex flex-col items-center justify-center flex-1 h-14 rounded-xl gap-0.5 transition-all"
                    style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                  >
                    <Icon size={18} />
                    <span className="text-[10px] font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {/* ── ALARM MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {timers.ringingAlarm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 16 }}
              className="max-w-sm w-full flex flex-col items-center text-center p-8"
              style={{ background: 'var(--color-surface)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 tl-pulse" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                <BellRing size={32} />
              </div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{timers.ringingAlarm.title}</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>{timers.ringingAlarm.message}</p>
              <button
                onClick={timers.dismissAlarm}
                className="w-full py-3.5 text-white font-semibold rounded-xl tl-btn-primary"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SETTINGS MODAL ──────────────────────────────────────── */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={saveSettings}
          onClearAll={clearAllHistory}
          storageUsed={getStorageUsed()}
          projects={projects}
          addProject={addProject}
          updateProject={updateProject}
          deleteProject={deleteProject}
        />
      )}
    </div>
  );
}

export default App;
