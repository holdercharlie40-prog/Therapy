
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
      {/* Sidebar */}
      <aside className={`glass-panel border-r border-white/5 transition-all duration-500 flex flex-col z-30 ${isSidebarOpen ? 'w-80' : 'w-24'}`}>
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
            <Heart className="w-7 h-7 fill-current" />
          </div>
          {isSidebarOpen && <h1 className="font-serif text-3xl font-bold text-white tracking-tighter">Lumina</h1>}
        </div>

        {isSidebarOpen && (
          <div className="px-6 py-4 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3 h-3" /> Spiritual Guides
              </h3>
            </div>
            {/* Bigger Guide Squares */}
            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(PERSONALITIES) as PersonalityId[]).map((pid) => {
                const p = PERSONALITIES[pid];
                const isActive = selectedPersonality === pid;
                return (
                  <button
                    key={pid}
                    onClick={() => setSelectedPersonality(pid)}
                    className={`p-4 rounded-[1.5rem] border transition-all flex flex-col items-center gap-3 group relative ${
                      isActive 
                        ? 'bg-indigo-600/20 border-indigo-500/50 shadow-xl ring-1 ring-indigo-500/20' 
                        : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-xl font-black transition-all duration-500 ${isActive ? `${p.color} border-indigo-400 scale-110 shadow-lg` : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                      {p.name[0]}
                    </div>
                    <div className="text-center">
                      <span className={`text-[9px] font-black uppercase block tracking-widest ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                        {p.name.split(' ')[0]}
                      </span>
                    </div>
                    {isActive && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/5' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <item.icon className={`w-7 h-7 shrink-0 transition-transform duration-500 group-hover:scale-110 ${item.color} ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`} />
              {isSidebarOpen && <span className="font-black text-[11px] uppercase tracking-[0.2em]">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-zinc-600 hover:bg-white/5 transition-all group">
            <Compass className={`w-6 h-6 transition-transform duration-700 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
            {isSidebarOpen && <span className="text-[10px] uppercase font-black tracking-widest">Condense View</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        <header className="h-24 flex items-center justify-between px-12 border-b border-white/5 bg-black/10 backdrop-blur-3xl z-20">
          <div className="flex items-center gap-8">
            <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.5em]">
              {navItems.find(n => n.id === activeTab)?.label} Experience
            </h2>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              <Sparkles className={`w-5 h-5 ${PERSONALITIES[selectedPersonality].color} animate-pulse`} />
              <div className="flex flex-col">
                <span className={`text-sm font-serif italic text-white`}>
                  Guided by {PERSONALITIES[selectedPersonality].name}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                  {PERSONALITIES[selectedPersonality].role}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button className="text-zinc-500 hover:text-white transition-all hover:rotate-90 duration-500">
              <Settings className="w-6 h-6" />
            </button>
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-2xl shadow-indigo-600/30 ring-2 ring-white/10" />
          </div>
        </header>

        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto h-full animate-in fade-in duration-1000">
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
