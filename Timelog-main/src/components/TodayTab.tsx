import React, { useState, useEffect } from 'react';
import { Play, Square, Coffee, Download, ChevronDown, Copy, Share2, Clock, ArrowRightCircle, Pause, CheckCircle2 } from 'lucide-react';
import * as LZString from 'lz-string';
import { motion, AnimatePresence } from 'motion/react';
import { SessionState, HistorySession, Project } from '../types';
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
    setSession({
      status: 'working',
      checkInTime: Date.now(),
      checkOutTime: null,
      breaks: [],
      logs: [{ time: Date.now(), event: 'Checked in', type: 'check_in' }],
      projectId: session.projectId || null,
      dailyIntent: session.dailyIntent || '',
      activeTask: session.activeTask || '',
      reflections: { win: '', blocker: '' }
    });
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
      if (lastBreak && !lastBreak.end) lastBreak.end = Date.now();
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

  const initiateCheckOut = () => setShowReflection(true);

  const finalizeCheckOut = (e: React.FormEvent) => {
    e.preventDefault();
    const checkOutTime = Date.now();
    setSession(prev => {
      const updatedBreaks = [...prev.breaks];
      const lastBreak = updatedBreaks[updatedBreaks.length - 1];
      if (lastBreak && !lastBreak.end) lastBreak.end = checkOutTime;
      const updatedSession = {
        ...prev,
        status: 'checked_out' as const,
        checkOutTime,
        breaks: updatedBreaks,
        reflections: { win, blocker },
        logs: [...prev.logs, { time: checkOutTime, event: 'Checked out', type: 'check_out' as const, durationMs: prev.checkInTime ? checkOutTime - prev.checkInTime : 0 }]
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
    return (session.checkOutTime || now.getTime()) - session.checkInTime;
  };
  const getLiveBreakDuration = () => session.breaks.reduce((acc, b) => acc + ((b.end || now.getTime()) - b.start), 0);
  const getEffectiveDuration = () => Math.max(0, getLiveDuration() - getLiveBreakDuration());
  const getLiveEarnings = () => {
    if (!session.projectId) return 0;
    const project = projects.find(p => p.id === session.projectId);
    if (!project) return 0;
    return (getEffectiveDuration() / (1000 * 60 * 60)) * project.rate;
  };

  const copyStatus = () => {
    const projectName = session.projectId ? projects.find(p => p.id === session.projectId)?.name || 'Personal' : 'Personal';
    const statusText = `Working on ${projectName} | ${formatDuration(getEffectiveDuration())} so far | Task: ${session.activeTask || 'General Work'}`;
    navigator.clipboard.writeText(statusText);
  };

  const shareProgress = () => {
    const sessionData = JSON.stringify({ ...session, liveDuration: getLiveDuration(), liveBreakDuration: getLiveBreakDuration(), effectiveDuration: getEffectiveDuration(), now: Date.now(), project: session.projectId ? projects.find(p => p.id === session.projectId) : null });
    const compressed = LZString.compressToEncodedURIComponent(sessionData);
    const shareUrl = `${window.location.origin}?share=true&data=${compressed}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const activeProject = session.projectId ? projects.find(p => p.id === session.projectId) : null;
  const isActive = session.status === 'working' || session.status === 'on_break';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4 pb-24"
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>Today</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{formatDate(now)}</p>
        </div>
        {isActive && (
          <div className="flex items-center gap-3">
            <button onClick={copyStatus} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-low)' }}>
              <Copy size={13} /> Copy Status
            </button>
            <button onClick={shareProgress} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all" style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-low)' }}>
              <Share2 size={13} /> Share Link
            </button>
          </div>
        )}
      </div>

      {/* Hero clock + status card */}
      <div className="tl-card p-6 flex flex-col items-center text-center relative overflow-hidden">
        {/* Status badge */}
        <div className="mb-4">
          {session.status === 'idle' && <span className="tl-pill tl-pill-muted">Ready to start</span>}
          {session.status === 'working' && (
            <span className="tl-pill tl-pill-accent flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full tl-pulse" style={{ background: 'var(--color-accent)' }} />
              Working
            </span>
          )}
          {session.status === 'on_break' && <span className="tl-pill tl-pill-warn">On Break</span>}
          {session.status === 'checked_out' && <span className="tl-pill tl-pill-success">Session Complete</span>}
        </div>

        {/* Big clock */}
        <div className="text-6xl md:text-7xl font-bold font-mono tracking-tight mb-1" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.04em' }}>
          {formatClock(now)}
        </div>

        {/* Live earnings */}
        {isActive && session.projectId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-mono font-semibold mb-4" style={{ color: 'var(--color-success)' }}>
            ₹{getLiveEarnings().toFixed(2)}
          </motion.div>
        )}
        {(!isActive || !session.projectId) && <div className="mb-4" />}

        {/* Project context chip */}
        {activeProject && (
          <div className="mb-4 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-secondary)' }}>
            {activeProject.name} · ₹{activeProject.rate}/hr
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 w-full max-w-xs">
          {session.status === 'idle' || session.status === 'checked_out' ? (
            <motion.button 
              onClick={handleCheckIn} 
              className="flex-1 py-3 font-semibold text-white rounded-xl tl-btn-primary flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play size={18} /> Check In
            </motion.button>
          ) : (
            <>
              {session.status === 'working' ? (
                <motion.button 
                  onClick={handleBreak} 
                  className="flex-1 py-3 font-medium rounded-xl tl-btn-ghost flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02, background: 'var(--color-surface-mid)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Coffee size={16} /> Take Break
                </motion.button>
              ) : (
                <motion.button 
                  onClick={handleReturn} 
                  className="flex-1 py-3 font-medium rounded-xl tl-btn-ghost flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02, background: 'var(--color-surface-mid)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play size={16} /> Resume
                </motion.button>
              )}
              <motion.button 
                onClick={initiateCheckOut} 
                className="flex-1 py-3 font-semibold text-white rounded-xl flex items-center justify-center gap-2"
                style={{ background: 'var(--color-hero)' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Square size={16} /> Check Out
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      {session.status !== 'idle' && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: formatDuration(getLiveDuration()), color: 'var(--color-text-primary)' },
            { label: 'Effective', value: formatDuration(getEffectiveDuration()), color: 'var(--color-accent)' },
            { label: 'Break', value: formatDuration(getLiveBreakDuration()), color: 'var(--color-warn)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="tl-card p-4 text-center">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
              <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Session context */}
      <div className="tl-card overflow-hidden">
        <button
          onClick={() => setShowContext(!showContext)}
          className="w-full flex items-center justify-between px-5 py-3.5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Session Details</span>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
            {showContext ? 'Hide' : 'Edit'}
            <ChevronDown size={14} style={{ transform: showContext ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>
        </button>

        <AnimatePresence>
          {showContext && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <div className="pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Project / Client</label>
                  <div className="relative">
                    <select
                      value={session.projectId || ''}
                      onChange={(e) => setSession(prev => ({ ...prev, projectId: e.target.value || null }))}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm appearance-none tl-select cursor-pointer"
                      style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    >
                      <option value="">Personal / No Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.rate}/hr)</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  {projects.length === 0 && <p className="text-xs mt-1.5" style={{ color: 'var(--color-warn)' }}>Add projects in Settings to track billable hours.</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Daily Intent</label>
                  <input
                    type="text"
                    placeholder="What is your #1 priority today?"
                    value={session.dailyIntent}
                    onChange={(e) => setSession(prev => ({ ...prev, dailyIntent: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Active Task</label>
                  <input
                    type="text"
                    placeholder="What are you working on right now?"
                    value={session.activeTask}
                    onChange={(e) => setSession(prev => ({ ...prev, activeTask: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Activity log */}
      {session.logs.length > 0 && (
        <div className="tl-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Activity Log</span>
            {session.status === 'checked_out' && (
              <button onClick={() => exportPDF(session as unknown as HistorySession, getDateKey(new Date(session.checkInTime || Date.now())), projects)} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-accent)' }}>
                <Download size={13} /> Export PDF
              </button>
            )}
          </div>
          <div className="p-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3.5 top-3 bottom-3 w-0.5" style={{ background: 'var(--color-border-solid)' }} />
              
              {session.logs.map((log, i) => {
                const isFirst = i === 0;
                const isLast = i === session.logs.length - 1;
                const isCheckIn = log.type === 'check_in';
                const isCheckOut = log.type === 'check_out';
                const isBreakStart = log.type === 'break_start';
                const isBreakEnd = log.type === 'break_end';
                
                let iconBg = 'var(--color-surface-mid)';
                let iconColor = 'var(--color-text-muted)';
                if (isCheckIn) { iconBg = 'var(--color-success-muted)'; iconColor = 'var(--color-success)'; }
                else if (isCheckOut) { iconBg = 'var(--color-accent-muted)'; iconColor = 'var(--color-accent)'; }
                else if (isBreakStart) { iconBg = 'rgba(245,158,11,0.1)'; iconColor = '#f59e0b'; }
                else if (isBreakEnd) { iconBg = 'rgba(16,185,129,0.1)'; iconColor = 'var(--color-success)'; }
                
                return (
                  <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                    {/* Timeline dot */}
                    <div className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg }}>
                      {isCheckIn && <ArrowRightCircle size={14} style={{ color: iconColor }} />}
                      {isCheckOut && <CheckCircle2 size={14} style={{ color: iconColor }} />}
                      {isBreakStart && <Coffee size={12} style={{ color: iconColor }} />}
                      {isBreakEnd && <Play size={12} style={{ color: iconColor }} />}
                      {!isCheckIn && !isCheckOut && !isBreakStart && !isBreakEnd && <Clock size={12} style={{ color: iconColor }} />}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{log.event}</span>
                        <span className="text-xs font-mono shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(log.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {log.durationMs && (
                        <span className="text-xs font-mono mt-0.5 inline-block px-2 py-0.5 rounded" style={{ background: 'var(--color-surface-mid)', color: 'var(--color-text-secondary)' }}>
                          {formatDuration(log.durationMs)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EOD Reflection Modal */}
      {showReflection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
          <div className="max-w-sm w-full p-6" style={{ background: 'var(--color-surface)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <h2 className="text-lg font-bold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>End of Day Reflection</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>Capture your thoughts before checking out.</p>

            <form onSubmit={finalizeCheckOut} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Biggest Win</label>
                <textarea required value={win} onChange={e => setWin(e.target.value)} placeholder="What went well today?" className="w-full px-4 py-2.5 rounded-xl text-sm resize-none focus:outline-none min-h-[80px]" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Any Blockers?</label>
                <textarea required value={blocker} onChange={e => setBlocker(e.target.value)} placeholder="What slowed you down?" className="w-full px-4 py-2.5 rounded-xl text-sm resize-none focus:outline-none min-h-[80px]" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowReflection(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold tl-btn-primary">Complete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
