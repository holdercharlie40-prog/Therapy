
import React, { useState, useEffect } from 'react';
import { Book, Heart, Calendar, ChevronRight, Save, Trash2, Maximize2, Minimize2, Search, Filter, Check } from 'lucide-react';
import { JournalEntry } from '../types';

type MoodFilter = 'all' | 'high' | 'mid' | 'low';

const MoodJournal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentMood, setCurrentMood] = useState(5);
  const [currentEmotion, setCurrentEmotion] = useState('Neutral');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all');

  useEffect(() => {
    const saved = localStorage.getItem('lumina_journal');
    if (saved) setEntries(JSON.parse(saved));
  }, []);

  const saveEntry = () => {
    setIsSaving(true);
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: Date.now(),
      content,
      mood: currentMood,
      emotion: currentEmotion
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem('lumina_journal', JSON.stringify(updated));
    setContent('');
    setTimeout(() => setIsSaving(false), 800);
  };

  const deleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this memory?')) return;
    const updated = entries.filter(entry => entry.id !== id);
    setEntries(updated);
    localStorage.setItem('lumina_journal', JSON.stringify(updated));
    if (expandedId === id) setExpandedId(null);
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (mood >= 6) return 'text-teal-400 bg-teal-500/10 border-teal-500/20';
    if (mood >= 4) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    if (mood >= 2) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const emotions = ['Overwhelmed', 'Anxious', 'Sad', 'Neutral', 'Calm', 'Grateful', 'Empowered'];

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         e.emotion.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesMood = true;
    if (moodFilter === 'high') matchesMood = e.mood >= 7;
    else if (moodFilter === 'mid') matchesMood = e.mood >= 4 && e.mood < 7;
    else if (moodFilter === 'low') matchesMood = e.mood < 4;

    return matchesSearch && matchesMood;
  });

  const filterOptions: { id: MoodFilter; label: string; color: string }[] = [
    { id: 'all', label: 'All Resonance', color: 'bg-zinc-800 text-zinc-400' },
    { id: 'high', label: 'High (7-10)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    { id: 'mid', label: 'Mid (4-6)', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { id: 'low', label: 'Low (1-3)', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Writing Section */}
      <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="glass-panel p-8 rounded-[2.5rem] space-y-8 border-indigo-500/10">
          <header className="space-y-2 text-center">
            <h3 className="text-2xl font-serif text-white flex items-center justify-center gap-3">
              <Heart className="w-6 h-6 text-rose-400 fill-rose-400/20" /> Today's Resonance
            </h3>
            <p className="text-sm text-zinc-500 italic">Every feeling is a guest. Welcome them all.</p>
          </header>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Intensity Score</span>
                <span className={`text-2xl font-serif ${getMoodColor(currentMood).split(' ')[0]}`}>{currentMood}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" step="1" 
                value={currentMood} 
                onChange={(e) => setCurrentMood(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {emotions.map(e => (
                  <button
                    key={e}
                    onClick={() => setCurrentEmotion(e)}
                    className={`px-4 py-2 rounded-2xl text-xs font-medium transition-all duration-300 border ${
                      currentEmotion === e 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-105' 
                        : 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                  <Book className="w-3 h-3" /> Private Reflection
                </div>
                <span>{content.length} characters</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Pour your subconscious onto the page. This is a fortress of safety..."
                className="w-full h-56 bg-zinc-900/50 border border-white/5 rounded-[1.5rem] p-6 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed placeholder:text-zinc-700 transition-all font-serif italic text-lg"
              />
              <button
                onClick={saveEntry}
                disabled={!content.trim() || isSaving}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Holding Space...</span>
                  </div>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> 
                    <span>Seal Memory</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Visual Trend */}
        <div className="glass-panel p-6 rounded-[2rem] border-white/5 bg-gradient-to-br from-zinc-900/50 to-black/50">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Emotional Architecture
          </h3>
          <div className="flex items-end gap-1.5 h-24 px-2">
            {entries.slice(0, 20).reverse().map((e, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-lg transition-all duration-500 group relative cursor-help ${getMoodColor(e.mood).split(' ')[2].replace('border-', 'bg-').replace('20', '40')}`}
                style={{ height: `${e.mood * 10}%` }}
              >
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-zinc-800 border border-white/10 text-[10px] p-2 rounded-xl whitespace-nowrap z-20 shadow-2xl">
                  <span className="font-bold text-white">{e.emotion}</span>
                  <div className="text-zinc-500 text-[8px] mt-0.5">{new Date(e.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20 italic text-sm text-zinc-500">
                <div className="h-px w-20 bg-zinc-700" />
                <span>No patterns yet</span>
                <div className="h-px w-20 bg-zinc-700" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="glass-panel rounded-[2.5rem] flex flex-col overflow-hidden border-white/5 bg-zinc-950/40">
        <div className="p-8 border-b border-white/5 bg-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif text-white">The Archive of You</h3>
            <div className="text-[10px] font-bold text-zinc-500 bg-white/5 px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5">
              {filteredEntries.length} {filteredEntries.length === entries.length ? 'Entries' : 'Matching'}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search past emotions or thoughts..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-zinc-700 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5 mr-2">
                <Filter className="w-3 h-3" /> Filter Range
              </div>
              {filterOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setMoodFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                    moodFilter === opt.id 
                      ? `${opt.color} border-current shadow-lg scale-105` 
                      : 'bg-transparent border-white/5 text-zinc-600 hover:border-white/10 hover:text-zinc-400'
                  }`}
                >
                  {moodFilter === opt.id && <Check className="w-2.5 h-2.5" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {filteredEntries.map(e => {
            const isExpanded = expandedId === e.id;
            const moodStyle = getMoodColor(e.mood);
            
            return (
              <div 
                key={e.id} 
                onClick={() => setExpandedId(isExpanded ? null : e.id)}
                className={`group p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer relative overflow-hidden ${
                  isExpanded 
                    ? 'bg-zinc-900 border-white/10 ring-1 ring-white/5' 
                    : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50 hover:border-white/10'
                }`}
              >
                {/* Visual mood bar on the side */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${moodStyle.split(' ')[0].replace('text-', 'bg-')}`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                        {new Date(e.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border transition-all ${moodStyle}`}>
                        {e.emotion}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(event) => deleteEntry(e.id, event)}
                      className="p-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-zinc-700">
                      {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-all" />}
                    </div>
                  </div>
                </div>

                <div className={`relative transition-all duration-500 ease-in-out ${isExpanded ? 'mb-4' : ''}`}>
                  <p className={`text-zinc-300 leading-relaxed italic font-serif transition-all duration-300 ${
                    isExpanded ? 'text-lg opacity-100' : 'text-sm opacity-60 line-clamp-2'
                  }`}>
                    "{e.content}"
                  </p>
                </div>

                {isExpanded && (
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest animate-in fade-in duration-700">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center gap-1.5"><Heart className="w-3 h-3" /> Score: {e.mood}/10</span>
                    </div>
                    <span className="opacity-40 italic">Stored in Local Sanctuary</span>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 border border-white/5">
                <Book className="w-8 h-8 opacity-20" />
              </div>
              <div className="space-y-1">
                <p className="text-zinc-500 font-serif italic">{entries.length === 0 ? 'The archive is silent.' : 'No resonance matches this filter.'}</p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
                  {entries.length === 0 ? 'Share your first reflection above' : 'Try adjusting your search or range'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodJournal;
