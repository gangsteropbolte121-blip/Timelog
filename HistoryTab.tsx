import React, { useState, useMemo } from 'react';
import { Download, Trash2, ChevronDown, ChevronUp, FileJson, FileText, Search, Briefcase, Target, CheckCircle2, AlertCircle, Receipt, Clock, Edit2, Check, X } from 'lucide-react';
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

export const HistoryTab: React.FC<HistoryTabProps> = ({ 
  history, 
  projects,
  onUpdate,
  onDelete, 
  onClearAll, 
  onDownloadAll,
  storageUsed,
  keepDays
}) => {
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
    setExpandedId(session.id); // Ensure it's expanded to see the edit form
  };

  const saveEdit = (session: HistorySession, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({
      ...session,
      dailyIntent: editIntent,
      reflections: {
        win: editWin,
        blocker: editBlocker
      }
    });
    setEditingSessionId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const filteredHistory = useMemo(() => {
    return history.filter(session => {
      // Status filter
      if (filter === 'complete' && session.status !== 'complete') return false;
      if (filter === 'incomplete' && session.status !== 'incomplete') return false;

      // Project filter
      if (projectFilter !== 'all' && session.projectId !== projectFilter) return false;

      // Date filter
      if (fromDate && session.date < fromDate) return false;
      if (toDate && session.date > toDate) return false;

      return true;
    });
  }, [history, filter, projectFilter, fromDate, toDate]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalEarned = 0;
    let totalHoursMs = 0;
    let totalSessionMs = 0;

    history.forEach(session => {
      const sessionDate = new Date(session.date);
      if (sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear) {
        if (session.summary.earnedValue) {
          totalEarned += session.summary.earnedValue;
        }
        totalHoursMs += session.summary.effectiveHours;
        totalSessionMs += session.summary.totalSession || session.summary.effectiveHours;
      }
    });

    const deepWorkScore = totalSessionMs > 0 ? Math.round((totalHoursMs / totalSessionMs) * 100) : 0;

    return {
      earned: totalEarned,
      hours: totalHoursMs / (1000 * 60 * 60),
      activeProjects: projects.length,
      deepWorkScore
    };
  }, [history, projects]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getDayLabel = (dateStr: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sessionDate = new Date(dateStr);
    
    if (sessionDate.toDateString() === today.toDateString()) return 'Today';
    if (sessionDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return null;
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'Unknown Project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Deleted Project';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-24"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">My Logs</h2>
        <div className="flex space-x-2">
          <button 
            onClick={onDownloadAll}
            disabled={history.length === 0}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50"
            title="Download All (JSON)"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            disabled={history.length === 0}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            title="Clear All"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Receipt size={16} />
            <span className="text-sm font-medium">Total Earned</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">${currentMonthStats.earned.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Clock size={16} />
            <span className="text-sm font-medium">Total Hours</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">{currentMonthStats.hours.toFixed(1)}h</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Briefcase size={16} />
            <span className="text-sm font-medium">Active Projects</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">{currentMonthStats.activeProjects}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Target size={16} />
            <span className="text-sm font-medium">Deep Work Score</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono">{currentMonthStats.deepWorkScore}%</div>
        </div>
      </div>

      {/* Clear Confirmation Banner */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 overflow-hidden"
          >
            <p className="text-red-800 font-medium mb-3">Are you sure you want to delete all history? This cannot be undone.</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  onClearAll();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Yes, delete all
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('complete')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Full Days
            </button>
            <button 
              onClick={() => setFilter('incomplete')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'incomplete' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Incomplete
            </button>
          </div>
          
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-slate-50"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex flex-1 gap-2">
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredHistory.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm"
            >
              <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No logs found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters or check back later.</p>
            </motion.div>
          ) : (
            filteredHistory.map((session) => {
              const isExpanded = expandedId === session.id;
              const dayLabel = getDayLabel(session.date);
              
              return (
                <motion.div 
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group"
                >
                  {/* Card Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
                    onClick={() => toggleExpand(session.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{session.dateFormatted}</span>
                        <span className="text-xs text-slate-500 font-mono">{session.checkInTime ? formatTimeShort(session.checkInTime) : '-'} - {session.checkOutTime ? formatTimeShort(session.checkOutTime) : 'Ongoing'}</span>
                      </div>
                      <div className="hidden md:flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          <Briefcase size={12} className="mr-1" />
                          {getProjectName(session.projectId)}
                        </span>
                        <span className="text-sm font-mono text-slate-600">{formatDuration(session.summary.effectiveHours)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-emerald-600 font-mono">
                        ${session.summary.earnedValue?.toFixed(2) || '0.00'}
                      </span>
                      
                      <div className="flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        {session.status === 'complete' && session.summary.earnedValue && session.summary.earnedValue > 0 ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); generateInvoice(session, projects); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            title="Generate Invoice"
                          >
                            <Receipt size={16} />
                          </button>
                        ) : null}
                        <button 
                          onClick={(e) => { e.stopPropagation(); exportPDF(session, session.date, projects); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title="Download PDF"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadJSON(session, `timelog_${session.date}.json`); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title="Download JSON"
                        >
                          <FileJson size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="p-1.5 text-slate-400">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 bg-gray-50 overflow-hidden"
                      >
                        <div className="p-4 space-y-6">
                          {/* Reflections Section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-900">Reflections</h4>
                              {editingSessionId === session.id ? (
                                <div className="flex space-x-2">
                                  <button onClick={(e) => saveEdit(session, e)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Save">
                                    <Check size={16} />
                                  </button>
                                  <button onClick={cancelEdit} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Cancel">
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={(e) => startEditing(session, e)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Edit Reflections">
                                  <Edit2 size={16} />
                                </button>
                              )}
                            </div>

                            {editingSessionId === session.id ? (
                              <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div>
                                  <label className="block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Daily Intent</label>
                                  <input
                                    type="text"
                                    value={editIntent}
                                    onChange={(e) => setEditIntent(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="What was your main goal?"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Biggest Win</label>
                                    <textarea
                                      value={editWin}
                                      onChange={(e) => setEditWin(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-20"
                                      placeholder="What went well?"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Blockers</label>
                                    <textarea
                                      value={editBlocker}
                                      onChange={(e) => setEditBlocker(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-20"
                                      placeholder="What held you back?"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                {session.dailyIntent && (
                                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                                      <Target size={14} className="mr-1" /> Daily Intent
                                    </div>
                                    <p className="text-sm text-gray-700">{session.dailyIntent}</p>
                                  </div>
                                )}
                                
                                {session.reflections && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {session.reflections.win && (
                                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
                                          <CheckCircle2 size={14} className="mr-1" /> Biggest Win
                                        </div>
                                        <p className="text-sm text-gray-700">{session.reflections.win}</p>
                                      </div>
                                    )}
                                    {session.reflections.blocker && (
                                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                                          <AlertCircle size={14} className="mr-1" /> Blockers
                                        </div>
                                        <p className="text-sm text-gray-700">{session.reflections.blocker}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Activity Timeline */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity Timeline</h4>
                            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                              {session.logs.map((log, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                  </div>
                                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium text-gray-900 text-sm">{log.event}</span>
                                      <span className="font-mono text-xs text-gray-500">{formatTimeShort(log.time)}</span>
                                    </div>
                                    {log.durationMs && (
                                      <div className="text-xs text-gray-500 font-mono">
                                        Duration: {formatDuration(log.durationMs)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
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

      {/* Storage Indicator */}
      <div className="text-center text-xs text-gray-400 py-4">
        {history.length} sessions stored · {storageUsed} KB used · Stores up to {keepDays} days
      </div>
    </motion.div>
  );
};
