import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward, Plus, Trash2, Bell, RotateCcw } from 'lucide-react';
import { useTimers } from '../hooks/useTimers';

interface TimersTabProps {
  timers: ReturnType<typeof useTimers>;
}

export function TimersTab({ timers }: TimersTabProps) {
  const {
    pomodoro,
    togglePomodoro,
    resetPomodoro,
    skipPomodoro,
    setPomodoroMode,
    alarms,
    addAlarm,
    toggleAlarm,
    resetAlarm,
    deleteAlarm
  } = timers;

  const [newAlarmName, setNewAlarmName] = useState('');
  const [newAlarmHours, setNewAlarmHours] = useState('');
  const [newAlarmMinutes, setNewAlarmMinutes] = useState('');

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(newAlarmHours) || 0;
    const m = parseInt(newAlarmMinutes) || 0;
    const durationMs = (h * 3600 + m * 60) * 1000;
    
    if (durationMs > 0 && newAlarmName.trim()) {
      addAlarm(newAlarmName.trim(), durationMs);
      setNewAlarmName('');
      setNewAlarmHours('');
      setNewAlarmMinutes('');
    }
  };

  const pomodoroProgress = 1 - (pomodoro.remainingMs / (
    pomodoro.mode === 'work' ? pomodoro.workDuration : 
    (pomodoro.mode === 'shortBreak' ? pomodoro.shortBreakDuration : pomodoro.longBreakDuration)
  ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-24"
    >
      {/* Pomodoro Section */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="mr-2 text-indigo-600" size={20} />
          Pomodoro Timer
        </h2>

        <div className="flex justify-center space-x-2 mb-6">
          {(['work', 'shortBreak', 'longBreak'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setPomodoroMode(mode)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                pomodoro.mode === mode 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {mode === 'work' ? 'Work' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                className="stroke-gray-100"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                className="stroke-indigo-600 transition-all duration-1000 ease-linear"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - pomodoroProgress)}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <div className="text-4xl font-mono font-bold text-gray-900 tracking-tight">
                {formatTime(pomodoro.remainingMs)}
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">
                {pomodoro.mode === 'work' ? 'Focus' : 'Break'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={togglePomodoro}
            className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md"
          >
            {pomodoro.status === 'running' ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <button
            onClick={resetPomodoro}
            className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={skipPomodoro}
            className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>

      {/* Custom Alarms Section */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Reminders</h2>
        
        <form onSubmit={handleAddAlarm} className="mb-6 space-y-3">
          <div>
            <input
              type="text"
              placeholder="Reminder name (e.g., Take a walk)"
              value={newAlarmName}
              onChange={e => setNewAlarmName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              required
            />
          </div>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Hours"
              min="0"
              value={newAlarmHours}
              onChange={e => setNewAlarmHours(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
            <input
              type="number"
              placeholder="Minutes"
              min="0"
              max="59"
              value={newAlarmMinutes}
              onChange={e => setNewAlarmMinutes(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={!newAlarmName.trim() || (!newAlarmHours && !newAlarmMinutes)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {alarms.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              No active reminders.
            </div>
          ) : (
            alarms.map(alarm => (
              <div key={alarm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{alarm.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {alarm.status === 'finished' ? (
                      <span className="text-indigo-600 font-medium">Finished</span>
                    ) : (
                      <span className="font-mono">{formatTime(alarm.remainingMs)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {alarm.status !== 'finished' && (
                    <button
                      onClick={() => toggleAlarm(alarm.id)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      {alarm.status === 'running' ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                  )}
                  {alarm.status === 'finished' && (
                    <button
                      onClick={() => resetAlarm(alarm.id)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <RotateCcw size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlarm(alarm.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
