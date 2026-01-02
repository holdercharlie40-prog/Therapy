
import React, { useState } from 'react';
import { Wand2, Target, Shield, Brain, Zap, Eye, Heart, Check, Sparkles, Info, History, Leaf, Users, Home, Users2, BookOpen, Activity } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { TherapyPlan, TherapyMode, THERAPY_DEFINITIONS } from '../types';

const TherapyPath: React.FC = () => {
  const [goals, setGoals] = useState('');
  const [selectedModalities, setSelectedModalities] = useState<TherapyMode[]>(['CBT', 'DBT', 'Trauma', 'EMDR']);
  const [plan, setPlan] = useState<TherapyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredModality, setHoveredModality] = useState<TherapyMode | null>(null);

  const toggleModality = (mod: TherapyMode) => {
    setSelectedModalities(prev => 
      prev.includes(mod) 
        ? prev.filter(m => m !== mod) 
        : [...prev, mod]
    );
  };

  const generate = async () => {
    if (selectedModalities.length === 0) return;
    setIsLoading(true);
    try {
      const result = await GeminiService.generateTherapyPath(goals, selectedModalities);
      setPlan(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (mod: string) => {
    switch(mod) {
      case 'CBT': return <Brain className="w-5 h-5 text-blue-400" />;
      case 'DBT': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'EMDR': return <Eye className="w-5 h-5 text-purple-400" />;
      case 'Trauma': return <Shield className="w-5 h-5 text-red-400" />;
      case 'Psychodynamic': return <History className="w-5 h-5 text-orange-400" />;
      case 'Humanistic': return <Leaf className="w-5 h-5 text-emerald-400" />;
      case 'IPT': return <Users className="w-5 h-5 text-cyan-400" />;
      case 'Family': return <Home className="w-5 h-5 text-rose-400" />;
      case 'Group': return <Users2 className="w-5 h-5 text-teal-400" />;
      case 'ABA': return <Activity className="w-5 h-5 text-amber-400" />;
      default: return <Heart className="w-5 h-5 text-green-400" />;
    }
  };

  const modalityOptions: { id: TherapyMode; label: string; icon: React.ReactNode }[] = [
    { id: 'CBT', label: 'CBT', icon: <Brain className="w-4 h-4" /> },
    { id: 'DBT', label: 'DBT', icon: <Zap className="w-4 h-4" /> },
    { id: 'EMDR', label: 'EMDR', icon: <Eye className="w-4 h-4" /> },
    { id: 'Trauma', label: 'Trauma-Informed', icon: <Shield className="w-4 h-4" /> },
    { id: 'Psychodynamic', label: 'Psychodynamic', icon: <History className="w-4 h-4" /> },
    { id: 'Humanistic', label: 'Humanistic', icon: <Leaf className="w-4 h-4" /> },
    { id: 'IPT', label: 'Interpersonal', icon: <Users className="w-4 h-4" /> },
    { id: 'Family', label: 'Family Therapy', icon: <Home className="w-4 h-4" /> },
    { id: 'Group', label: 'Group Therapy', icon: <Users2 className="w-4 h-4" /> },
    { id: 'ABA', label: 'ABA Therapy', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!plan ? (
        <div className="glass-panel p-10 rounded-3xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-serif text-white">Your Healing Architect</h2>
            <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Lumina translates your current emotional landscape into a structured journey. Select the modalities that resonate with you.
            </p>
          </div>

          {/* Modality Selector */}
          <div className="space-y-4 relative">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select Modalities</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
              {modalityOptions.map((opt) => {
                const isSelected = selectedModalities.includes(opt.id);
                return (
                  <div key={opt.id} className="relative group">
                    <button
                      onClick={() => toggleModality(opt.id)}
                      onMouseEnter={() => setHoveredModality(opt.id)}
                      onMouseLeave={() => setHoveredModality(null)}
                      className={`w-full flex flex-col items-start gap-1.5 p-4 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100 shadow-lg shadow-indigo-500/10'
                          : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className={isSelected ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'}>
                            {opt.icon}
                          </div>
                          <span className="text-xs font-bold">{opt.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Info className="w-3 h-3 text-zinc-600 opacity-50 group-hover:opacity-100" />
                           {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                        </div>
                      </div>
                    </button>
                    
                    {/* Hover Info Tooltip */}
                    {hoveredModality === opt.id && (
                      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-4 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <h5 className="text-xs font-bold text-white mb-2">{THERAPY_DEFINITIONS[opt.id].title}</h5>
                        <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">{THERAPY_DEFINITIONS[opt.id].definition}</p>
                        <div className="flex flex-wrap gap-1">
                          {THERAPY_DEFINITIONS[opt.id].keyPrinciples.map((p, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[8px] font-bold uppercase">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedModalities.length === 0 && (
              <p className="text-[10px] text-red-400 animate-pulse uppercase tracking-wider font-bold">Please select at least one modality</p>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Identify Your Goals</h4>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g., I want to work on processing a recent grief and improving my self-esteem in social situations..."
              className="w-full h-32 bg-zinc-900 border border-white/10 rounded-2xl p-6 text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all placeholder:text-zinc-600"
            />
            <button
              onClick={generate}
              disabled={isLoading || !goals.trim() || selectedModalities.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 mx-auto transition-all disabled:opacity-50 shadow-xl shadow-indigo-600/20"
            >
              {isLoading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              {isLoading ? 'Architecting...' : 'Build My Healing Path'}
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-serif text-white">{plan.name}</h1>
              <p className="text-indigo-400 font-medium">Focus Area: {plan.focus}</p>
            </div>
            <button 
              onClick={() => setPlan(null)} 
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-white/5"
            >
              Start New Journey
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl bg-indigo-500/5 border-indigo-500/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Target className="w-24 h-24" />
             </div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-2">Clinical Philosophy</h4>
            <p className="text-zinc-300 italic leading-relaxed relative z-10">"{plan.philosophy}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plan.steps.map((step, i) => (
              <div key={i} className="glass-panel p-6 rounded-3xl space-y-4 border-white/5 hover:border-indigo-500/30 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-indigo-500/10 transition-colors">{getIcon(step.modality)}</div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{step.modality} Pillar</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-[10px] text-zinc-600 font-bold">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-lg font-serif text-white group-hover:text-indigo-200 transition-colors">{step.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
                <div className="bg-black/30 p-5 rounded-2xl border border-white/5 group-hover:border-indigo-500/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Homework Assignment</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">"{step.exercise}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapyPath;
