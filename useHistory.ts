import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { HistorySession, Settings, Project, Decision } from '../types';

export const useHistory = () => {
  const history = useLiveQuery(() => db.sessions.orderBy('date').reverse().toArray()) || [];
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const decisions = useLiveQuery(() => db.decisions.orderBy('date').reverse().toArray()) || [];
  const settingsArr = useLiveQuery(() => db.settings.toArray());
  const settings = settingsArr?.length ? settingsArr[0] : { autoExport: false, keepDays: 90, id: 1 };

  const [isMigrating, setIsMigrating] = useState(true);

  useEffect(() => {
    const migrateData = async () => {
      const migrated = localStorage.getItem('timelog_migrated_dexie');
      if (!migrated) {
        try {
          // Migrate Projects
          const storedProjects = localStorage.getItem('timelog_projects');
          if (storedProjects) {
            const parsed = JSON.parse(storedProjects);
            if (parsed.length) await db.projects.bulkPut(parsed);
          }
          // Migrate Sessions
          const storedHistory = localStorage.getItem('timelog_history');
          if (storedHistory) {
            const parsed = JSON.parse(storedHistory);
            if (parsed.length) await db.sessions.bulkPut(parsed);
          }
          // Migrate Decisions
          const storedDecisions = localStorage.getItem('timelog_decisions');
          if (storedDecisions) {
            const parsed = JSON.parse(storedDecisions);
            if (parsed.length) await db.decisions.bulkPut(parsed);
          }
          // Migrate Settings
          const storedSettings = localStorage.getItem('timelog_settings');
          if (storedSettings) {
            const parsed = JSON.parse(storedSettings);
            await db.settings.put({ ...parsed, id: 1 });
          }

          localStorage.setItem('timelog_migrated_dexie', 'true');
        } catch (e) {
          console.error('Migration failed', e);
        }
      }
      setIsMigrating(false);
    };
    migrateData();
  }, []);

  const saveSettings = async (newSettings: Settings) => {
    await db.settings.put({ ...newSettings, id: 1 });
  };

  const addSession = async (session: HistorySession) => {
    await db.sessions.put(session);
    
    // Purge old sessions based on keepDays
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.keepDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const oldSessions = await db.sessions.where('date').below(cutoffDateStr).toArray();
    if (oldSessions.length > 0) {
      const oldIds = oldSessions.map(s => s.id);
      await db.sessions.bulkDelete(oldIds);
    }
  };

  const updateSession = async (session: HistorySession) => {
    await db.sessions.put(session);
  };

  const deleteSession = async (id: string) => {
    await db.sessions.delete(id);
  };

  const clearAllHistory = async () => {
    await db.sessions.clear();
  };

  const addProject = async (project: Project) => {
    await db.projects.put(project);
  };

  const updateProject = async (project: Project) => {
    await db.projects.put(project);
  };

  const deleteProject = async (id: string) => {
    await db.projects.delete(id);
  };

  const addDecision = async (decision: Decision) => {
    await db.decisions.put(decision);
  };

  const updateDecision = async (decision: Decision) => {
    await db.decisions.put(decision);
  };

  const deleteDecision = async (id: string) => {
    await db.decisions.delete(id);
  };

  const getStorageUsed = () => {
    return "IndexedDB (Unlimited)";
  };

  return {
    history,
    projects,
    decisions,
    settings,
    saveSettings,
    addSession,
    updateSession,
    deleteSession,
    clearAllHistory,
    addProject,
    updateProject,
    deleteProject,
    addDecision,
    updateDecision,
    deleteDecision,
    getStorageUsed,
    isMigrating
  };
};
