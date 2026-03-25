import Dexie, { Table } from 'dexie';
import { HistorySession, Project, Decision, Settings } from './types';

export class TimeLogDB extends Dexie {
  sessions!: Table<HistorySession, string>;
  projects!: Table<Project, string>;
  decisions!: Table<Decision, string>;
  settings!: Table<Settings, number>;

  constructor() {
    super('TimeLogDB');
    this.version(1).stores({
      sessions: 'id, date, projectId, status',
      projects: 'id',
      decisions: 'id, date',
      settings: 'id'
    });
  }
}

export const db = new TimeLogDB();
