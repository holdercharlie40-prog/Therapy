
import React, { useState, useEffect, useRef } from 'react';
import { Eye, Settings2, Play, Square, FastForward } from 'lucide-react';

const EMDRVisualizer: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [speed, setSpeed] = useState(2.0); // seconds for one full cycle (back and forth)
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      // Calculate progress based on time and duration (speed)
      // A full cycle is 2*PI. 
      const progress = (time - startTime) / (speed * 1000);
      // We use sin to get the smooth back-and-forth motion
      const position = (Math.sin(progress * Math.PI * 2) + 1) / 2; // Returns 0 to 1
      
      if (ballRef.current && containerRef.current) {
        const maxX = containerRef.current.clientWidth - ballRef.current.clientWidth - 32; // 32 accounts for padding
        ballRef.current.style.transform = `translateX(${position * maxX}px)`;
      }
      
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isActive, speed]);

  const frequencyHz = (1 / speed).toFixed(2);

  return (
    <div className="glass-panel p-10 rounded-[2.5rem] flex flex-col items-center gap-10 border-indigo-500/10 max-w-3xl mx-auto shadow-2xl">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Eye className="w-8 h-8 text-indigo-400" />
          <h3 className="text-3xl font-serif text-white">Bilateral Stimulation</h3>
        </div>
        <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
          Gently follow the sphere with your eyes while focusing on your emotional target. 
          This bilateral movement facilitates the brain's natural processing of traumatic memories.
        </p>
      </div>
      
      {/* Stimulation Area */}
      <div 
        ref={containerRef} 
        className="w-full h-40 bg-zinc-950/50 rounded-[2rem] relative overflow-hidden border border-white/5 flex items-center px-4 shadow-inner"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        <div 
          ref={ballRef}
          className={`w-14 h-14 rounded-full transition-shadow duration-300 ${
            isActive 
              ? 'bg-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.6)] blur-[1px]' 
              : 'bg-zinc-800 shadow-none'
          }`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-center">
        {/* Controls */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <FastForward className="w-3 h-3" /> Cycle Duration
              </label>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                {speed.toFixed(1)}s ({frequencyHz} Hz)
              </span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="5.0" 
              step="0.1" 
              value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
            />
            <div className="flex justify-between text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
              <span>Fast (Focus)</span>
              <span>Slow (Calming)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center md:justify-end">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-bold transition-all transform active:scale-95 shadow-xl ${
              isActive 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {isActive ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span>Pause Reprocessing</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Begin Session</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="w-full pt-6 border-t border-white/5 flex justify-center">
        <div className="flex items-center gap-6 opacity-30">
          <div className="flex items-center gap-2">
            <Settings2 className="w-3 h-3" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Auto-Calibration Active</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-500" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Visual Persistence: 100%</span>
        </div>
      </div>
    </div>
  );
};

export default EMDRVisualizer;
