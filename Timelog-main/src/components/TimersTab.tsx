import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward, Plus, Trash2, Bell, RotateCcw, Edit2, Check } from 'lucide-react';
import { useTimers } from '../hooks/useTimers';

interface TimersTabProps {
  timers: ReturnType<typeof useTimers>;
}

export const TimersTab: React.FC<TimersTabProps> = ({ timers }) => {
  const { pomodoro, togglePomodoro, resetPomodoro, skipPomodoro, setPomodoroMode, alarms, addAlarm, toggleAlarm, resetAlarm, deleteAlarm, updateAlarm } = timers;
  const [newAlarmName, setNewAlarmName] = useState('');
  const [newAlarmHours, setNewAlarmHours] = useState('');
  const [newAlarmMinutes, setNewAlarmMinutes] = useState('');
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [editAlarmName, setEditAlarmName] = useState('');
  const [editAlarmHours, setEditAlarmHours] = useState('');
  const [editAlarmMinutes, setEditAlarmMinutes] = useState('');

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(newAlarmHours) || 0;
    const m = parseInt(newAlarmMinutes) || 0;
    const durationMs = (h * 3600 + m * 60) * 1000;
    if (durationMs <= 0) return;
    addAlarm(newAlarmName.trim() || 'Timer', durationMs);
    setNewAlarmName('');
    setNewAlarmHours('');
    setNewAlarmMinutes('');
  };

  const handleQuickPreset = (minutes: number) => {
    addAlarm(`${minutes}m Timer`, minutes * 60 * 1000);
  };

  const saveEditAlarm = (alarmId: string) => {
    const h = parseInt(editAlarmHours) || 0;
    const m = parseInt(editAlarmMinutes) || 0;
    const durationMs = (h * 3600 + m * 60) * 1000;
    if (!editAlarmName.trim() || durationMs <= 0) return;
    updateAlarm(alarmId, editAlarmName.trim(), durationMs);
    setEditingAlarmId(null);
  };

  /* Pomodoro ring math */
  const RADIUS = 90;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const pomodoroTotalMs = pomodoro.mode === 'work' ? 25 * 60000 : pomodoro.mode === 'shortBreak' ? 5 * 60000 : 15 * 60000;
  const progress = pomodoro.status === 'running' ? 1 - (pomodoro.remainingMs / pomodoroTotalMs) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const pomodoroModes = [
    { id: 'work' as const, label: 'Focus', desc: '25 min' },
    { id: 'shortBreak' as const, label: 'Short Break', desc: '5 min' },
    { id: 'longBreak' as const, label: 'Long Break', desc: '15 min' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pb-24">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>Timers</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Pomodoro & custom countdowns.</p>
      </div>

      {/* ── Pomodoro ────────────────────────────────────────── */}
      <div className="tl-card p-6 flex flex-col items-center">
        {/* Mode switcher */}
        <div className="flex gap-1.5 mb-6 p-1 rounded-xl" style={{ background: 'var(--color-surface-low)' }}>
          {pomodoroModes.map(({ id, label }) => (
            <button key={id} onClick={() => setPomodoroMode(id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{ background: pomodoro.mode === id ? 'var(--color-hero)' : 'transparent', color: pomodoro.mode === id ? 'white' : 'var(--color-text-secondary)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Ring */}
        <div className="relative w-52 h-52 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Track */}
            <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="var(--color-surface-mid)" strokeWidth="10" />
            {/* Progress */}
            <circle
              cx="100" cy="100" r={RADIUS}
              fill="none"
              stroke={pomodoro.mode === 'work' ? 'var(--color-accent)' : 'var(--color-success)'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-mono tracking-tight" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.04em' }}>
              {formatTime(pomodoro.remainingMs)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {pomodoro.mode === 'work' ? 'Focus' : 'Break'} · Session {pomodoro.cyclesCompleted + 1}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <motion.button 
            onClick={resetPomodoro} 
            className="p-3 rounded-xl tl-btn-ghost" 
            title="Reset"
            whileHover={{ scale: 1.05, background: 'var(--color-surface-mid)' }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </motion.button>
          <motion.button
            onClick={togglePomodoro}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all"
            style={{ background: 'var(--color-accent)', boxShadow: '0 4px 16px rgba(232,40,74,0.3)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {pomodoro.status === 'running' ? <Pause size={24} /> : <Play size={24} />}
          </motion.button>
          <motion.button 
            onClick={skipPomodoro} 
            className="p-3 rounded-xl tl-btn-ghost" 
            title="Skip"
            whileHover={{ scale: 1.05, background: 'var(--color-surface-mid)' }}
            whileTap={{ scale: 0.95 }}
          >
            <SkipForward size={18} style={{ color: 'var(--color-text-secondary)' }} />
          </motion.button>
        </div>
      </div>

      {/* ── Custom Alarms ─────────────────────────────────── */}
      <div className="tl-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: 'var(--color-accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Custom Timers</span>
          </div>
        </div>

        {/* Quick presets */}
        <div className="px-5 pt-4 pb-3 flex flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider self-center mr-1" style={{ color: 'var(--color-text-muted)' }}>Quick:</span>
          {[5, 10, 15, 30, 60].map(m => (
            <motion.button 
              key={m} 
              onClick={() => handleQuickPreset(m)} 
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-secondary)' }}
              whileHover={{ scale: 1.05, background: 'var(--color-surface-mid)' }}
              whileTap={{ scale: 0.95 }}
            >
              {m}m
            </motion.button>
          ))}
        </div>

        {/* Add alarm form */}
        <form onSubmit={handleAddAlarm} className="px-5 pb-4 flex flex-wrap items-end gap-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Timer Name</label>
            <input type="text" placeholder="Custom Timer" value={newAlarmName} onChange={e => setNewAlarmName(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div className="flex gap-2 items-end">
            <div className="w-20">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Hours</label>
              <input type="number" placeholder="0" min="0" value={newAlarmHours} onChange={e => setNewAlarmHours(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none text-center" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div className="w-20">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Minutes</label>
              <input type="number" placeholder="25" min="0" max="59" value={newAlarmMinutes} onChange={e => setNewAlarmMinutes(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none text-center" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <button type="submit" className="p-2.5 rounded-xl text-white flex items-center justify-center tl-btn-primary shrink-0">
              <Plus size={18} />
            </button>
          </div>
        </form>

        {/* Alarm list */}
        <div>
          {alarms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No timers yet. Use quick presets above or create a custom one.</p>
            </div>
          ) : (
            alarms.map((alarm, i) => (
              <div key={alarm.id} className="flex items-center justify-between px-5 py-3.5 group tl-tonal-row" style={{ borderTop: '1px solid var(--color-border)' }}>
                {editingAlarmId === alarm.id ? (
                  <div className="flex-1 flex flex-wrap items-center gap-2 mr-4">
                    <input value={editAlarmName} onChange={e => setEditAlarmName(e.target.value)} className="flex-1 min-w-32 px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                    <input type="number" value={editAlarmHours} onChange={e => setEditAlarmHours(e.target.value)} className="w-14 px-2 py-1.5 rounded-lg text-xs text-center focus:outline-none" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} placeholder="h" min="0" />
                    <input type="number" value={editAlarmMinutes} onChange={e => setEditAlarmMinutes(e.target.value)} className="w-14 px-2 py-1.5 rounded-lg text-xs text-center focus:outline-none" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} placeholder="m" min="0" max="59" />
                    <button onClick={() => saveEditAlarm(alarm.id)} className="p-1.5 rounded" style={{ color: 'var(--color-success)' }}><Check size={14} /></button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{alarm.name}</span>
                      {alarm.status === 'finished' ? (
                        <span className="tl-pill tl-pill-success">Done</span>
                      ) : alarm.status === 'running' ? (
                        <span className="tl-pill tl-pill-accent flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full tl-pulse" style={{ background: 'var(--color-accent)' }} /> Running
                        </span>
                      ) : (
                        <span className="tl-pill tl-pill-muted">Idle</span>
                      )}
                    </div>
                    <span className="text-xl font-bold font-mono mt-1 block" style={{ color: alarm.status === 'finished' ? 'var(--color-success)' : 'var(--color-text-primary)' }}>
                      {formatTime(alarm.remainingMs)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0">
                  {alarm.status !== 'finished' && !editingAlarmId && (
                    <button onClick={() => toggleAlarm(alarm.id)} className="p-2 rounded-xl text-white" style={{ background: alarm.status === 'running' ? 'var(--color-hero)' : 'var(--color-accent)', boxShadow: alarm.status === 'running' ? 'none' : '0 2px 8px rgba(232,40,74,0.25)' }}>
                      {alarm.status === 'running' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                  )}
                  {alarm.status === 'finished' && (
                    <button onClick={() => resetAlarm(alarm.id)} className="p-2 rounded-xl" style={{ background: 'var(--color-surface-low)', color: 'var(--color-text-secondary)' }}>
                      <RotateCcw size={16} />
                    </button>
                  )}
                  {!editingAlarmId && (
                    <button onClick={() => { setEditingAlarmId(alarm.id); setEditAlarmName(alarm.name); const h = Math.floor(alarm.durationMs / 3600000); const m = Math.floor((alarm.durationMs % 3600000) / 60000); setEditAlarmHours(h.toString()); setEditAlarmMinutes(m.toString()); }} className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button onClick={() => deleteAlarm(alarm.id)} className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};
