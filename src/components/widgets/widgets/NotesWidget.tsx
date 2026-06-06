import { useState } from 'react';
import { motion } from 'framer-motion';
import { StickyNote, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../../utils/helpers';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { toast } from '../../Toast';

export function NotesWidget() {
  const [notes, setNotes] = useLocalStorage<Array<{ id: string; title: string; content: string; color: string }>>('stariz-notes', [
    { id: '1', title: 'System Logs', content: 'All subsystems operational. Neural link stable at 99.7% efficiency.', color: '#00f0ff' },
    { id: '2', title: 'Meeting Notes', content: 'Discuss quantum encryption upgrade with engineering team.', color: '#ff00a0' },
  ]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const colors = ['#00f0ff', '#ff00a0', '#a855f7', '#00ff88', '#ffcc00'];

  const addNote = () => {
    if (!newTitle.trim()) return;
    const id = generateId();
    setNotes([...notes, { id, title: newTitle, content: '', color: colors[Math.floor(Math.random() * colors.length)] }]);
    setNewTitle('');
    setActiveNote(id);
    toast.success('Note created');
  };

  const updateNote = (id: string, updates: Partial<{ title: string; content: string }>) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    if (activeNote === id) setActiveNote(null);
    toast.info('Note deleted');
  };

  const activeNoteData = notes.find((n) => n.id === activeNote);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-[#ffcc00]" />
        <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">Quick Notes</span>
      </div>

      {activeNoteData ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setActiveNote(null)} className="text-[#00f0ff]/60 hover:text-[#00f0ff]">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <input
              value={activeNoteData.title}
              onChange={(e) => updateNote(activeNoteData.id, { title: e.target.value })}
              className="flex-1 bg-transparent text-sm font-mono font-semibold text-white focus:outline-none"
              style={{ color: activeNoteData.color }}
            />
            <button onClick={() => deleteNote(activeNoteData.id)}>
              <Trash2 className="w-3.5 h-3.5 text-[#ff3366]/60 hover:text-[#ff3366]" />
            </button>
          </div>
          <textarea
            value={activeNoteData.content}
            onChange={(e) => updateNote(activeNoteData.id, { content: e.target.value })}
            placeholder="Type your notes here..."
            className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded p-3 text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#ffcc00]/30 resize-none"
          />
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="New note title..."
              className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-3 py-1.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#ffcc00]/50"
            />
            <button onClick={addNote} className="px-3 py-1.5 bg-[#ffcc00]/10 border border-[#ffcc00]/30 rounded text-[#ffcc00] hover:bg-[#ffcc00]/20">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {notes.map((note) => (
              <motion.button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                whileHover={{ scale: 1.02 }}
                className="w-full text-left p-3 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a] hover:border-[#1a1a3a] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: note.color }} />
                  <span className="text-xs font-mono font-semibold text-white/80 truncate">{note.title}</span>
                </div>
                <p className="text-[10px] font-mono text-white/40 mt-1 truncate">{note.content || 'No content...'}</p>
              </motion.button>
            ))}
            {notes.length === 0 && (
              <div className="text-center py-8 text-xs font-mono text-white/20">No notes yet</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
