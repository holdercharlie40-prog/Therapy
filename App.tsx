
import React, { useState } from 'react';
import { 
  Brain, 
  Wind, 
  MessageSquare, 
  Settings, 
  Heart, 
  Zap, 
  Search, 
  MapPin, 
  Eye,
  Menu,
  Book,
  Route,
  Sparkles,
  Compass,
  Users,
  Library
} from 'lucide-react';
import ChatWindow from './components/ChatWindow';
import EMDRVisualizer from './components/EMDRVisualizer';
import VoiceSession from './components/VoiceSession';
import MoodJournal from './components/MoodJournal';
import TherapyPath from './components/TherapyPath';
import MeditationHub from './components/MeditationHub';
import TherapyLibrary from './components/TherapyLibrary';
import { PERSONALITIES, PersonalityId } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reflect' | 'live' | 'emdr' | 'journey' | 'path' | 'mindfulness' | 'search' | 'support' | 'methods'>('reflect');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityId>('therapist');

  const navItems = [
    { id: 'reflect', label: 'Reflection', icon: Brain, color: 'text-purple-400' },
    { id: 'live', label: 'Presence', icon: MessageSquare, color: 'text-indigo-400' },
    { id: 'journey', label: 'Journal', icon: Book, color: 'text-pink-400' },
    { id: 'path', label: 'Healing Path', icon: Route, color: 'text-cyan-400' },
    { id: 'mindfulness', label: 'Zen Space', icon: Wind, color: 'text-teal-400' },
    { id: 'emdr', label: 'EMDR Tool', icon: Eye, color: 'text-blue-400' },
    { id: 'methods', label: 'Methods', icon: Library, color: 'text-orange-400' },
    { id: 'search', label: 'Clinical', icon: Search, color: 'text-yellow-400' },
    { id: 'support', label: 'Support', icon: MapPin, color: 'text-green-400' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <aside className={`glass-panel border-r border-white/5 transition-all duration-500 flex flex-col z-30 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          {isSidebarOpen && <h1 className="font-serif text-2xl font-bold text-white tracking-tight">Lumina</h1>}
        </div>

        {isSidebarOpen && (
          <div className="px-6 py-4 space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
              <Users className="w-3 h-3" /> Spiritual Guides
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PERSONALITIES) as PersonalityId[]).map((pid) => {
                const p = PERSONALITIES[pid];
                const isActive = selectedPersonality === pid;
                return (
                  <button
                    key={pid}
                    onClick={() => setSelectedPersonality(pid)}
                    className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-2 group relative ${
                      isActive ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-sm font-black transition-all duration-500 ${isActive ? `${p.color} border-indigo-400 scale-110 animate-pulse` : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                      {p.name[0]}
                    </div>
                    <span className={`text-[8px] font-black uppercase truncate w-full text-center tracking-tighter ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                      {p.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <item.icon className={`w-6 h-6 shrink-0 transition-transform duration-500 group-hover:scale-110 ${item.color} ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`} />
              {isSidebarOpen && <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-zinc-600 hover:bg-white/5 transition-all group">
            <Compass className={`w-6 h-6 transition-transform duration-700 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
            {isSidebarOpen && <span className="text-xs uppercase font-black tracking-widest">Minimalist Mode</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 bg-black/10 backdrop-blur-3xl z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">
              {navItems.find(n => n.id === activeTab)?.label} Space
            </h2>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <Sparkles className={`w-4 h-4 ${PERSONALITIES[selectedPersonality].color} animate-pulse`} />
              <span className={`text-xs font-black uppercase tracking-widest ${PERSONALITIES[selectedPersonality].color}`}>
                Guided by {PERSONALITIES[selectedPersonality].name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-zinc-500 hover:text-white transition-all"><Settings className="w-5 h-5" /></button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-xl shadow-indigo-600/30 ring-2 ring-white/10" />
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'reflect' && <ChatWindow mode="Reflection" personalityId={selectedPersonality} />}
            {activeTab === 'live' && <VoiceSession personalityId={selectedPersonality} />}
            {activeTab === 'journey' && <MoodJournal />}
            {activeTab === 'path' && <TherapyPath />}
            {activeTab === 'mindfulness' && <MeditationHub personalityId={selectedPersonality} />}
            {activeTab === 'emdr' && <EMDRVisualizer />}
            {activeTab === 'methods' && <TherapyLibrary />}
            {activeTab === 'search' && <ChatWindow mode="Search" personalityId={selectedPersonality} />}
            {activeTab === 'support' && <ChatWindow mode="Resources" personalityId={selectedPersonality} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
