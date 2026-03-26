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

  // Calculate live duration based on the shared data
  const getLiveDuration = () => {
    if (!data.checkInTime) return data.liveDuration || 0;
    if (data.status === 'checked_out') return data.liveDuration || 0;
    
    // If working, calculate time elapsed since the snapshot was taken
    const timeSinceSnapshot = now.getTime() - data.now;
    return (data.liveDuration || 0) + timeSinceSnapshot;
  };

  const getLiveBreakDuration = () => {
    if (data.status === 'on_break') {
      const timeSinceSnapshot = now.getTime() - data.now;
      return (data.liveBreakDuration || 0) + timeSinceSnapshot;
    }
    return data.liveBreakDuration || 0;
  };

  const getEffectiveDuration = () => {
    return Math.max(0, getLiveDuration() - getLiveBreakDuration());
  };

  const getEmbedUrl = (shareUrl?: string) => {
    if (!shareUrl) return "";
    if (shareUrl.includes("figma.com/embed")) return shareUrl;
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(shareUrl)}`;
  };

  const hasFigma = !!data.project?.figmaUrl;

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-gray-900 font-sans flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Live Progress</h1>
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
            Guest View
          </span>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto p-4 md:p-8 ${hasFigma ? 'max-w-6xl' : 'max-w-md'} mx-auto w-full`}>
        <div className={`flex flex-col ${hasFigma ? 'md:flex-row' : ''} gap-6 h-full`}>
          
          {/* Left Column: Progress & Details */}
          <div className={`flex flex-col space-y-6 ${hasFigma ? 'w-full md:w-1/3' : 'w-full'}`}>
            {/* Live Clock Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center relative overflow-hidden shrink-0"
            >
              <div className="mb-4">
                {data.status === 'working' && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium animate-pulse">Working</span>
                )}
                {data.status === 'on_break' && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">On Break</span>
                )}
                {data.status === 'checked_out' && (
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">Session Complete</span>
                )}
              </div>

              <h1 className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tight font-mono mb-2">
                {formatClock(now)}
              </h1>
              <p className="text-gray-500 font-medium mb-6">{formatDate(now)}</p>

              <div className="w-full grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-gray-100">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Effective</span>
                  <span className="text-xl font-bold text-indigo-600 font-mono">{formatDuration(getEffectiveDuration())}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total</span>
                  <span className="text-xl font-bold text-gray-900 font-mono">{formatDuration(getLiveDuration())}</span>
                </div>
              </div>
            </motion.div>

            {/* Context Info */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 shrink-0"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <Target className="mr-2 text-indigo-600" size={20} />
                Session Details
              </h2>
              
              {data.project && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project</label>
                  <p className="text-gray-900 font-medium">{data.project.name}</p>
                </div>
              )}

              {data.dailyIntent && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Daily Intent</label>
                  <p className="text-gray-900 font-medium">{data.dailyIntent}</p>
                </div>
              )}
              
              {data.activeTask && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Current Task</label>
                  <p className="text-gray-900 font-medium">{data.activeTask}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Figma Embed */}
          {hasFigma && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full md:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[500px]"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                <div className="flex items-center">
                  <Figma size={20} className="text-[#F24E1E] mr-2" />
                  <h3 className="font-semibold text-gray-900">Live Design</h3>
                </div>
                <button
                  onClick={() => {
                    const iframe = document.querySelector('iframe');
                    if (iframe && iframe.requestFullscreen) {
                      iframe.requestFullscreen();
                    }
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg"
                >
                  Expand Canvas
                </button>
              </div>
              <div className="flex-1 bg-gray-50 relative">
                <iframe
                  src={getEmbedUrl(data.project.figmaUrl)}
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
};
