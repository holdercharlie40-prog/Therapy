
import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Brain, Search, Info, MapPin, UserCheck, Volume2, Loader2, Square, Mic, MicOff } from 'lucide-react';
import { GeminiService, decodeBase64, decodeAudioBuffer } from '../services/geminiService';
import { ChatMessage, PersonalityId, PERSONALITIES } from '../types';

interface ChatWindowProps {
  mode: 'Reflection' | 'Grounding' | 'Search' | 'Resources';
  personalityId: PersonalityId;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ mode, personalityId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const stopSpeaking = () => {
    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch (e) {}
      sourceRef.current = null;
    }
    setSpeakingMsgId(null);
  };

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsDictating(true);
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          setInput(prev => prev + event.results[i][0].transcript + ' ');
        }
      }
    };
    recognition.onerror = () => setIsDictating(false);
    recognition.onend = () => setIsDictating(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSpeak = async (text: string, msgId: string) => {
    if (speakingMsgId === msgId) {
      stopSpeaking();
      return;
    }
    stopSpeaking();
    setSpeakingMsgId(msgId);
    try {
      const voiceName = GeminiService.getVoiceForPersonality(personalityId);
      const audioData = await GeminiService.speak(text, voiceName);
      if (audioData) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const buffer = await decodeAudioBuffer(decodeBase64(audioData), audioContextRef.current);
        sourceRef.current = audioContextRef.current.createBufferSource();
        sourceRef.current.buffer = buffer;
        sourceRef.current.connect(audioContextRef.current.destination);
        sourceRef.current.onended = () => setSpeakingMsgId(null);
        sourceRef.current.start();
      }
    } catch (err) {
      setSpeakingMsgId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (isDictating) toggleDictation();
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      let responseText = '';
      let sources: Array<{title: string, uri: string}> = [];
      if (mode === 'Reflection') {
        responseText = await GeminiService.deepReflect(input, personalityId, messages.slice(-5).map(m => m.content).join("\n"));
      } else if (mode === 'Grounding') {
        responseText = await GeminiService.quickComfort(input, personalityId);
      } else if (mode === 'Search') {
        const res = await GeminiService.searchClinicalInfo(input);
        responseText = res.text;
        sources = res.sources;
      } else if (mode === 'Resources') {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        const res = await GeminiService.findLocalSupport(pos.coords.latitude, pos.coords.longitude);
        responseText = res.text;
      }
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: responseText, sources: sources, timestamp: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'system', content: "Connection blurred. Let's try once more.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const activePers = PERSONALITIES[personalityId];

  return (
    <div className="flex flex-col h-full glass-panel rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl bg-black/10">
      <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode === 'Reflection' && <Brain className={`w-5 h-5 ${activePers.color}`} />}
          {mode === 'Grounding' && <Zap className={`w-5 h-5 ${activePers.color}`} />}
          <h2 className="font-serif text-lg text-zinc-100">{mode === 'Reflection' || mode === 'Grounding' ? `${activePers.name}` : `${mode}`}</h2>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
            <UserCheck className={`w-12 h-12 mb-4 ${activePers.color}`} />
            <p className="text-zinc-400 italic">"{activePers.description}"</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] rounded-2xl px-6 py-4 relative group ${
              m.role === 'user' 
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg' 
                : m.role === 'system' ? 'bg-red-900/20 text-red-300' : 'bg-zinc-800/80 text-zinc-100 border border-white/5'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed font-serif text-lg">{m.content}</div>
              {m.role === 'assistant' && (
                <button onClick={() => handleSpeak(m.content, m.id)} className={`absolute -right-12 top-2 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 hover:bg-white/5 text-zinc-500 ${speakingMsgId === m.id ? 'opacity-100 text-indigo-400' : ''}`}>
                  {speakingMsgId === m.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/40 rounded-2xl px-6 py-4 text-zinc-500 italic flex items-center gap-3">
              <div className="flex gap-1">
                <div className={`w-1.5 h-1.5 ${activePers.color} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0s' }} />
                <div className={`w-1.5 h-1.5 ${activePers.color} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
                <div className={`w-1.5 h-1.5 ${activePers.color} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }} />
              </div>
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/5 bg-black/40">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isDictating ? "Listening..." : "Pour your heart out..."}
              className={`w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-14 max-h-40 text-zinc-100 transition-all ${isDictating ? 'border-indigo-500 animate-pulse' : ''}`}
            />
            <button onClick={toggleDictation} className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isDictating ? 'text-indigo-400 animate-pulse' : 'text-zinc-600 hover:text-zinc-300'}`}>
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-xl h-14">
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
