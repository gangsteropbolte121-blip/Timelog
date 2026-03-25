import React, { useState } from 'react';
import { X, Trash2, HardDrive, Download, Settings as SettingsIcon, Briefcase, Plus, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Project } from '../types';

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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAll,
  storageUsed,
  projects,
  addProject,
  updateProject,
  deleteProject
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectRate, setEditProjectRate] = useState('');

  if (!isOpen) return null;

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const rate = parseFloat(newProjectRate);
    addProject({
      id: Math.random().toString(36).substring(2, 9),
      name: newProjectName.trim(),
      rate: isNaN(rate) ? 0 : rate
    });

    setNewProjectName('');
    setNewProjectRate('');
  };

  const startEditing = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectRate(project.rate.toString());
  };

  const saveEdit = (project: Project) => {
    if (!editProjectName.trim()) return;
    const rate = parseFloat(editProjectRate);
    updateProject({
      ...project,
      name: editProjectName.trim(),
      rate: isNaN(rate) ? 0 : rate
    });
    setEditingProjectId(null);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden my-8"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-center space-x-2">
              <SettingsIcon className="text-gray-400" size={20} />
              <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* Project Manager */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase size={18} className="mr-2 text-indigo-600" />
                Projects & Clients
              </h3>
              
              <form onSubmit={handleAddProject} className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="Project Name"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
                <div className="relative w-24">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    placeholder="Rate"
                    value={newProjectRate}
                    onChange={e => setNewProjectRate(e.target.value)}
                    className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                >
                  <Plus size={20} />
                </button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">No projects added yet.</p>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                      {editingProjectId === project.id ? (
                        <div className="flex-1 flex items-center space-x-2 mr-2">
                          <input
                            type="text"
                            value={editProjectName}
                            onChange={e => setEditProjectName(e.target.value)}
                            className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            autoFocus
                          />
                          <div className="relative w-20">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              value={editProjectRate}
                              onChange={e => setEditProjectRate(e.target.value)}
                              className="w-full pl-5 pr-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900 text-sm">{project.name}</span>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        {editingProjectId !== project.id && (
                          <span className="text-sm text-emerald-600 font-mono font-medium mr-2">${project.rate}/hr</span>
                        )}
                        
                        {editingProjectId === project.id ? (
                          <button
                            onClick={() => saveEdit(project)}
                            className="text-emerald-600 hover:text-emerald-700 transition-colors p-1"
                            title="Save"
                          >
                            <Check size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditing(project)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            if(window.confirm('Delete this project?')) {
                              deleteProject(project.id);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Auto Export */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Auto-export on checkout</h3>
                <p className="text-sm text-gray-500">Automatically download PDF when checking out</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings.autoExport}
                  onChange={(e) => onSaveSettings({ ...settings, autoExport: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Keep History */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Keep history for</h3>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {[30, 60, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => onSaveSettings({ ...settings, keepDays: days })}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                      settings.keepDays === days 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Data Management */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Data Management</h3>
              
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <HardDrive size={16} />
                    <span>Storage used</span>
                  </div>
                  <span className="font-mono font-medium text-gray-900">{storageUsed} KB</span>
                </div>
                
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
                      onClearAll();
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Clear all data</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
