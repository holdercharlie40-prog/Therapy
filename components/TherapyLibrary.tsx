
import React from 'react';
import { BookOpen, Shield, Brain, Zap, Eye, History, Leaf, Users, Home, Users2, Info, Activity } from 'lucide-react';
import { THERAPY_DEFINITIONS, TherapyMode } from '../types';

const TherapyLibrary: React.FC = () => {
  const getIcon = (mod: TherapyMode) => {
    switch (mod) {
      case 'CBT': return <Brain className="w-8 h-8 text-blue-400" />;
      case 'DBT': return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'EMDR': return <Eye className="w-8 h-8 text-purple-400" />;
      case 'Trauma': return <Shield className="w-8 h-8 text-red-400" />;
      case 'Psychodynamic': return <History className="w-8 h-8 text-orange-400" />;
      case 'Humanistic': return <Leaf className="w-8 h-8 text-emerald-400" />;
      case 'IPT': return <Users className="w-8 h-8 text-cyan-400" />;
      case 'Family': return <Home className="w-8 h-8 text-rose-400" />;
      case 'Group': return <Users2 className="w-8 h-8 text-teal-400" />;
      case 'ABA': return <Activity className="w-8 h-8 text-amber-400" />;
      default: return <Info className="w-8 h-8 text-green-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.keys(THERAPY_DEFINITIONS) as TherapyMode[]).filter(m => m !== 'General').map((mod) => {
          const data = THERAPY_DEFINITIONS[mod];
          return (
            <div key={mod} className="glass-panel p-8 rounded-[2rem] border-white/5 bg-zinc-900/30 flex flex-col gap-6 group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-indigo-500/10 transition-colors">
                  {getIcon(mod)}
                </div>
                <div>
                  <h3 className="text-xl font-serif text-white">{data.title}</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{mod} Modality</p>
                </div>
              </div>
              
              <p className="text-zinc-300 leading-relaxed font-serif italic text-sm">
                "{data.definition}"
              </p>

              <div className="space-y-3 mt-auto">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-3 h-3" /> Key Pillars
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.keyPrinciples.map((principle, i) => (
                    <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                      {principle}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel p-8 rounded-[2rem] border-indigo-500/20 bg-indigo-500/5 text-center max-w-2xl mx-auto">
        <p className="text-sm text-indigo-300 italic leading-relaxed">
          Lumina integrates these established therapeutic frameworks to construct actionable homework and guided reflections, bridging clinical theory with daily healing.
        </p>
      </div>
    </div>
  );
};

export default TherapyLibrary;
