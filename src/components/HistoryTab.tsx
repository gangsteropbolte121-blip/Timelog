import React, { useState, useMemo } from 'react';
import { Download, Trash2, ChevronDown, ChevronUp, FileJson, FileText, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HistorySession } from '../types';
import { formatDuration, formatTimeShort, exportPDF, downloadJSON } from '../utils';

interface HistoryTabProps {
  history: HistorySession[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onDownloadAll: () => void;
  storageUsed: string;
  keepDays: number;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ 
  history, 
  onDelete, 
  onClearAll, 
  onDownloadAll,
  storageUsed,
  keepDays
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter(session => {
      // Status filter
      if (filter === 'complete' && session.status !== 'complete') return false;
      if (filter === 'incomplete' && session.status !== 'incomplete') return false;

      // Date filter
      if (fromDate && session.date < fromDate) return false;
      if (toDate && session.date > toDate) return false;

      return true;
    });
  }, [history, filter, fromDate, toDate]);

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-24"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Logs</h2>
        <div className="flex space-x-2">
          <button 
            onClick={onDownloadAll}
            disabled={history.length === 0}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            title="Download All (JSON)"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            disabled={history.length === 0}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Clear All"
          >
            <Trash2 size={20} />
          </button>
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Yes, delete all
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('complete')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Full Days
          </button>
          <button 
            onClick={() => setFilter('incomplete')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'incomplete' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Incomplete
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <span className="text-gray-400 text-sm">to</span>
          <div className="flex-1">
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Card Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col space-y-3"
                    onClick={() => toggleExpand(session.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{session.dateFormatted}</h3>
                          {dayLabel && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium">
                              {dayLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {session.status === 'complete' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Complete</span>
                          ) : session.status === 'incomplete' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Incomplete</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">No Activity</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); exportPDF(session, session.date); }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                          title="Download PDF"
                        >
                          <FileText size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadJSON(session, `timelog_${session.date}.json`); }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                          title="Download JSON"
                        >
                          <FileJson size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="p-1.5 text-gray-400">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-gray-500 text-xs font-medium mb-0.5">Check-in</div>
                        <div className="font-mono text-gray-900">{session.checkInTime ? formatTimeShort(session.checkInTime) : '-'}</div>
                      </div>
                      <div className="bg-indigo-50 rounded p-2 text-center">
                        <div className="text-indigo-600 text-xs font-medium mb-0.5">Effective</div>
                        <div className="font-mono text-indigo-900 font-bold">{formatDuration(session.summary.effectiveHours)}</div>
                      </div>
                      <div className="bg-amber-50 rounded p-2 text-center">
                        <div className="text-amber-600 text-xs font-medium mb-0.5">Breaks ({session.summary.breakCount})</div>
                        <div className="font-mono text-amber-900">{formatDuration(session.summary.totalBreak)}</div>
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
                        <div className="p-4">
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
