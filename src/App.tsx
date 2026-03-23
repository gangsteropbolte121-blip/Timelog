import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, History, Settings as SettingsIcon, Timer as TimerIcon } from 'lucide-react';
import { TodayTab } from './components/TodayTab';
import { HistoryTab } from './components/HistoryTab';
import { TimersTab } from './components/TimersTab';
import { SettingsModal } from './components/SettingsModal';
import { useHistory } from './hooks/useHistory';
import { SessionState, HistorySession } from './types';
import { getDateKey, exportPDF, downloadJSON } from './utils';

function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'timers' | 'history'>('today');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { history, settings, saveSettings, addSession, deleteSession, clearAllHistory, getStorageUsed } = useHistory();

  const [session, setSession] = useState<SessionState>({
    status: 'idle',
    checkInTime: null,
    checkOutTime: null,
    breaks: [],
    logs: []
  });

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
            const incompleteSession: HistorySession = {
              id: `session_${parsed.checkInTime}`,
              date: sessionDate,
              dateFormatted: new Date(parsed.checkInTime).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
              status: 'incomplete',
              checkInTime: parsed.checkInTime,
              checkOutTime: null,
              breaks: parsed.breaks,
              logs: parsed.logs,
              summary: {
                totalSession: 0,
                totalBreak: 0,
                effectiveHours: 0,
                breakCount: parsed.breaks.length
              }
            };
            addSession(incompleteSession);
            
            // Reset current session
            setSession({
              status: 'idle',
              checkInTime: null,
              checkOutTime: null,
              breaks: [],
              logs: []
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
  }, []);

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

    const historySession: HistorySession = {
      id: `session_${completedSession.checkInTime}`,
      date: dateKey,
      dateFormatted: new Date(completedSession.checkInTime || Date.now()).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'complete',
      checkInTime: completedSession.checkInTime,
      checkOutTime: completedSession.checkOutTime,
      breaks: completedSession.breaks,
      logs: completedSession.logs,
      summary: {
        totalSession: totalSessionMs,
        totalBreak: totalBreakMs,
        effectiveHours: effectiveMs,
        breakCount: completedSession.breaks.length
      }
    };

    addSession(historySession);

    if (settings.autoExport) {
      exportPDF(historySession, dateKey);
    }

    // Reset for next session
    setTimeout(() => {
      setSession({
        status: 'idle',
        checkInTime: null,
        checkOutTime: null,
        breaks: [],
        logs: []
      });
    }, 1500); // Small delay to show "Session Complete" state
  };

  const handleDownloadAll = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalSessions: history.length,
        version: '1.0'
      },
      sessions: history
    };
    downloadJSON(exportData, 'timelog_all_sessions.json');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-gray-900 font-sans pb-20">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">TimeLog</h1>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 pt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'today' ? (
            <TodayTab 
              key="today"
              session={session} 
              setSession={setSession} 
              onCheckOut={handleCheckOut} 
            />
          ) : activeTab === 'timers' ? (
            <TimersTab key="timers" />
          ) : (
            <HistoryTab 
              key="history"
              history={history}
              onDelete={deleteSession}
              onClearAll={clearAllHistory}
              onDownloadAll={handleDownloadAll}
              storageUsed={getStorageUsed()}
              keepDays={settings.keepDays}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-center space-x-2">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center justify-center flex-1 h-12 rounded-full transition-all duration-200 ${
              activeTab === 'today' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-transparent text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Clock size={20} className={activeTab === 'today' ? 'mr-2' : 'mr-2'} />
            <span className="text-sm font-medium">Today</span>
          </button>
          <button
            onClick={() => setActiveTab('timers')}
            className={`flex items-center justify-center flex-1 h-12 rounded-full transition-all duration-200 ${
              activeTab === 'timers' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-transparent text-gray-500 hover:bg-gray-50'
            }`}
          >
            <TimerIcon size={20} className={activeTab === 'timers' ? 'mr-2' : 'mr-2'} />
            <span className="text-sm font-medium">Timers</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center flex-1 h-12 rounded-full transition-all duration-200 ${
              activeTab === 'history' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-transparent text-gray-500 hover:bg-gray-50'
            }`}
          >
            <History size={20} className={activeTab === 'history' ? 'mr-2' : 'mr-2'} />
            <span className="text-sm font-medium">History</span>
          </button>
        </div>
      </nav>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={saveSettings}
          onClearAll={clearAllHistory}
          storageUsed={getStorageUsed()}
        />
      )}
    </div>
  );
}

export default App;
