import { useState, useEffect, useCallback } from 'react';
import { PomodoroState, CustomAlarm, PomodoroMode } from '../types';

const DEFAULT_POMODORO: PomodoroState = {
  mode: 'work',
  status: 'idle',
  workDuration: 25 * 60 * 1000,
  shortBreakDuration: 5 * 60 * 1000,
  longBreakDuration: 15 * 60 * 1000,
  remainingMs: 25 * 60 * 1000,
  cyclesCompleted: 0,
  endTime: null,
};

// --- Web Audio API & Vibration for loud, persistent alarms ---
let audioCtx: AudioContext | null = null;
let beepInterval: number | null = null;
let vibrateInterval: number | null = null;

const unlockAudio = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.error("Audio context unlock failed", e);
  }
};

const startLoudAlarm = () => {
  try {
    unlockAudio();
    if (beepInterval) clearInterval(beepInterval);
    
    // Create a loud, repeating dual-tone beep
    beepInterval = window.setInterval(() => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.setValueAtTime(1108.73, audioCtx.currentTime + 0.1); // C#6
      
      gain.gain.setValueAtTime(1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }, 500);

    if ('vibrate' in navigator) {
      if (vibrateInterval) clearInterval(vibrateInterval);
      vibrateInterval = window.setInterval(() => {
        navigator.vibrate([300, 200]);
      }, 500);
    }
  } catch (e) {
    console.error("Failed to play audio alarm", e);
  }
};

const stopLoudAlarm = () => {
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
  if (vibrateInterval) {
    clearInterval(vibrateInterval);
    vibrateInterval = null;
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }
};
// -------------------------------------------------------------

