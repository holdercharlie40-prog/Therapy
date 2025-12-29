
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
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
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
    return () => {
      stopSession();
    };
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
  };

  const startSession = async () => {
    try {
      stopSession(); // Clean up existing
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
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
              });
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
          systemInstruction: `${activePers.instruction} This is a live voice session. Be warm, natural, and responsive. Use active listening cues. Focus on deep emotional resonance.`,
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[500px]">
      <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col items-center justify-between relative overflow-hidden border-indigo-500/10 shadow-2xl bg-zinc-950/20 group">
        <div className={`absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
        
        {isActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center gap-6 mt-8">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-1000 ${isActive ? 'bg-indigo-500/30 scale-125 animate-pulse' : 'bg-transparent'}`} />
            <div className={`w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-700 relative z-10 ${isActive ? `border-indigo-400 scale-110 shadow-[0_0_60px_rgba(129,140,248,0.4)]` : 'border-white/5 bg-zinc-900'}`}>
              <UserCheck className={`w-16 h-16 ${isActive ? activePers.color : 'text-zinc-600'}`} />
              {isActive && (
                <>
                  <div className={`absolute inset-0 rounded-full border border-indigo-500/50 animate-ping opacity-20`} style={{ animationDuration: '3s' }} />
                  <div className={`absolute -inset-4 rounded-full border border-indigo-400/30 animate-ping opacity-10`} style={{ animationDuration: '4s', animationDelay: '1s' }} />
                </>
              )}
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-serif text-white tracking-tight">{activePers.name}</h3>
            <p className="text-zinc-400 font-bold uppercase tracking-[0.3em] text-[9px]">{activePers.role}</p>
          </div>
        </div>

        <div className="relative z-10 w-full flex flex-col items-center gap-4 py-8">
          {isActive ? (
            <div className="w-full flex flex-col gap-8 px-12">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                   <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{activePers.name}</span>
                </div>
                <div className="flex gap-1 items-end h-12 w-full justify-center">
                  {[...Array(32)].map((_, i) => {
                    const level = outputVolume * (0.8 + Math.random() * 0.4);
                    const height = status === 'speaking' ? Math.max(4, level * 1.5) : 4;
                    return (
                      <div
                        key={`out-${i}`}
                        className={`w-1 rounded-full transition-all duration-75 ${activePers.color} bg-current opacity-80 shadow-[0_0_8px_rgba(129,140,248,0.5)]`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                   <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">You</span>
                </div>
                <div className="flex gap-1 items-end h-12 w-full justify-center">
                  {[...Array(32)].map((_, i) => {
                    const level = inputVolume * (0.8 + Math.random() * 0.4);
                    const height = !isMuted && status === 'listening' ? Math.max(4, level * 1.5) : 4;
                    return (
                      <div
                        key={`in-${i}`}
                        className={`w-1 rounded-full transition-all duration-75 bg-rose-400 opacity-80 shadow-[0_0_8px_rgba(251,113,133,0.5)]`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
             <div className="h-40 flex items-center justify-center text-zinc-700 opacity-20">
                <Activity className="w-16 h-16" />
             </div>
          )}
        </div>

        <div className="relative z-10 w-full flex flex-col items-center gap-8 pb-8">
          <div className="flex items-center gap-8">
            {isActive ? (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-6 rounded-[1.5rem] transition-all border ${isMuted ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white'}`}
                >
                  {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
                <button
                  onClick={stopSession}
                  className="bg-rose-600 text-white p-8 rounded-[2.5rem] hover:bg-rose-500 shadow-2xl transition-all"
                >
                  <PhoneOff className="w-9 h-9" />
                </button>
              </>
            ) : (
              <button
                onClick={startSession}
                disabled={status === 'connecting'}
                className="bg-indigo-600 text-white px-20 py-6 rounded-[2.5rem] font-bold text-xl hover:bg-indigo-500 shadow-2xl transition-all flex items-center gap-4 disabled:opacity-50"
              >
                {status === 'connecting' ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : <Volume2 className="w-7 h-7" />}
                <span>{status === 'connecting' ? 'Calibrating...' : `Enter Session`}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] flex flex-col border-white/5 bg-zinc-950/40 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-indigo-400" />
            <h4 className="text-base font-serif text-zinc-200">The Living Transcript</h4>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth">
          {transcripts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-6">
              <Mic className="w-10 h-10" />
              <p className="text-lg font-serif italic text-zinc-400">Voices will appear here...</p>
            </div>
          )}

          {transcripts.map((t, i) => (
            <div key={i} className={`flex flex-col ${t.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] p-6 rounded-[1.5rem] font-serif leading-relaxed text-lg ${
                t.role === 'user' 
                  ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-50 italic' 
                  : 'bg-zinc-800/60 border border-white/5 text-zinc-100'
              }`}>
                {t.text}
                {t.isPartial && <span className="inline-block w-1.5 h-5 ml-1.5 bg-indigo-400 animate-pulse rounded-full" />}
              </div>
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-3 px-2">
                {t.role === 'user' ? 'YOU' : activePers.name.toUpperCase()}
              </span>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </div>
  );
};

export default VoiceSession;
