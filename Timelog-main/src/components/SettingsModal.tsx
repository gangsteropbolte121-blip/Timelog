import React, { useState } from 'react';
import { X, Trash2, HardDrive, Settings as SettingsIcon, Briefcase, Plus, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Project, Currency, CURRENCY_SYMBOLS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onClearAll: () => void;
  storageUsed: string;
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSaveSettings, onClearAll, storageUsed, projects, addProject, updateProject, deleteProject }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'general' | 'data'>('projects');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('');
  const [newProjectCurrency, setNewProjectCurrency] = useState<Currency>('INR');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectRate, setEditProjectRate] = useState('');
  const [editProjectCurrency, setEditProjectCurrency] = useState<Currency>('INR');

  if (!isOpen) return null;

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const rate = parseFloat(newProjectRate);
    addProject({ id: Math.random().toString(36).substring(2, 9), name: newProjectName.trim(), rate: isNaN(rate) ? 0 : rate, currency: newProjectCurrency });
    setNewProjectName('');
    setNewProjectRate('');
  };

  const saveEdit = (project: Project) => {
    if (!editProjectName.trim()) return;
    const rate = parseFloat(editProjectRate);
    updateProject({ ...project, name: editProjectName.trim(), rate: isNaN(rate) ? 0 : rate, currency: editProjectCurrency });
    setEditingProjectId(null);
  };

  const tabs = [
    { id: 'projects' as const, label: 'Projects' },
    { id: 'general' as const, label: 'General' },
    { id: 'data' as const, label: 'Data' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md my-4 flex flex-col"
          style={{ background: 'var(--color-surface)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', maxHeight: '85vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            <div className="flex items-center gap-2">
              <SettingsIcon size={18} style={{ color: 'var(--color-text-muted)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Settings</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg transition-all" style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-low)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-6 gap-0 mb-0 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {tabs.map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)} className="px-4 py-2.5 text-xs font-semibold transition-all relative" style={{ color: activeTab === id ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                {label}
                {activeTab === id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: 'var(--color-accent)' }} />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* Projects tab */}
            {activeTab === 'projects' && (
              <div className="space-y-4">
                <form onSubmit={handleAddProject} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                  <select
                    value={newProjectCurrency}
                    onChange={e => setNewProjectCurrency(e.target.value as Currency)}
                    className="w-20 px-2 py-2 rounded-xl text-sm focus:outline-none shrink-0"
                    style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                      <option key={code} value={code}>{symbol} {code}</option>
                    ))}
                  </select>
                  <div className="relative w-20 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{CURRENCY_SYMBOLS[newProjectCurrency]}</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProjectRate}
                      onChange={e => setNewProjectRate(e.target.value)}
                      min="0" step="0.01"
                      className="w-full pl-6 pr-2 py-2 rounded-xl text-sm focus:outline-none"
                      style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <button type="submit" className="p-2.5 rounded-xl text-white tl-btn-primary shrink-0">
                    <Plus size={18} />
                  </button>
                </form>

                {projects.length === 0 ? (
                  <div className="text-center py-8 rounded-xl" style={{ background: 'var(--color-surface-low)', border: '1px dashed var(--color-border-solid)' }}>
                    <Briefcase size={20} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No projects added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.map(project => (
                      <div key={project.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)' }}>
                        {editingProjectId === project.id ? (
                          <div className="flex-1 flex items-center gap-2 mr-2">
                            <input value={editProjectName} onChange={e => setEditProjectName(e.target.value)} autoFocus className="flex-1 px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                            <select
                              value={editProjectCurrency}
                              onChange={e => setEditProjectCurrency(e.target.value as Currency)}
                              className="w-18 px-1 py-1.5 rounded-lg text-xs focus:outline-none shrink-0"
                              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                            >
                              {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                                <option key={code} value={code}>{symbol}</option>
                              ))}
                            </select>
                            <div className="relative w-16 shrink-0">
                              <input type="number" value={editProjectRate} onChange={e => setEditProjectRate(e.target.value)} className="w-full pl-2 pr-2 py-1.5 rounded-lg text-sm focus:outline-none" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} min="0" step="0.01" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{project.name}</span>
                            <span className="text-xs ml-2 font-mono font-semibold" style={{ color: 'var(--color-success)' }}>{CURRENCY_SYMBOLS[project.currency]}{project.rate}/hr</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          {editingProjectId === project.id ? (
                            <button onClick={() => saveEdit(project)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-success)', background: 'var(--color-success-muted)' }}><Check size={14} /></button>
                          ) : (
                            <button onClick={() => { setEditingProjectId(project.id); setEditProjectName(project.name); setEditProjectRate(project.rate.toString()); setEditProjectCurrency(project.currency); }} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-muted)' }}><Edit2 size={14} /></button>
                          )}
                          <button onClick={() => { if (window.confirm('Delete this project?')) deleteProject(project.id); }} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-muted)' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* General tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Auto-export toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Auto-export on checkout</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Auto-download PDF when checking out</p>
                  </div>
                  <button
                    onClick={() => onSaveSettings({ ...settings, autoExport: !settings.autoExport })}
                    className="relative w-11 h-6 rounded-full transition-colors"
                    style={{ background: settings.autoExport ? 'var(--color-accent)' : 'var(--color-surface-high)' }}
                  >
                    <span className="absolute top-0.5 transition-all" style={{ left: settings.autoExport ? 'calc(100% - 22px)' : '2px', width: 20, height: 20, background: 'white', borderRadius: '50%', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                {/* Keep days */}
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Keep history for</h3>
                  <div className="flex gap-2">
                    {[30, 60, 90].map(days => (
                      <button
                        key={days}
                        onClick={() => onSaveSettings({ ...settings, keepDays: days })}
                        className="flex-1 py-2 text-sm font-semibold rounded-xl transition-all"
                        style={{
                          background: settings.keepDays === days ? 'var(--color-hero)' : 'var(--color-surface-low)',
                          color: settings.keepDays === days ? 'white' : 'var(--color-text-secondary)'
                        }}
                      >
                        {days}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Data tab */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2">
                    <HardDrive size={15} style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Storage used</span>
                  </div>
                  <span className="text-sm font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{storageUsed} KB</span>
                </div>

                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(232,40,74,0.05)', border: '1px solid rgba(232,40,74,0.15)' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>Danger Zone</h4>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>This will permanently delete all sessions, decisions, and projects. This action cannot be undone.</p>
                  <button
                    onClick={() => { if (window.confirm('Delete all data? This cannot be undone.')) { onClearAll(); onClose(); } }}
                    className="w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--color-surface)', border: '1px solid rgba(232,40,74,0.3)', color: 'var(--color-accent)' }}
                  >
                    <Trash2 size={15} /> Clear All Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
