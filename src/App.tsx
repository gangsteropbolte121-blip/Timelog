import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, RotateCcw, Circle, CheckCircle2, Clock, Play, Pause, Square } from 'lucide-react';

type Status = 'idle' | 'working' | 'on_break' | 'checked_out';

interface BreakSession {
  start: number;
  end: number | null;
}

interface LogEntry {
  time: number;
  event: string;
  type: 'check_in' | 'break_start' | 'break_end' | 'check_out';
  durationMs?: number;
}

interface SessionState {
  status: Status;
  checkInTime: number | null;
  checkOutTime: number | null;
  breaks: BreakSession[];
  logs: LogEntry[];
}

const initialState: SessionState = {
  status: 'idle',
  checkInTime: null,
  checkOutTime: null,
  breaks: [],
  logs: []
};

const getDateKey = () => {
  const d = new Date();
  return `timelog_session_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDuration = (ms: number) => {
  if (ms < 0) ms = 0;
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
};

const formatClock = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTimeShort = (ms: number) => {
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function App() {
  const [session, setSession] = useState<SessionState>(initialState);
  const [now, setNow] = useState<number>(Date.now());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const key = getDateKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded) {
      const key = getDateKey();
      localStorage.setItem(key, JSON.stringify(session));
    }
  }, [session, isLoaded]);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = () => {
    const time = Date.now();
    setSession(prev => ({
      ...prev,
      status: 'working',
      checkInTime: time,
      logs: [{ time, event: 'Checked in', type: 'check_in' }]
    }));
  };

  const handleBreakStart = () => {
    const time = Date.now();
    setSession(prev => ({
      ...prev,
      status: 'on_break',
      breaks: [...prev.breaks, { start: time, end: null }],
      logs: [...prev.logs, { time, event: 'Started break', type: 'break_start' }]
    }));
  };

  const handleBreakEnd = () => {
    const time = Date.now();
    setSession(prev => {
      const newBreaks = [...prev.breaks];
      const lastBreak = newBreaks[newBreaks.length - 1];
      if (lastBreak && !lastBreak.end) {
        lastBreak.end = time;
      }
      const duration = time - lastBreak.start;
      return {
        ...prev,
        status: 'working',
        breaks: newBreaks,
        logs: [...prev.logs, { time, event: 'Returned from break', type: 'break_end', durationMs: duration }]
      };
    });
  };

  const handleCheckOut = () => {
    const time = Date.now();
    setSession(prev => {
      let newBreaks = [...prev.breaks];
      let newLogs = [...prev.logs];
      
      // Auto-close open break
      if (prev.status === 'on_break') {
        const lastBreak = newBreaks[newBreaks.length - 1];
        if (lastBreak && !lastBreak.end) {
          lastBreak.end = time;
          const duration = time - lastBreak.start;
          newLogs.push({ time, event: 'Returned from break (Auto)', type: 'break_end', durationMs: duration });
        }
      }

      const totalSessionMs = time - (prev.checkInTime || time);
      newLogs.push({ time, event: 'Checked out', type: 'check_out', durationMs: totalSessionMs });

      return {
        ...prev,
        status: 'checked_out',
        checkOutTime: time,
        breaks: newBreaks,
        logs: newLogs
      };
    });
  };

  const handleNewDay = () => {
    if (window.confirm("Are you sure you want to start a new day? This will clear today's log.")) {
      setSession(initialState);
      localStorage.removeItem(getDateKey());
    }
  };

  const exportPDF = () => {
    if (session.status !== 'checked_out') {
      alert("Please complete your day by checking out before exporting.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setTextColor(79, 70, 229); // #4F46E5
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("TimeLog", pageWidth / 2, 20, { align: "center" });
    
    doc.setTextColor(107, 114, 128); // #6B7280
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Daily Attendance Report", pageWidth / 2, 28, { align: "center" });

    doc.setDrawColor(229, 231, 235); // #E5E7EB
    doc.setLineWidth(0.5);
    doc.line(20, 35, pageWidth - 20, 35);

    // Date & Time
    doc.setTextColor(17, 24, 39); // #111827
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(new Date(session.checkInTime || Date.now()))}`, pageWidth - 20, 45, { align: 'right' });
    doc.text(`Export time: ${formatTimeShort(Date.now())}`, pageWidth - 20, 52, { align: 'right' });

    // Summary Box
    doc.setFillColor(249, 250, 251); // #F9FAFB
    doc.roundedRect(20, 60, pageWidth - 40, 50, 3, 3, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 25, 68);
    
    doc.setFont("helvetica", "normal");
    const checkInStr = session.checkInTime ? formatTimeShort(session.checkInTime) : '-';
    const checkOutStr = session.checkOutTime ? formatTimeShort(session.checkOutTime) : '-';
    
    doc.text(`Check-in: ${checkInStr}`, 25, 78);
    doc.text(`Check-out: ${checkOutStr}`, 25, 85);
    doc.text(`Total session: ${formatDuration(totalSessionMs)}`, 25, 92);
    
    doc.text(`Break time: ${formatDuration(totalBreakMs)}`, pageWidth / 2, 78);
    doc.text(`Effective hours: ${formatDuration(effectiveMs)}`, pageWidth / 2, 85);
    doc.text(`Number of breaks: ${session.breaks.length}`, pageWidth / 2, 92);

    // Activity Log Table
    doc.setFont("helvetica", "bold");
    doc.text("Activity Log", 20, 125);
    
    doc.setFillColor(79, 70, 229); // #4F46E5
    doc.setTextColor(255, 255, 255);
    doc.rect(20, 130, pageWidth - 40, 10, 'F');
    
    doc.setFontSize(10);
    doc.text("Time", 25, 137);
    doc.text("Event", 60, 137);
    doc.text("Duration", pageWidth - 45, 137);

    doc.setTextColor(17, 24, 39); // #111827
    doc.setFont("helvetica", "normal");
    
    let y = 147;
    session.logs.forEach((log, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(249, 250, 251); // #F9FAFB
        doc.rect(20, y - 6, pageWidth - 40, 10, 'F');
      }
      
      doc.text(formatTimeShort(log.time), 25, y);
      doc.text(log.event, 60, y);
      if (log.durationMs) {
        doc.text(formatDuration(log.durationMs), pageWidth - 45, y);
      }
      
      y += 10;
      
      // Add new page if needed
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(229, 231, 235); // #E5E7EB
    doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
    
    doc.setTextColor(107, 114, 128); // #6B7280
    doc.setFontSize(8);
    doc.text("Generated by TimeLog · Personal Time Tracker", pageWidth / 2, pageHeight - 12, { align: "center" });

    doc.save(`TimeLog_${getDateKey()}.pdf`);
  };

  // Calculations
  const totalBreakMs = session.breaks.reduce((acc, b) => {
    const end = b.end || (session.status === 'on_break' ? now : b.start);
    return acc + (end - b.start);
  }, 0);

  const totalSessionMs = session.checkInTime 
    ? ((session.checkOutTime || now) - session.checkInTime) 
    : 0;
    
  const effectiveMs = Math.max(0, totalSessionMs - totalBreakMs);

  // Status UI helpers
  const getStatusDisplay = () => {
    switch (session.status) {
      case 'idle': return { color: 'bg-green-500', text: 'Ready to start' };
      case 'working': return { color: 'bg-green-500', text: 'Currently working' };
      case 'on_break': return { color: 'bg-amber-500', text: 'On break' };
      case 'checked_out': return { color: 'bg-gray-400', text: 'Day complete' };
    }
  };

  const statusDisplay = getStatusDisplay();

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-gray-900 font-sans p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-[480px] space-y-6">
        
        {/* SECTION 1: LIVE CLOCK CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <div className="text-gray-500 text-sm font-medium mb-6">
            {formatDate(new Date(now))}
          </div>
          
          <div className="text-5xl md:text-[52px] font-bold text-indigo-600 font-mono tracking-tight tabular-nums mb-4">
            {formatClock(new Date(now))}
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-1.5 rounded-full mb-8">
            <div className={`w-2.5 h-2.5 rounded-full ${statusDisplay.color}`}></div>
            <span className="text-sm font-medium text-gray-700">{statusDisplay.text}</span>
          </div>

          <div className="w-full space-y-3">
            {session.status === 'idle' && (
              <button 
                onClick={handleCheckIn}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Check In
              </button>
            )}
            
            {session.status === 'working' && (
              <>
                <button 
                  onClick={handleBreakStart}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Pause className="w-4 h-4" /> Go on Break
                </button>
                <button 
                  onClick={handleCheckOut}
                  className="w-full h-12 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" /> Check Out
                </button>
              </>
            )}

            {session.status === 'on_break' && (
              <>
                <button 
                  onClick={handleBreakEnd}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Return from Break
                </button>
                <button 
                  onClick={handleCheckOut}
                  className="w-full h-12 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" /> Check Out
                </button>
              </>
            )}

            {session.status === 'checked_out' && (
              <button 
                disabled
                className="w-full h-12 bg-gray-100 text-gray-400 font-medium rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Checked Out
              </button>
            )}
          </div>

          <div className="w-full mt-8 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
            <div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Check-in</div>
              <div className="text-sm font-semibold text-gray-800">
                {session.checkInTime ? formatTimeShort(session.checkInTime) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Break</div>
              <div className="text-sm font-semibold text-gray-800">
                {session.checkInTime ? formatDuration(totalBreakMs) : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total</div>
              <div className="text-sm font-semibold text-gray-800">
                {session.checkInTime ? formatDuration(totalSessionMs) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: TODAY'S ACTIVITY LOG */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-semibold text-gray-800">Today's Log</h2>
            <span className="text-xs text-gray-500 font-medium">{formatDate(new Date(now))}</span>
          </div>
          
          <div className="p-6 max-h-[300px] overflow-y-auto">
            {session.logs.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Your activity will appear here after you check in.
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {session.logs.map((log, i) => {
                  let iconColor = 'text-gray-400';
                  let bgColor = 'bg-gray-100';
                  
                  if (log.type === 'check_in') { iconColor = 'text-green-500'; bgColor = 'bg-green-100'; }
                  if (log.type === 'break_start') { iconColor = 'text-amber-500'; bgColor = 'bg-amber-100'; }
                  if (log.type === 'break_end') { iconColor = 'text-blue-500'; bgColor = 'bg-blue-100'; }
                  if (log.type === 'check_out') { iconColor = 'text-gray-500'; bgColor = 'bg-gray-200'; }

                  return (
                    <div key={i} className="relative flex items-start gap-4">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bgColor}`}>
                        <Circle className={`w-3 h-3 fill-current ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-semibold text-sm text-gray-800">{log.event}</span>
                          <span className="text-xs text-gray-500 font-medium shrink-0 ml-2">{formatTimeShort(log.time)}</span>
                        </div>
                        {log.durationMs && (
                          <div className="text-xs text-gray-500">
                            Duration: {formatDuration(log.durationMs)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: SUMMARY CARD */}
        {session.status === 'checked_out' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-semibold text-gray-800">Daily Summary</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Effective Hours</div>
                <div className="text-xl font-semibold text-indigo-600">{formatDuration(effectiveMs)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Total Break Time</div>
                <div className="text-xl font-semibold text-gray-800">{formatDuration(totalBreakMs)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Total Session</div>
                <div className="text-xl font-semibold text-gray-800">{formatDuration(totalSessionMs)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Breaks Taken</div>
                <div className="text-xl font-semibold text-gray-800">{session.breaks.length}</div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button 
                onClick={exportPDF}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> Export Log (PDF)
              </button>
              <button 
                onClick={handleNewDay}
                className="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Start New Day
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