export function useTimers() {
  const [ringingAlarm, setRingingAlarm] = useState<{title: string, message: string} | null>(null);

  const [pomodoro, setPomodoro] = useState<PomodoroState>(() => {
    const saved = localStorage.getItem('timelog_pomodoro');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.status === 'running' && parsed.endTime) {
          const now = Date.now();
          if (now >= parsed.endTime) {
            parsed.status = 'idle';
            parsed.remainingMs = 0;
          } else {
            parsed.remainingMs = parsed.endTime - now;
          }
        }
        return parsed;
      } catch (e) {
        return DEFAULT_POMODORO;
      }
    }
    return DEFAULT_POMODORO;
  });

  const [alarms, setAlarms] = useState<CustomAlarm[]>(() => {
    const saved = localStorage.getItem('timelog_alarms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((a: CustomAlarm) => {
          if (a.status === 'running' && a.endTime) {
            const now = Date.now();
            if (now >= a.endTime) {
              a.status = 'finished';
              a.remainingMs = 0;
            } else {
              a.remainingMs = a.endTime - now;
            }
          }
          return a;
        });
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('timelog_pomodoro', JSON.stringify(pomodoro));
  }, [pomodoro]);

  useEffect(() => {
    localStorage.setItem('timelog_alarms', JSON.stringify(alarms));
  }, [alarms]);

  const triggerAlarm = useCallback((title: string, message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/vite.svg' });
    }
    startLoudAlarm();
    setRingingAlarm({ title, message });
  }, []);

  const dismissAlarm = useCallback(() => {
    stopLoudAlarm();
    setRingingAlarm(null);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setPomodoro(prev => {
        if (prev.status !== 'running' || !prev.endTime) return prev;
        
        if (now >= prev.endTime) {
          let nextMode: PomodoroMode = 'work';
          let nextDuration = prev.workDuration;
          let cycles = prev.cyclesCompleted;

          if (prev.mode === 'work') {
            cycles += 1;
            if (cycles % 4 === 0) {
              nextMode = 'longBreak';
              nextDuration = prev.longBreakDuration;
              triggerAlarm('Pomodoro Finished', 'Time for a long break!');
            } else {
              nextMode = 'shortBreak';
              nextDuration = prev.shortBreakDuration;
              triggerAlarm('Pomodoro Finished', 'Time for a short break!');
            }
          } else {
            triggerAlarm('Break Finished', 'Time to get back to work!');
          }

          return {
            ...prev,
            status: 'idle',
            mode: nextMode,
            remainingMs: nextDuration,
            cyclesCompleted: cycles,
            endTime: null,
          };
        }

        return {
          ...prev,
          remainingMs: prev.endTime - now,
        };
      });

      setAlarms(prev => {
        let changed = false;
        const next = prev.map(a => {
          if (a.status !== 'running' || !a.endTime) return a;
          if (now >= a.endTime) {
            changed = true;
            triggerAlarm(a.name, 'Timer has finished!');
            return { ...a, status: 'finished', remainingMs: 0, endTime: null };
          }
          if (Math.abs(a.remainingMs - (a.endTime - now)) > 500) {
              changed = true;
          }
          return { ...a, remainingMs: a.endTime - now };
        });
        return changed ? next : prev;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [triggerAlarm]);

  const togglePomodoro = () => {
    unlockAudio();
    setPomodoro(prev => {
      if (prev.status === 'running') {
        return { ...prev, status: 'paused', endTime: null };
      } else {
        return { ...prev, status: 'running', endTime: Date.now() + prev.remainingMs };
      }
    });
  };

  const resetPomodoro = () => {
    setPomodoro(prev => {
      const duration = prev.mode === 'work' ? prev.workDuration : (prev.mode === 'shortBreak' ? prev.shortBreakDuration : prev.longBreakDuration);
      return { ...prev, status: 'idle', remainingMs: duration, endTime: null };
    });
  };

  const skipPomodoro = () => {
    setPomodoro(prev => {
      let nextMode: PomodoroMode = 'work';
      let nextDuration = prev.workDuration;
      let cycles = prev.cyclesCompleted;

      if (prev.mode === 'work') {
        cycles += 1;
        if (cycles % 4 === 0) {
          nextMode = 'longBreak';
          nextDuration = prev.longBreakDuration;
        } else {
          nextMode = 'shortBreak';
          nextDuration = prev.shortBreakDuration;
        }
      }

      return {
        ...prev,
        status: 'idle',
        mode: nextMode,
        remainingMs: nextDuration,
        cyclesCompleted: cycles,
        endTime: null,
      };
    });
  };

  const setPomodoroMode = (mode: PomodoroMode) => {
    setPomodoro(prev => {
      const duration = mode === 'work' ? prev.workDuration : (mode === 'shortBreak' ? prev.shortBreakDuration : prev.longBreakDuration);
      return { ...prev, mode, status: 'idle', remainingMs: duration, endTime: null };
    });
  };

  const addAlarm = (name: string, durationMs: number) => {
    unlockAudio();
    const newAlarm: CustomAlarm = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      durationMs,
      remainingMs: durationMs,
      status: 'running',
      endTime: Date.now() + durationMs,
    };
    setAlarms(prev => [...prev, newAlarm]);
  };

  const toggleAlarm = (id: string) => {
    unlockAudio();
    setAlarms(prev => prev.map(a => {
      if (a.id !== id) return a;
      if (a.status === 'running') {
        return { ...a, status: 'paused', endTime: null };
      } else if (a.status === 'paused' || a.status === 'idle') {
        return { ...a, status: 'running', endTime: Date.now() + a.remainingMs };
      }
      return a;
    }));
  };

  const resetAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => {
      if (a.id !== id) return a;
      return { ...a, status: 'idle', remainingMs: a.durationMs, endTime: null };
    }));
  };

  const deleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  return {
    pomodoro,
    togglePomodoro,
    resetPomodoro,
    skipPomodoro,
    setPomodoroMode,
    alarms,
    addAlarm,
    toggleAlarm,
    resetAlarm,
    deleteAlarm,
    ringingAlarm,
    dismissAlarm
  };
}
