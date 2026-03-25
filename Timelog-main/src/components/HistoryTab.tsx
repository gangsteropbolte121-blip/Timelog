import React, { useState, useMemo } from 'react';
import { Download, Trash2, ChevronDown, ChevronUp, FileJson, FileText, Search, CheckCircle2, AlertCircle, Receipt, Clock, Edit2, Check, X, Briefcase, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HistorySession, Project } from '../types';
import { formatDuration, formatTimeShort, exportPDF, downloadJSON, generateInvoice } from '../utils';

interface HistoryTabProps {
  history: HistorySession[];
  projects: Project[];
  onUpdate: (session: HistorySession) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onDownloadAll: () => void;
  storageUsed: string;
  keepDays: number;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ history, projects, onUpdate, onDelete, onClearAll, onDownloadAll, storageUsed, keepDays }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editIntent, setEditIntent] = useState('');
  const [editWin, setEditWin] = useState('');
  const [editBlocker, setEditBlocker] = useState('');

  const startEditing = (session: HistorySession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditIntent(session.dailyIntent || '');
    setEditWin(session.reflections?.win || '');
    setEditBlocker(session.reflections?.blocker || '');
    setExpandedId(session.id);
  };

  const saveEdit = (session: HistorySession, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...session, dailyIntent: editIntent, reflections: { win: editWin, blocker: editBlocker } });
    setEditingSessionId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => { e.stopPropagation(); setEditingSessionId(null); };

  const filteredHistory = useMemo(() => {
    return history.filter(s => {
      if (filter === 'complete' && s.status !== 'complete') return false;
      if (filter === 'incomplete' && s.status !== 'incomplete') return false;
      if (projectFilter !== 'all' && s.projectId !== projectFilter) return false;
      if (fromDate && s.date < fromDate) return false;
      if (toDate && s.date > toDate) return false;
      return true;
    });
  }, [history, filter, projectFilter, fromDate, toDate]);

  const stats = useMemo(() => {
    const now = new Date();
    const m = now.getMonth(), y = now.getFullYear();
    let earned = 0, hoursMs = 0, sessionMs = 0;
    history.forEach(s => {
      const d = new Date(s.date);
      if (d.getMonth() === m && d.getFullYear() === y) {
        earned += s.summary.earnedValue || 0;
        hoursMs += s.summary.effectiveHours;
        sessionMs += s.summary.totalSession || s.summary.effectiveHours;
      }
    });
    return {
      earned,
      hours: hoursMs / (1000 * 60 * 60),
      sessions: history.length,
      deepWork: sessionMs > 0 ? Math.round((hoursMs / sessionMs) * 100) : 0,
    };
  }, [history, projects]);

  const getProjectName = (id?: string) => {
    if (!id) return 'Personal';
    return projects.find(p => p.id === id)?.name ?? 'Deleted Project';
  };

  const filterPills = [
    { id: 'all' as const, label: 'All' },
    { id: 'complete' as const, label: 'Complete' },
    { id: 'incomplete' as const, label: 'Incomplete' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 pb-24">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>Ledger</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Every hour, fully accounted for.</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button 
            onClick={onDownloadAll} 
            disabled={!history.length} 
            className="p-2 rounded-lg transition-all disabled:opacity-40" 
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-low)' }} 
            title="Download All JSON"
            whileHover={{ scale: 1.05, background: 'var(--color-surface-mid)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Download size={16} />
          </motion.button>
          <motion.button 
            onClick={() => setShowClearConfirm(true)} 
            disabled={!history.length} 
            className="p-2 rounded-lg transition-all disabled:opacity-40" 
            style={{ color: 'var(--color-text-secondary)', background: 'var(--color-surface-low)' }} 
            title="Clear All"
            whileHover={{ scale: 1.05, background: 'var(--color-surface-mid)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>

      {/* Hero stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="tl-card-hero p-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-60">Sessions</div>
          <div className="text-2xl font-bold font-mono">{stats.sessions}</div>
        </div>
        {[
          { label: 'Hours This Month', value: `${stats.hours.toFixed(1)}h`, accent: 'var(--color-accent)' },
          { label: 'Earned This Month', value: `$${stats.earned.toFixed(2)}`, accent: 'var(--color-success)' },
          { label: 'Deep Work Score', value: `${stats.deepWork}%`, accent: 'var(--color-text-primary)' },
        ].map(({ label, value, accent }) => (
          <div key={label} className="tl-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
            <div className="text-2xl font-bold font-mono" style={{ color: accent }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Clear confirm banner */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: 'rgba(232,40,74,0.07)', border: '1px solid rgba(232,40,74,0.2)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--color-accent-dark)' }}>Delete all history? This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={() => { onClearAll(); setShowClearConfirm(false); }} className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: 'var(--color-accent)' }}>Delete All</button>
                <button onClick={() => setShowClearConfirm(false)} className="px-3 py-1.5 text-xs font-medium rounded-lg" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)' }}>Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="tl-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterPills.map(({ id, label }) => (
              <button key={id} onClick={() => setFilter(id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: filter === id ? 'var(--color-hero)' : 'var(--color-surface-low)', color: filter === id ? 'white' : 'var(--color-text-secondary)' }}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-wrap gap-2 items-center">
            <div className="relative">
              <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className="text-xs rounded-lg px-3 py-1.5 pr-8 tl-select focus:outline-none appearance-none cursor-pointer" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
                <option value="all">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="flex gap-2">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="text-xs rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} />
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="text-xs rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Session list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredHistory.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tl-card py-14 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-surface-low)' }}>
                <Search size={20} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>No sessions found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Try adjusting filters or check back after your first session.</p>
            </motion.div>
          ) : (
            filteredHistory.map(session => {
              const isExpanded = expandedId === session.id;
              return (
                <motion.div key={session.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="tl-card overflow-hidden group">
                  {/* Card header row */}
                  <div className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--color-surface-low)] transition-colors" onClick={() => setExpandedId(isExpanded ? null : session.id)}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{session.dateFormatted}</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {session.checkInTime ? formatTimeShort(session.checkInTime) : '—'} → {session.checkOutTime ? formatTimeShort(session.checkOutTime) : 'ongoing'}
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-2 shrink-0">
                        {session.status === 'complete'
                          ? <span className="tl-pill tl-pill-success">Complete</span>
                          : <span className="tl-pill tl-pill-warn">Incomplete</span>}
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: 'var(--color-surface-mid)', color: 'var(--color-text-secondary)' }}>
                          {getProjectName(session.projectId)}
                        </span>
                        <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{formatDuration(session.summary.effectiveHours)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base font-bold font-mono" style={{ color: 'var(--color-success)' }}>
                        ${(session.summary.earnedValue ?? 0).toFixed(2)}
                      </span>

                      {/* Action buttons (visible on hover) */}
                      <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {session.status === 'complete' && (session.summary.earnedValue ?? 0) > 0 && (
                          <button onClick={e => { e.stopPropagation(); generateInvoice(session, projects); }} className="p-1.5 rounded transition-all" style={{ color: 'var(--color-text-muted)' }} title="Invoice">
                            <Receipt size={14} />
                          </button>
                        )}
                        <button onClick={e => { e.stopPropagation(); exportPDF(session, session.date, projects); }} className="p-1.5 rounded" style={{ color: 'var(--color-text-muted)' }} title="PDF">
                          <FileText size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); downloadJSON(session, `timelog_${session.date}.json`); }} className="p-1.5 rounded" style={{ color: 'var(--color-text-muted)' }} title="JSON">
                          <FileJson size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); startEditing(session, e); }} className="p-1.5 rounded" style={{ color: 'var(--color-text-muted)' }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); onDelete(session.id); }} className="p-1.5 rounded" style={{ color: 'var(--color-text-muted)' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-5 space-y-5" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-low)' }}>

                          {/* Reflections */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Reflections</h4>
                              {editingSessionId === session.id ? (
                                <div className="flex gap-2">
                                  <button onClick={e => saveEdit(session, e)} className="p-1 rounded" style={{ color: 'var(--color-success)' }}><Check size={14} /></button>
                                  <button onClick={cancelEdit} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }}><X size={14} /></button>
                                </div>
                              ) : (
                                <button onClick={e => startEditing(session, e)} className="p-1 rounded" style={{ color: 'var(--color-text-muted)' }}><Edit2 size={14} /></button>
                              )}
                            </div>

                            {editingSessionId === session.id ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--color-accent)' }}>Daily Intent</label>
                                  <input value={editIntent} onChange={e => setEditIntent(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} placeholder="What was your main goal?" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--color-success)' }}>Biggest Win</label>
                                    <textarea value={editWin} onChange={e => setEditWin(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none h-20" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--color-warn)' }}>Blockers</label>
                                    <textarea value={editBlocker} onChange={e => setEditBlocker(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none h-20" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {session.dailyIntent && (
                                  <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                    <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-accent)' }}>Intent</div>
                                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{session.dailyIntent}</p>
                                  </div>
                                )}
                                {session.reflections && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {session.reflections.win && (
                                      <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface)', borderLeft: '3px solid var(--color-success)' }}>
                                        <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-success)' }}>Win</div>
                                        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{session.reflections.win}</p>
                                      </div>
                                    )}
                                    {session.reflections.blocker && (
                                      <div className="px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface)', borderLeft: '3px solid var(--color-warn)' }}>
                                        <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-warn)' }}>Blocker</div>
                                        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{session.reflections.blocker}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Activity timeline */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Activity Timeline</h4>
                            <div className="relative pl-6">
                              {/* Timeline line */}
                              <div className="absolute left-2 top-2 bottom-2 w-0.5" style={{ background: 'var(--color-border-solid)' }} />
                              {session.logs.map((log, i) => {
                                const isFirst = i === 0;
                                const isLast = i === session.logs.length - 1;
                                return (
                                  <div key={i} className="relative flex items-start gap-3 pb-3 last:pb-0">
                                    {/* Timeline dot */}
                                    <div className="relative z-10 w-4 h-4 rounded-full shrink-0 mt-0.5" style={{ background: 'var(--color-surface)', border: '2px solid var(--color-accent)' }} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{log.event}</span>
                                        <span className="text-xs font-mono shrink-0" style={{ color: 'var(--color-text-muted)' }}>{formatTimeShort(log.time)}</span>
                                      </div>
                                      {log.durationMs ? <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text-muted)' }}>Duration: {formatDuration(log.durationMs)}</div> : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Mobile actions */}
                          <div className="flex gap-2 md:hidden flex-wrap">
                            {session.status === 'complete' && (session.summary.earnedValue ?? 0) > 0 && (
                              <button onClick={() => generateInvoice(session, projects)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}><Receipt size={13} /> Invoice</button>
                            )}
                            <button onClick={() => exportPDF(session, session.date, projects)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}><FileText size={13} /> PDF</button>
                            <button onClick={() => onDelete(session.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--color-surface)', border: '1px solid rgba(232,40,74,0.15)', color: 'var(--color-accent)' }}><Trash2 size={13} /> Delete</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer storage info */}
      <div className="text-center py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {history.length} sessions · {storageUsed} KB used · {keepDays}-day retention
      </div>
    </motion.div>
  );
};
