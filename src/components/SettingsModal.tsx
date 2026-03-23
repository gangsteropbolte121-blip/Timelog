import React from 'react';
import { X, Trash2, HardDrive, Download, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onClearAll: () => void;
  storageUsed: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAll,
  storageUsed
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
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

          <div className="p-6 space-y-6">
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
