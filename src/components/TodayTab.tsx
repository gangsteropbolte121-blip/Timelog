import React, { useState, useEffect } from 'react';
import { Play, Square, Coffee, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { SessionState, HistorySession, Settings } from '../types';
import { formatDuration, formatClock, formatDate, exportPDF, getDateKey } from '../utils';

interface TodayTabProps {
  session: SessionState;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;
  onCheckOut: (session: SessionState) => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({ session, setSession, onCheckOut }) => {
  const [now, setNow] = useState(new Date());

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
      logs: [{ time: Date.now(), event: 'Checked in', type: 'check_in' }]
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

  const handleCheckOut = () => {
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
        logs: [...prev.logs, { 
          time: checkOutTime, 
          event: 'Checked out', 
          type: 'check_out',
          durationMs: prev.checkInTime ? checkOutTime - prev.checkInTime : 0
        }]
      };
      
      onCheckOut(updatedSession);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Live Clock Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center space-y-2">
        <p className="text-gray-500 font-medium">{formatDate(now)}</p>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight font-mono">
          {formatClock(now)}
        </h1>
        <div className="mt-4">
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
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {session.status === 'idle' || session.status === 'checked_out' ? (
          <button
            onClick={handleCheckIn}
            className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 flex items-center justify-center space-x-2 transition-colors font-medium shadow-sm"
          >
            <Play size={20} />
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
              onClick={handleCheckOut}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-4 flex items-center justify-center space-x-2 transition-colors font-medium shadow-sm"
            >
              <Square size={20} />
              <span>Check Out</span>
            </button>
          </>
        )}
      </div>

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
                onClick={() => exportPDF(session, getDateKey(new Date(session.checkInTime || Date.now())))}
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
    </motion.div>
  );
};
