import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, History, Settings as SettingsIcon, Timer as TimerIcon, BellRing, BookOpen, Layout } from 'lucide-react';
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
    reflections: {
      win: '',
      blocker: ''
    }
  });

  const [guestData, setGuestData] = useState<any>(null);
  const isShared = new URLSearchParams(window.location.search).get('share') === 'true';

  // Check for guest view on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get('view') === 'guest' || params.get('share') === 'true') && params.get('data')) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(params.get('data')!);
        if (decompressed) {
          setGuestData(JSON.parse(decompressed));
        }
      } catch (e) {
        console.error('Failed to parse guest data', e);
      }
    }
  }, []);

  // Load active session from localStorage on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('timelog_active');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        
        // Check if session is from a previous day
        if (parsed.checkInTime) {
          const sessionDate = getDateKey(new Date(parsed.checkInTime));
          const todayDate = getDateKey(new Date());
          
          if (sessionDate !== todayDate && parsed.status !== 'checked_out') {
            // Auto-close incomplete session from yesterday
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
              summary: {
                totalSession: 0,
                totalBreak: 0,
                effectiveHours: 0,
                breakCount: parsed.breaks.length,
                earnedValue
              }
            };
            addSession(incompleteSession);
            
            // Reset current session
            setSession({
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
            localStorage.removeItem('timelog_active');
            return;
          }
        }
        
        setSession(parsed);
      } catch (e) {
        console.error('Failed to parse active session', e);
      }
    }
  }, [projects]);

  // Save active session to localStorage whenever it changes
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
      if (project) {
        earnedValue = (effectiveMs / (1000 * 60 * 60)) * project.rate;
      }
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
      summary: {
        totalSession: totalSessionMs,
        totalBreak: totalBreakMs,
        effectiveHours: effectiveMs,
        breakCount: completedSession.breaks.length,
        earnedValue
      }
    };

    addSession(historySession);

    if (settings.autoExport) {
      exportPDF(historySession, dateKey, projects);
    }

    // Reset for next session
    setTimeout(() => {
      setSession({
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
    }, 1500); // Small delay to show "Session Complete" state
  };

  const handleDownloadAll = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalSessions: history.length,
        version: '4.0'
      },
      sessions: history,
      projects,
      decisions
    };
    downloadJSON(exportData, 'timelog_all_data.json');
  };

  if (isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FF]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mb-4"></div>
          <p className="text-gray-500 font-medium">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (guestData) {
    return <GuestView data={guestData} />;
  }

  const SidebarLink = ({ id, icon, label }: { id: typeof activeTab, icon: React.ReactNode, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center w-full px-4 py-3 rounded-r-xl transition-all ${
          isActive 
            ? 'bg-white/10 border-l-4 border-indigo-500 text-white' 
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-4 border-transparent'
        }`}
      >
        <div className="mr-3">{icon}</div>
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Desktop Sidebar */}
      {!isShared && (
        <aside className="hidden md:flex w-[260px] flex-col bg-slate-950 text-white border-r border-slate-800 h-full shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm mr-3">
              <Clock className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Freelance OS</h1>
          </div>
          <nav className="flex-1 py-6 space-y-2 overflow-y-auto pr-4">
            <SidebarLink id="today" icon={<Clock size={20} />} label="Dashboard" />
            <SidebarLink id="hub" icon={<Layout size={20} />} label="Project Hub" />
            <SidebarLink id="history" icon={<History size={20} />} label="Ledger" />
            <SidebarLink id="journal" icon={<BookOpen size={20} />} label="Growth" />
            <SidebarLink id="timers" icon={<TimerIcon size={20} />} label="Timers" />
          </nav>
          <div className="p-4 border-t border-slate-800 shrink-0 space-y-2">
            <button 
              onClick={() => {
                const iframe = document.querySelector('iframe');
                if (iframe) {
                  if (iframe.requestFullscreen) {
                    iframe.requestFullscreen();
                  }
                } else {
                  alert('No canvas found. Open a project with a Figma link first.');
                }
              }} 
              className="flex items-center w-full px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-slate-200 rounded-xl transition-colors"
            >
              <Layout size={20} className="mr-3" />
              <span className="font-medium">Expand Canvas</span>
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="flex items-center w-full px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-slate-200 rounded-xl transition-colors"
            >
              <SettingsIcon size={20} className="mr-3" />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Mobile Header */}
        {!isShared && (
          <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Freelance OS</h1>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <SettingsIcon size={20} />
            </button>
          </header>
        )}

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-[1400px] mx-auto w-full px-4 py-4 md:px-8 md:py-6 h-full pb-24 md:pb-8">
            <AnimatePresence mode="wait">
              {activeTab === 'today' ? (
                <TodayTab 
                  key="today"
                  session={session} 
                  setSession={setSession} 
                  onCheckOut={handleCheckOut} 
                  projects={projects}
                />
              ) : activeTab === 'hub' ? (
                <ProjectHubTab 
                  key="hub"
                  projects={projects}
                  updateProject={updateProject}
                  activeProjectId={session.projectId}
                />
              ) : activeTab === 'timers' ? (
                <TimersTab key="timers" timers={timers} />
              ) : activeTab === 'journal' ? (
                <JournalTab 
                  key="journal" 
                  decisions={decisions} 
                  addDecision={addDecision} 
                  updateDecision={updateDecision}
                  deleteDecision={deleteDecision} 
                />
              ) : (
                <HistoryTab 
                  key="history"
                  history={history}
                  projects={projects}
                  onUpdate={updateSession}
                  onDelete={deleteSession}
                  onClearAll={clearAllHistory}
                  onDownloadAll={handleDownloadAll}
                  storageUsed={getStorageUsed()}
                  keepDays={settings.keepDays}
                />
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        {!isShared && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-center space-x-1">
              <button
                onClick={() => setActiveTab('today')}
                className={`flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-200 ${
                  activeTab === 'today' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Clock size={20} className="mb-1" />
                <span className="text-[10px] font-medium">Today</span>
              </button>
              <button
                onClick={() => setActiveTab('hub')}
                className={`flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-200 ${
                  activeTab === 'hub' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Layout size={20} className="mb-1" />
                <span className="text-[10px] font-medium">Hub</span>
              </button>
              <button
                onClick={() => setActiveTab('timers')}
                className={`flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-200 ${
                  activeTab === 'timers' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TimerIcon size={20} className="mb-1" />
                <span className="text-[10px] font-medium">Timers</span>
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className={`flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-200 ${
                  activeTab === 'journal' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BookOpen size={20} className="mb-1" />
                <span className="text-[10px] font-medium">Journal</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-200 ${
                  activeTab === 'history' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <History size={20} className="mb-1" />
                <span className="text-[10px] font-medium">History</span>
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Ringing Alarm Modal */}
      <AnimatePresence>
        {timers.ringingAlarm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <BellRing size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{timers.ringingAlarm.title}</h2>
              <p className="text-gray-500 mb-8">{timers.ringingAlarm.message}</p>
              <button
                onClick={timers.dismissAlarm}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Stop Alarm
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
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
