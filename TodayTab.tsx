import React, { useState, useEffect } from 'react';
import { Play, Square, Coffee, Download, Briefcase, Target, CheckCircle2, ChevronDown, Copy, Settings2, Share2 } from 'lucide-react';
import * as LZString from 'lz-string';
import { motion, AnimatePresence } from 'motion/react';
import { SessionState, HistorySession, Settings, Project } from '../types';
import { formatDuration, formatClock, formatDate, exportPDF, getDateKey } from '../utils';

interface TodayTabProps {
  session: SessionState;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;
  onCheckOut: (session: SessionState) => void;
  projects: Project[];
}

export const TodayTab: React.FC<TodayTabProps> = ({ session, setSession, onCheckOut, projects }) => {
  const [now, setNow] = useState(new Date());
  const [showReflection, setShowReflection] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [win, setWin] = useState('');
  const [blocker, setBlocker] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    setSession(prev => ({
      ...prev,
      status: 'working',
      checkInTime: Date.now(),
      checkOutTime: null,
      breaks: [],
      logs: [{ time: Date.now(), event: 'Checked in', type: 'check_in' }]
    }));
  };

  const handleBreak = () => {
    setSession(prev => ({
      ...prev,
      status: 'on_break',
      breaks: [...prev.breaks, { start: Date.now(), end: null }],
      logs: [...prev.logs, { time: Date.now(), event: 'Started break', type: 'break_start' }]
    }));
  };

  const handleReturn = () => {
    setSession(prev => {
      const updatedBreaks = [...prev.breaks];
      const lastBreak = updatedBreaks[updatedBreaks.length - 1];
      if (lastBreak && !lastBreak.end) {
        lastBreak.end = Date.now();
      }
      return {
        ...prev,
        status: 'working',
        breaks: updatedBreaks,
        logs: [...prev.logs, { 
          time: Date.now(), 
          event: 'Returned from break', 
          type: 'break_end',
          durationMs: lastBreak.end ? lastBreak.end - lastBreak.start : 0
        }]
      };
    });
  };

  const initiateCheckOut = () => {
    console.log('initiateCheckOut called, current session status:', session.status);
    setShowReflection(true);
    console.log('showReflection should now be true');
  };

  const finalizeCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    const checkOutTime = Date.now();
    setSession(prev => {
      const updatedBreaks = [...prev.breaks];
      const lastBreak = updatedBreaks[updatedBreaks.length - 1];
      if (lastBreak && !lastBreak.end) {
        lastBreak.end = checkOutTime;
      }
      
      const updatedSession = {
        ...prev,
        status: 'checked_out' as const,
        checkOutTime,
        breaks: updatedBreaks,
        reflections: { win, blocker },
        logs: [...prev.logs, { 
          time: checkOutTime, 
          event: 'Checked out', 
          type: 'check_out' as const,
          durationMs: prev.checkInTime ? checkOutTime - prev.checkInTime : 0
        }]
      };
      
      onCheckOut(updatedSession);
      setShowReflection(false);
      setWin('');
      setBlocker('');
      return updatedSession;
    });
  };

  const getLiveDuration = () => {
    if (!session.checkInTime) return 0;
    const end = session.checkOutTime || now.getTime();
    return end - session.checkInTime;
  };

  const getLiveBreakDuration = () => {
    return session.breaks.reduce((acc, b) => {
      const end = b.end || now.getTime();
      return acc + (end - b.start);
    }, 0);
  };

  const getEffectiveDuration = () => {
    return Math.max(0, getLiveDuration() - getLiveBreakDuration());
  };

  const getLiveEarnings = () => {
    if (!session.projectId) return 0;
    const project = projects.find(p => p.id === session.projectId);
    if (!project) return 0;
    const effectiveHours = getEffectiveDuration() / (1000 * 60 * 60);
    return effectiveHours * project.rate;
  };

  const copyStatus = () => {
    const projectName = session.projectId ? projects.find(p => p.id === session.projectId)?.name || 'Personal' : 'Personal';
    const timeSoFar = formatDuration(getEffectiveDuration());
    const taskName = session.activeTask || 'General Work';
    const statusText = `🚀 Working on ${projectName} | ⏱️ ${timeSoFar} so far today | ✅ Task: ${taskName}`;
    navigator.clipboard.writeText(statusText);
    alert('Status copied to clipboard!');
  };

  const shareProgress = () => {
    const sessionData = JSON.stringify({
      ...session,
      liveDuration: getLiveDuration(),
      liveBreakDuration: getLiveBreakDuration(),
      effectiveDuration: getEffectiveDuration(),
      now: Date.now(),
      project: session.projectId ? projects.find(p => p.id === session.projectId) : null
    });
    const compressed = LZString.compressToEncodedURIComponent(sessionData);
    const shareUrl = `${window.location.origin}?share=true&data=${compressed}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Guest link copied to clipboard! Share this with your client.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-24"
    >
      {/* Top Dashboard Area: Clock & Actions */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="mb-4">
          {session.status === 'idle' && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">Ready to start</span>
          )}
          {session.status === 'working' && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium animate-pulse">Working</span>
          )}
          {session.status === 'on_break' && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">On Break</span>
          )}
          {session.status === 'checked_out' && (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">Session Complete</span>
          )}
        </div>

        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tight font-mono mb-2">
          {formatClock(now)}
        </h1>
        <p className="text-gray-500 font-medium mb-6">{formatDate(now)}</p>

        {/* Live Earnings */}
        {(session.status === 'working' || session.status === 'on_break') && session.projectId && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-emerald-600 font-mono font-bold text-2xl mb-6"
          >
            +${getLiveEarnings().toFixed(2)}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-4">
          {session.status === 'idle' || session.status === 'checked_out' ? (
            <button
              onClick={handleCheckIn}
              className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2 transition-colors font-medium shadow-sm text-lg"
            >
              <Play size={24} />
              <span>Check In</span>
            </button>
          ) : (
            <>
              {session.status === 'working' ? (
                <button
                  onClick={handleBreak}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl py-4 flex items-center justify-center space-x-2 transition-colors font-medium"
                >
                  <Coffee size={20} />
                  <span>Take Break</span>
                </button>
              ) : (
                <button
                  onClick={handleReturn}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl py-4 flex items-center justify-center space-x-2 transition-colors font-medium"
                >
                  <Play size={20} />
                  <span>Return</span>
                </button>
              )}
              <button
                onClick={() => {
                  console.log('Checkout button clicked!');
                  initiateCheckOut();
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-4 flex items-center justify-center space-x-2 transition-colors font-medium shadow-sm"
              >
                <Square size={20} />
                <span>Check Out</span>
              </button>
            </>
          )}
        </div>

        {/* Copy Status & Share Buttons */}
        {(session.status === 'working' || session.status === 'on_break') && (
          <div className="mt-6 flex items-center space-x-6">
            <button 
              onClick={copyStatus}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <Copy size={16} />
              <span>Copy Status</span>
            </button>
            <button 
              onClick={shareProgress}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <Share2 size={16} />
              <span>Share Live Link</span>
            </button>
          </div>
        )}
      </div>

      {/* Context Header */}
      <div className="flex justify-between items-center px-2">
        <h3 className="font-semibold text-gray-900">Session Details</h3>
        <button 
          onClick={() => setShowContext(!showContext)} 
          className="flex items-center space-x-1 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          <Settings2 size={16} />
          <span>{showContext ? 'Hide Context' : 'Edit Context'}</span>
        </button>
      </div>

      {/* Context Section (Collapsible) */}
      <AnimatePresence>
        {showContext && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project / Client</label>
                <div className="relative">
                  <select
                    value={session.projectId || ''}
                    onChange={(e) => setSession(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none pr-10"
                  >
                    <option value="">Personal / No Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.rate}/hr)</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <ChevronDown size={16} />
                  </div>
                </div>
                {projects.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">Add projects in Settings to track billable hours.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Daily Intent (Optional)</label>
                <input
                  type="text"
                  placeholder="What is your #1 Priority today?"
                  value={session.dailyIntent}
                  onChange={(e) => setSession(prev => ({ ...prev, dailyIntent: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Active Task</label>
                <input
                  type="text"
                  placeholder="What are you working on right now?"
                  value={session.activeTask}
                  onChange={(e) => setSession(prev => ({ ...prev, activeTask: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      {session.status !== 'idle' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total</span>
            <span className="text-lg font-bold text-gray-900 font-mono">{formatDuration(getLiveDuration())}</span>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Effective</span>
            <span className="text-lg font-bold text-indigo-600 font-mono">{formatDuration(getEffectiveDuration())}</span>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Break</span>
            <span className="text-lg font-bold text-amber-600 font-mono">{formatDuration(getLiveBreakDuration())}</span>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {session.logs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Activity Log</h3>
            {session.status === 'checked_out' && (
              <button 
                onClick={() => exportPDF(session as unknown as HistorySession, getDateKey(new Date(session.checkInTime || Date.now())), projects)}
                className="text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 text-sm font-medium transition-colors"
              >
                <Download size={16} />
                <span>Export PDF</span>
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {session.logs.map((log, index) => (
              <div key={index} className="px-6 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-mono text-gray-500">
                    {new Date(log.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{log.event}</span>
                </div>
                {log.durationMs && (
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {formatDuration(log.durationMs)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EOD Reflection Modal */}
      {showReflection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-4 mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">End of Day Reflection</h2>
            <p className="text-sm text-gray-500 text-center mb-6">Capture your thoughts before checking out.</p>
            
            <form onSubmit={finalizeCheckOut} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Biggest Win?</label>
                <textarea
                  required
                  value={win}
                  onChange={e => setWin(e.target.value)}
                  placeholder="What went well today?"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm min-h-[80px] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Any Blockers?</label>
                <textarea
                  required
                  value={blocker}
                  onChange={e => setBlocker(e.target.value)}
                  placeholder="What slowed you down?"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm min-h-[80px] resize-none"
                />
              </div>
              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReflection(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
