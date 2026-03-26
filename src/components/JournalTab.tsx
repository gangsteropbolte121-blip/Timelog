import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, Trash2, TrendingUp, TrendingDown, Minus, Edit2, Check } from 'lucide-react';
import { Decision } from '../types';

interface JournalTabProps {
  decisions: Decision[];
  addDecision: (decision: Decision) => void;
  updateDecision: (decision: Decision) => void;
  deleteDecision: (id: string) => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({ decisions, addDecision, updateDecision, deleteDecision }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [impact, setImpact] = useState<'Low' | 'Med' | 'High'>('Med');

  const [editingDecisionId, setEditingDecisionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editReasoning, setEditReasoning] = useState('');
  const [editImpact, setEditImpact] = useState<'Low' | 'Med' | 'High'>('Med');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reasoning.trim()) return;

    addDecision({
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      title: title.trim(),
      reasoning: reasoning.trim(),
      impact
    });

    setTitle('');
    setReasoning('');
    setImpact('Med');
    setIsAdding(false);
  };

  const startEditing = (decision: Decision) => {
    setEditingDecisionId(decision.id);
    setEditTitle(decision.title);
    setEditReasoning(decision.reasoning);
    setEditImpact(decision.impact);
  };

  const saveEdit = (decision: Decision) => {
    if (!editTitle.trim() || !editReasoning.trim()) return;
    
    updateDecision({
      ...decision,
      title: editTitle.trim(),
      reasoning: editReasoning.trim(),
      impact: editImpact
    });
    setEditingDecisionId(null);
  };

  const getImpactIcon = (level: 'Low' | 'Med' | 'High') => {
    switch (level) {
      case 'High': return <TrendingUp size={16} className="text-emerald-600" />;
      case 'Med': return <Minus size={16} className="text-amber-600" />;
      case 'Low': return <TrendingDown size={16} className="text-gray-500" />;
    }
  };

  const getImpactBadge = (level: 'Low' | 'Med' | 'High') => {
    switch (level) {
      case 'High': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Med': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low': return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 pb-24"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <BookOpen className="mr-2 text-indigo-600" size={24} />
          Decision Log
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
        >
          <Plus size={20} className={isAdding ? 'rotate-45 transition-transform' : 'transition-transform'} />
        </button>
      </div>

      {isAdding && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-indigo-100 mb-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Decision</label>
            <input
              type="text"
              placeholder="e.g., Raised hourly rate to $100"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reasoning</label>
            <textarea
              placeholder="Why did you make this decision?"
              value={reasoning}
              onChange={e => setReasoning(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm min-h-[80px] resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Expected Impact</label>
            <div className="flex space-x-2">
              {(['Low', 'Med', 'High'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setImpact(level)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    impact === level 
                      ? getImpactBadge(level)
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Save Decision
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {decisions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No decisions logged</h3>
            <p className="text-sm text-gray-500 mt-1">Record strategic shifts and their reasoning.</p>
          </div>
        ) : (
          decisions.map(decision => (
            <div key={decision.id} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative group">
              {editingDecisionId === decision.id ? (
                <div className="space-y-4 pr-12">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold text-gray-900"
                    autoFocus
                  />
                  <textarea
                    value={editReasoning}
                    onChange={e => setEditReasoning(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm min-h-[80px] resize-none"
                  />
                  <div className="flex space-x-2">
                    {(['Low', 'Med', 'High'] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditImpact(level)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          editImpact === level 
                            ? getImpactBadge(level)
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-semibold text-gray-900 pr-8">{decision.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{decision.reasoning}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      {new Date(decision.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={`flex items-center px-2 py-1 rounded-md border ${getImpactBadge(decision.impact)}`}>
                      {getImpactIcon(decision.impact)}
                      <span className="ml-1 font-medium">{decision.impact} Impact</span>
                    </span>
                  </div>
                </>
              )}
              
              <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingDecisionId === decision.id ? (
                  <button
                    onClick={() => saveEdit(decision)}
                    disabled={!editTitle.trim() || !editReasoning.trim()}
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Check size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => startEditing(decision)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => {
                    if(window.confirm('Delete this decision?')) {
                      deleteDecision(decision.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
