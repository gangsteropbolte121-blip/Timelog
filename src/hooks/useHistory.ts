import { useState, useEffect } from 'react';
import { HistorySession, Settings } from '../types';

export const useHistory = () => {
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [settings, setSettings] = useState<Settings>({
    autoExport: false,
    keepDays: 90,
  });

  useEffect(() => {
    const storedHistory = localStorage.getItem('timelog_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }

    const storedSettings = localStorage.getItem('timelog_settings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  const saveHistory = (newHistory: HistorySession[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('timelog_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history (quota exceeded?)', e);
    }
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('timelog_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  const addSession = (session: HistorySession) => {
    const updatedHistory = [session, ...history];
    
    // Purge old sessions based on keepDays
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.keepDays);
    
    const filteredHistory = updatedHistory.filter(s => new Date(s.date) >= cutoffDate);
    saveHistory(filteredHistory);
  };

  const deleteSession = (id: string) => {
    const updatedHistory = history.filter(s => s.id !== id);
    saveHistory(updatedHistory);
  };

  const clearAllHistory = () => {
    saveHistory([]);
  };

  const getStorageUsed = () => {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('timelog_')) {
        totalBytes += (localStorage.getItem(key)?.length || 0) * 2; // UTF-16 characters are 2 bytes
      }
    }
    return (totalBytes / 1024).toFixed(1);
  };

  return {
    history,
    settings,
    saveSettings,
    addSession,
    deleteSession,
    clearAllHistory,
    getStorageUsed,
  };
};
