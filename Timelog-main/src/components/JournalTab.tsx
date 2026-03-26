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
    addDecision({ id: Math.random().toString(36).substring(2, 9), date: new Date().toISOString(), title: title.trim(), reasoning: reasoning.trim(), impact });
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
    updateDecision({ ...decision, title: editTitle.trim(), reasoning: editReasoning.trim(), impact: editImpact });
    setEditingDecisionId(null);
  };

  /* Impact styling: High=crimson (significant), Med=amber (notable), Low=gray (minor) */
  const getImpactBorderColor = (level: 'Low' | 'Med' | 'High') => {
    if (level === 'High') return 'var(--color-accent)';
    if (level === 'Med') return 'var(--color-warn)';
    return 'var(--color-surface-high)';
  };

  const getImpactPillClass = (level: 'Low' | 'Med' | 'High') => {
    if (level === 'High') return 'tl-pill tl-pill-accent';
    if (level === 'Med') return 'tl-pill tl-pill-warn';
    return 'tl-pill tl-pill-muted';
  };

  const getImpactIcon = (level: 'Low' | 'Med' | 'High') => {
    if (level === 'High') return <TrendingUp size={12} />;
    if (level === 'Med') return <Minus size={12} />;
    return <TrendingDown size={12} />;
  };

  const impactButtonStyle = (level: 'Low' | 'Med' | 'High', selected: boolean) => {
    const base = 'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all';
    if (!selected) return `${base} hover:opacity-80`;
    if (level === 'High') return `${base}`;
    if (level === 'Med') return `${base}`;
    return `${base}`;
  };

  const impactButtonInlineStyle = (level: 'Low' | 'Med' | 'High', selected: boolean) => {
    if (!selected) return { background: 'var(--color-surface-low)', color: 'var(--color-text-muted)', borderColor: 'transparent' };
    if (level === 'High') return { background: 'var(--color-accent-muted)', color: 'var(--color-accent)', borderColor: 'var(--color-accent)' };
    if (level === 'Med') return { background: 'var(--color-warn-muted)', color: 'var(--color-warn)', borderColor: 'var(--color-warn)' };
    return { background: 'var(--color-surface-mid)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-solid)' };
  };

  const highCount = decisions.filter(d => d.impact === 'High').length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>Growth Log</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Record decisions to build strategic clarity.</p>
        </div>
        <motion.button 
          onClick={() => setIsAdding(!isAdding)} 
          className="p-2.5 rounded-xl transition-all"
          style={{ background: isAdding ? 'var(--color-accent)' : 'var(--color-accent-muted)', color: isAdding ? 'white' : 'var(--color-accent)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isAdding ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={18} />
          </motion.div>
        </motion.button>
      </div>

      {/* Quick stats */}
      {decisions.length > 0 && (
        <div className="flex gap-3">
          <div className="tl-card px-4 py-3 flex items-center gap-3">
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text-primary)' }}>{decisions.length}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Total Decisions</span>
          </div>
          <div className="tl-card px-4 py-3 flex items-center gap-3">
            <span className="text-2xl font-bold font-mono" style={{ color: 'var(--color-accent)' }}>{highCount}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>High Impact</span>
          </div>
        </div>
      )}

      {/* Add form */}
      {isAdding && (
        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="tl-card p-5 space-y-4 overflow-hidden">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Decision</label>
            <input type="text" placeholder="e.g., Raised hourly rate to ₹5000" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Reasoning</label>
            <textarea placeholder="Why did you make this decision?" value={reasoning} onChange={e => setReasoning(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none resize-none min-h-[80px]" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Expected Impact</label>
            <div className="flex gap-2">
              {(['Low', 'Med', 'High'] as const).map(level => (
                <button key={level} type="button" onClick={() => setImpact(level)} className={impactButtonStyle(level, impact === level)} style={impactButtonInlineStyle(level, impact === level)}>
                  {level}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 text-white rounded-xl font-semibold tl-btn-primary">Save Decision</button>
        </motion.form>
      )}

      {/* Decision list */}
      <div className="space-y-3">
        {decisions.length === 0 ? (
          <div className="tl-card py-14 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--color-surface-low)' }}>
              <BookOpen size={20} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>No decisions logged yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Record strategic shifts and their reasoning.</p>
          </div>
        ) : (
          decisions.map(decision => (
            <div key={decision.id} className="tl-card overflow-hidden group relative" style={{ borderLeft: `3px solid ${getImpactBorderColor(decision.impact)}` }}>
              {editingDecisionId === decision.id ? (
                <div className="p-5 space-y-3 pr-16">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} autoFocus />
                  <textarea value={editReasoning} onChange={e => setEditReasoning(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none resize-none min-h-[80px]" style={{ background: 'var(--color-surface-low)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                  <div className="flex gap-2">
                    {(['Low', 'Med', 'High'] as const).map(level => (
                      <button key={level} type="button" onClick={() => setEditImpact(level)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all" style={impactButtonInlineStyle(level, editImpact === level)}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5 pr-16">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{decision.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>{decision.reasoning}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(decision.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={getImpactPillClass(decision.impact)}>
                      {getImpactIcon(decision.impact)} {decision.impact} Impact
                    </span>
                  </div>
                </div>
              )}

              {/* Absolute action buttons */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingDecisionId === decision.id ? (
                  <button onClick={() => saveEdit(decision)} disabled={!editTitle.trim() || !editReasoning.trim()} className="p-1.5 rounded-lg disabled:opacity-40" style={{ color: 'var(--color-success)', background: 'var(--color-success-muted)' }}>
                    <Check size={14} />
                  </button>
                ) : (
                  <button onClick={() => startEditing(decision)} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-low)' }}>
                    <Edit2 size={14} />
                  </button>
                )}
                <button onClick={() => { if (window.confirm('Delete this decision?')) deleteDecision(decision.id); }} className="p-1.5 rounded-lg" style={{ color: 'var(--color-accent)', background: 'var(--color-accent-muted)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
