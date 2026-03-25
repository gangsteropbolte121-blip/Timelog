import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Target, Figma } from 'lucide-react';
import { formatDuration, formatClock, formatDate } from '../utils';

interface GuestViewProps {
  data: any;
}

export const GuestView: React.FC<GuestViewProps> = ({ data }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getLiveDuration = () => {
    if (!data.checkInTime) return data.liveDuration || 0;
    if (data.status === 'checked_out') return data.liveDuration || 0;
    const timeSinceSnapshot = now.getTime() - data.now;
    return (data.liveDuration || 0) + timeSinceSnapshot;
  };

  const getLiveBreakDuration = () => {
    if (data.status === 'on_break') {
      return (data.liveBreakDuration || 0) + (now.getTime() - data.now);
    }
    return data.liveBreakDuration || 0;
  };

  const getEffectiveDuration = () => Math.max(0, getLiveDuration() - getLiveBreakDuration());

  const getEmbedUrl = (shareUrl?: string) => {
    if (!shareUrl) return '';
    if (shareUrl.includes('figma.com/embed')) return shareUrl;
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(shareUrl)}`;
  };

  const hasFigma = !!data.project?.figmaUrl;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
              <Clock className="text-white" size={14} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Timelog</span>
          </div>
          <span className="tl-pill tl-pill-muted">Guest View</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className={`max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8 flex flex-col ${hasFigma ? 'md:flex-row' : 'items-center'} gap-5 h-full`}>

          {/* Left column */}
          <div className={`flex flex-col gap-4 ${hasFigma ? 'w-full md:w-80 shrink-0' : 'w-full max-w-sm'}`}>

            {/* Hero clock card → black */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="tl-card-hero p-7 flex flex-col items-center text-center">
              {/* Status badge */}
              <div className="mb-4">
                {data.status === 'working' && <span className="tl-pill tl-pill-accent flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full tl-pulse" style={{ background: 'var(--color-accent)' }} /> Working</span>}
                {data.status === 'on_break' && <span className="tl-pill tl-pill-warn">On Break</span>}
                {data.status === 'checked_out' && <span className="tl-pill" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>Session Complete</span>}
              </div>

              <div className="text-6xl font-bold font-mono mb-1 text-white" style={{ letterSpacing: '-0.04em' }}>
                {formatClock(now)}
              </div>
              <p className="text-sm mb-6 opacity-60 text-white">{formatDate(now)}</p>

              <div className="w-full grid grid-cols-2 gap-4 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-50 text-white">Effective</span>
                  <span className="text-xl font-bold font-mono text-white">{formatDuration(getEffectiveDuration())}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-50 text-white">Total</span>
                  <span className="text-xl font-bold font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{formatDuration(getLiveDuration())}</span>
                </div>
              </div>
            </motion.div>

            {/* Session details */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="tl-card p-5 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Session Details</h2>

              {data.project && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-accent)' }}>Project</label>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{data.project.name}</p>
                </div>
              )}

              {data.dailyIntent && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Daily Intent</label>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{data.dailyIntent}</p>
                </div>
              )}

              {data.activeTask && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Current Task</label>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{data.activeTask}</p>
                </div>
              )}
            </motion.div>

            {/* Powered by */}
            <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>Powered by <strong>Timelog</strong> Freelance OS</p>
          </div>

          {/* Right column: Figma embed */}
          {hasFigma && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1 tl-card flex flex-col overflow-hidden min-h-[500px]">
              <div className="flex items-center justify-between px-5 py-3.5 shrink-0" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-low)' }}>
                <div className="flex items-center gap-2">
                  <Figma size={18} className="text-[#F24E1E]" />
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Live Design Canvas</span>
                </div>
                <button onClick={() => { const iframe = document.querySelector('iframe'); if (iframe?.requestFullscreen) iframe.requestFullscreen(); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ color: 'var(--color-accent)', background: 'var(--color-accent-muted)' }}>
                  Expand
                </button>
              </div>
              <div className="flex-1 relative" style={{ background: 'var(--color-surface-low)' }}>
                <iframe src={getEmbedUrl(data.project.figmaUrl)} className="absolute inset-0 w-full h-full border-0" allowFullScreen />
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};
