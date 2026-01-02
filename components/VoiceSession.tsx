
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, UserCheck, MessageCircle, Volume2, Activity } from 'lucide-react';
import { decodeBase64, decodeAudioBuffer, encodePCM, GeminiService } from '../services/geminiService';
import { PersonalityId, PERSONALITIES } from '../types';

interface VoiceSessionProps {
  personalityId: PersonalityId;
}

interface TranscriptLine {
  role: 'user' | 'assistant';
  text: string;
  isPartial?: boolean;
}

const VoiceSession: React.FC<VoiceSessionProps> = ({ personalityId }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);

  const currentUserText = useRef('');
  const currentModelText = useRef('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);

  const activePers = PERSONALITIES[personalityId];

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, status]);

  useEffect(() => {
    return () => stopSession();
  }, []);

  const startVisualizer = () => {
    const dataArrayInput = new Uint8Array(inputAnalyserRef.current?.frequencyBinCount || 0);
    const dataArrayOutput = new Uint8Array(outputAnalyserRef.current?.frequencyBinCount || 0);

    const update = () => {
      if (inputAnalyserRef.current) {
        inputAnalyserRef.current.getByteFrequencyData(dataArrayInput);
        const inputAverage = dataArrayInput.reduce((a, b) => a + b, 0) / dataArrayInput.length;
        setInputVolume(inputAverage);
      }

      if (outputAnalyserRef.current) {
        outputAnalyserRef.current.getByteFrequencyData(dataArrayOutput);
        const outputAverage = dataArrayOutput.reduce((a, b) => a + b, 0) / dataArrayOutput.length;
        setOutputVolume(outputAverage);
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    setIsActive(false);
    setStatus('idle');
    setInputVolume(0);
    setOutputVolume(0);

    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close().catch(() => {});
      inputAudioContextRef.current = null;
    }
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    try {
      stopSession(); 
      setStatus('connecting');
      setIsActive(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      inputAnalyserRef.current = inputAudioContextRef.current.createAnalyser();
      inputAnalyserRef.current.fftSize = 256;
      const micSource = inputAudioContextRef.current.createMediaStreamSource(stream);
      micSource.connect(inputAnalyserRef.current);

      outputAnalyserRef.current = audioContextRef.current.createAnalyser();
      outputAnalyserRef.current.fftSize = 256;
      outputGainRef.current = audioContextRef.current.createGain();
      outputGainRef.current.connect(outputAnalyserRef.current);
      outputAnalyserRef.current.connect(audioContextRef.current.destination);

      startVisualizer();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted || !isActive) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encodePCM(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                if (session) session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioBuffer(decodeBase64(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputGainRef.current!);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
              currentUserText.current += message.serverContent.inputTranscription.text;
              updateTranscript('user', currentUserText.current, true);
            }
            
            if (message.serverContent?.outputTranscription) {
              currentModelText.current += message.serverContent.outputTranscription.text;
              updateTranscript('assistant', currentModelText.current, true);
            }

            if (message.serverContent?.turnComplete) {
              updateTranscript('user', currentUserText.current, false);
              updateTranscript('assistant', currentModelText.current, false);
              currentUserText.current = '';
              currentModelText.current = '';
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              updateTranscript('assistant', currentModelText.current + " [Interrupted]", false);
              currentModelText.current = '';
            }
          },
          onerror: () => stopSession(),
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: GeminiService.getVoiceForPersonality(personalityId) 
              } 
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `${activePers.instruction} This is a live voice session. Be warm, natural, and responsive. Speak with clinical grace and empathy.`,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      stopSession();
    }
  };

  const updateTranscript = (role: 'user' | 'assistant', text: string, isPartial: boolean) => {
    if (!text.trim()) return;
    setTranscripts(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && (last.isPartial || isPartial)) {
        const updated = [...prev];
        updated[updated.length - 1] = { role, text, isPartial };
        return updated;
      }
      return [...prev, { role, text, isPartial }];
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full min-h-[600px]">
      {/* Visual Experience */}
      <div className="glass-panel p-10 rounded-[3rem] flex flex-col items-center justify-between relative overflow-hidden border-indigo-500/10 shadow-2xl bg-zinc-950/20 group">
        <div className={`absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
        
        {isActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center gap-8 mt-12">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 ${isActive ? 'bg-indigo-500/40 scale-125 animate-pulse' : 'bg-transparent'}`} />
            <div className={`w-44 h-44 rounded-full border-2 flex items-center justify-center transition-all duration-700 relative z-10 ${isActive ? `border-indigo-400 scale-110 shadow-[0_0_80px_rgba(129,140,248,0.5)]` : 'border-white/5 bg-zinc-900'}`}>
              <UserCheck className={`w-20 h-20 ${isActive ? activePers.color : 'text-zinc-600'}`} />
              {isActive && (
                <>
                  <div className={`absolute inset-0 rounded-full border border-indigo-500/50 animate-ping opacity-30`} style={{ animationDuration: '4s' }} />
                  <div className={`absolute -inset-6 rounded-full border border-indigo-400/20 animate-ping opacity-10`} style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
                </>
              )}
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-4xl font-serif text-white tracking-tight">{activePers.name}</h3>
            <p className="text-zinc-400 font-black uppercase tracking-[0.5em] text-[10px]">{activePers.role}</p>
          </div>
        </div>

        {/* Improved Visualizers */}
        <div className="relative z-10 w-full flex flex-col items-center gap-6 py-10">
          {isActive ? (
            <div className="w-full flex flex-col gap-10 px-16">
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{activePers.name}'s Presence</span>
                   <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'speaking' ? 'text-indigo-500' : 'text-zinc-700'}`}>Active Response</span>
                </div>
                <div className="flex gap-1.5 items-end h-16 w-full justify-center">
                  {[...Array(40)].map((_, i) => {
                    const level = outputVolume * (0.9 + Math.random() * 0.2);
                    const height = status === 'speaking' ? Math.max(6, level * 2) : 6;
                    return (
                      <div
                        key={`out-${i}`}
                        className={`w-1 rounded-full transition-all duration-75 ${activePers.color} bg-current opacity-80 shadow-[0_0_12px_rgba(129,140,248,0.4)]`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                   <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Your Spirit</span>
                   <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'listening' ? 'text-rose-500' : 'text-zinc-700'}`}>Synchronizing</span>
                </div>
                <div className="flex gap-1.5 items-end h-16 w-full justify-center">
                  {[...Array(40)].map((_, i) => {
                    const level = inputVolume * (0.9 + Math.random() * 0.2);
                    const height = !isMuted && status === 'listening' ? Math.max(6, level * 2) : 6;
                    return (
                      <div
                        key={`in-${i}`}
                        className={`w-1 rounded-full transition-all duration-75 bg-rose-400 opacity-80 shadow-[0_0_12px_rgba(251,113,133,0.4)]`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
             <div className="h-48 flex items-center justify-center text-zinc-700 opacity-10">
                <Activity className="w-24 h-24" />
             </div>
          )}
        </div>

        <div className="relative z-10 w-full flex flex-col items-center gap-10 pb-12">
          <div className="flex items-center gap-10">
            {isActive ? (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-7 rounded-[2rem] transition-all border ${isMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white hover:scale-110 active:scale-95'}`}
                >
                  {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
                <button
                  onClick={stopSession}
                  className="bg-rose-600 text-white p-9 rounded-[2.5rem] hover:bg-rose-500 shadow-2xl shadow-rose-600/30 transition-all hover:scale-110 active:scale-90"
                >
                  <PhoneOff className="w-10 h-10" />
                </button>
              </>
            ) : (
              <button
                onClick={startSession}
                disabled={status === 'connecting'}
                className="bg-indigo-600 text-white px-24 py-7 rounded-[2.5rem] font-black text-xl hover:bg-indigo-500 shadow-2xl shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-5 disabled:opacity-50 uppercase tracking-widest"
              >
                {status === 'connecting' ? (
                  <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Volume2 className="w-8 h-8" />}
                <span>{status === 'connecting' ? 'Establishing Resonance...' : `Deep Voice Presence`}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Transcript Log */}
      <div className="glass-panel rounded-[3rem] flex flex-col border-white/5 bg-zinc-950/40 overflow-hidden shadow-2xl">
        <div className="p-10 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MessageCircle className="w-7 h-7 text-indigo-400" />
            <h4 className="text-xl font-serif text-zinc-200">The Living Scroll</h4>
          </div>
          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Safe & Encryption Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar scroll-smooth">
          {transcripts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-8">
              <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-900 border border-white/5 flex items-center justify-center">
                <Mic className="w-12 h-12" />
              </div>
              <p className="text-xl font-serif italic text-zinc-400">Voices will materialize as you speak...</p>
            </div>
          )}

          {transcripts.map((t, i) => (
            <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] p-8 rounded-[2rem] font-serif leading-relaxed text-xl shadow-2xl ${
                t.role === 'user' 
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-50 italic' 
                  : 'bg-zinc-800/80 border border-white/5 text-zinc-100'
              }`}>
                {t.text}
                {t.isPartial && <span className="inline-block w-2 h-6 ml-2 bg-indigo-400 animate-pulse rounded-full align-middle" />}
              </div>
              <div className="mt-4 px-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${t.role === 'user' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                  {t.role === 'user' ? 'YOUR HEART' : activePers.name.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
        
        {isActive && (
          <div className="p-8 bg-black/40 border-t border-white/5 backdrop-blur-3xl">
            <div className="flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-indigo-500/20" />
              <p className="text-[10px] text-indigo-400/50 uppercase tracking-[0.5em] font-black italic">
                Neural Resonance Streaming
              </p>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-indigo-500/20" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSession;
