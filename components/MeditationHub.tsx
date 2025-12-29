
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Wind, Sparkles, ShieldCheck, Heart, Volume2, VolumeX, Square, FileText, Music, Star } from 'lucide-react';
import { GeminiService, decodeBase64, decodeAudioBuffer } from '../services/geminiService';
import { PersonalityId, PERSONALITIES } from '../types';

const modules = [
  { id: 'grounding', title: '5-Minute Grounding', icon: Wind, focus: 'CBT techniques to handle acute panic or anxiety' },
  { id: 'safe-space', title: 'Inner Sanctuary', icon: ShieldCheck, focus: 'Trauma-informed visualization of a safe emotional space' },
  { id: 'self-compassion', title: 'Loving Kindness', icon: Heart, focus: 'DBT-inspired self-acceptance and compassion' },
  { id: 'radiance', title: 'Emotional Release', icon: Sparkles, focus: 'Deep breathing for letting go of repressed tension' },
  { id: 'affirmations', title: 'Daily Affirmations', icon: Star, focus: 'Positive, personality-driven affirmations for self-worth' },
];

interface MeditationHubProps {
  personalityId: PersonalityId;
}

const MeditationHub: React.FC<MeditationHubProps> = ({ personalityId }) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const activePers = PERSONALITIES[personalityId];

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSession();
  }, []);

  const selectModule = async (moduleId: string) => {
    if (activeModule === moduleId && isPlaying) {
      if (isPaused) resumeSession();
      else pauseSession();
      return;
    }

    stopSession();
    setActiveModule(moduleId);
    setScript(null);
    setIsGeneratingScript(true);
    
    try {
      const module = modules.find(m => m.id === moduleId);
      let generatedScript = "";
      
      if (moduleId === 'affirmations') {
        generatedScript = await GeminiService.generateAffirmations(personalityId);
      } else {
        generatedScript = await GeminiService.generateMeditationScript(module?.focus || '', personalityId);
      }
      
      setScript(generatedScript);
    } catch (err) {
      console.error("Meditation script error:", err);
      setActiveModule(null);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateAudio = async () => {
    if (!script || isSynthesizing) return;
    
    // Stop any current audio before starting new synthesis
    if (isPlaying) {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      setIsPlaying(false);
    }

    setIsSynthesizing(true);
    setIsPaused(false);
    
    try {
      const voiceName = GeminiService.getVoiceForPersonality(personalityId);
      const audioData = await GeminiService.speak(script, voiceName);
      
      if (audioData) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioBuffer(decodeBase64(audioData), audioContextRef.current);
        
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = volume;
        
        sourceRef.current = audioContextRef.current.createBufferSource();
        sourceRef.current.buffer = buffer;
        
        sourceRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        sourceRef.current.onended = () => {
          if (sourceRef.current && !isPaused) {
            setIsPlaying(false);
            setIsPaused(false);
          }
        };
        
        sourceRef.current.start();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const pauseSession = async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      await audioContextRef.current.suspend();
      setIsPaused(true);
    }
  };

  const resumeSession = async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopSession = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    gainNodeRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setActiveModule(null);
    setScript(null);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => selectModule(m.id)}
            disabled={isGeneratingScript && activeModule !== m.id}
            className={`glass-panel p-8 rounded-3xl text-left transition-all relative overflow-hidden group ${
              activeModule === m.id ? 'border-indigo-500 shadow-indigo-500/20 shadow-lg' : 'hover:border-white/20'
            }`}
          >
            {activeModule === m.id && isPlaying && !isPaused && (
              <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
            )}
            
            <div className="relative z-10 flex flex-col h-full gap-4">
              <div className={`p-3 w-fit rounded-2xl bg-white/5 ${activeModule === m.id ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                <m.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-serif text-white mb-1">{m.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{m.focus}</p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-2">
                {activeModule === m.id ? (
                  isGeneratingScript ? (
                    <span className="text-[10px] font-bold text-indigo-400 uppercase animate-pulse">Consulting the Silence...</span>
                  ) : (
                    <><FileText className="w-4 h-4 text-indigo-400" /> <span className="text-[10px] font-bold text-indigo-400 uppercase">Script Manifested</span></>
                  )
                ) : (
                  <><Play className="w-4 h-4 text-zinc-500" /> <span className="text-[10px] font-bold text-zinc-500 uppercase">Prepare Session</span></>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {activeModule && (
        <div className="glass-panel p-8 rounded-3xl flex flex-col gap-8 border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className={`w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400`}>
                {activeModule === 'affirmations' ? (
                  <Star className={`w-6 h-6 ${isPlaying && !isPaused ? 'animate-pulse text-yellow-400' : ''}`} />
                ) : (
                  <Wind className={`w-6 h-6 ${isPlaying && !isPaused ? 'animate-spin-slow text-indigo-400' : ''}`} />
                )}
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Guide: {activePers.name}</p>
                <p className="text-indigo-200 font-serif text-2xl">{modules.find(m => m.id === activeModule)?.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={generateAudio}
                disabled={!script || isSynthesizing}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest transition-all ${
                  isSynthesizing 
                  ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                }`}
              >
                {isSynthesizing ? <div className="animate-spin w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full" /> : <Music className="w-4 h-4" />}
                {isSynthesizing ? 'Synthesizing Voice...' : isPlaying ? 'Restart Narration' : 'Narrate Script'}
              </button>
              <button onClick={stopSession} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-500 transition-colors">
                <Square className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
               <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                 <FileText className="w-3 h-3" /> {activeModule === 'affirmations' ? 'Your Daily Affirmations' : 'Meditation Script Preview'}
               </h4>
               <div className="bg-black/30 p-6 rounded-2xl border border-white/5 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 leading-relaxed text-zinc-300 font-serif whitespace-pre-wrap">
                 {isGeneratingScript ? (
                   <div className="flex flex-col gap-2">
                     <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
                     <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                     <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
                   </div>
                 ) : script || "No script generated yet."}
               </div>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-600/5 p-6 rounded-2xl border border-indigo-500/10 space-y-4">
                 <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Audio Controls</h4>
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <button 
                        onClick={isPaused ? resumeSession : pauseSession}
                        disabled={!isPlaying}
                        className="p-4 bg-zinc-900 border border-white/10 rounded-2xl text-indigo-400 disabled:opacity-30 hover:bg-zinc-800 transition-all"
                       >
                         {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                       </button>
                       <div className="flex-1 ml-4 bg-zinc-900 rounded-2xl px-4 py-3 border border-white/10 flex items-center gap-3">
                         <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)}>
                           {volume === 0 ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-indigo-400" />}
                         </button>
                         <input 
                           type="range" 
                           min="0" 
                           max="1" 
                           step="0.01" 
                           value={volume} 
                           onChange={(e) => setVolume(parseFloat(e.target.value))}
                           className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                         />
                       </div>
                    </div>
                    
                    {isPlaying && (
                      <div className="flex justify-center">
                        <div className="flex gap-1 items-end h-8">
                          {[...Array(8)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-1 bg-indigo-500/60 rounded-full transition-all duration-150 ${!isPaused ? 'animate-pulse' : 'opacity-20'}`} 
                              style={{ 
                                height: !isPaused ? `${30 + Math.random() * 70}%` : '4px',
                                animationDelay: `${i * 0.1}s`
                              }} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
              </div>
              
              <div className="p-4 border border-white/5 rounded-2xl bg-white/5 text-[10px] text-zinc-500 leading-relaxed italic">
                Guided by {activePers.name}'s voice ({GeminiService.getVoiceForPersonality(personalityId)} prebuilt). Synthesis uses Gemini 2.5 Flash Native Audio.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeditationHub;
