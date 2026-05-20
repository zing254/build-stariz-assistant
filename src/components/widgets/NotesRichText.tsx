import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  StickyNote, Bold, Italic, Underline, List, ListOrdered,
  Quote, Code, Link, Image, Undo, Redo,
  Eye, EyeOff, Save, Trash2, Plus, Copy, Check,
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { generateId } from '../../utils/helpers';
import { toast } from '../Toast';

interface RichNote {
  id: string;
  title: string;
  content: string; // Markdown content
  html: string; // Rendered HTML
  color: string;
  createdAt: number;
  updatedAt: number;
}

const COLORS = ['#00f0ff', '#ff00a0', '#a855f7', '#00ff88', '#ffcc00'];

export default function NotesRichTextWidget() {
  const [notes, setNotes] = useLocalStorage<RichNote[]>('stariz-rich-notes', [
    {
      id: '1',
      title: 'Welcome Note',
      content: '# Welcome to STARIZ Notes\n\nThis is a **rich text** note with *Markdown* support.\n\n## Features\n- **Bold** and *italic* text\n- Lists and numbered items\n- Code blocks\n- And more!\n\n```javascript\nconst greeting = "Hello, Commander!";\nconsole.log(greeting);\n```',
      html: '',
      color: '#00f0ff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes, activeNoteId]);

  const renderMarkdown = (text: string): string => {
    // Simple Markdown parser (in production, use a library like marked or remark)
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Line breaks
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');

    return html;
  };

  const updateNoteContent = (content: string) => {
    if (!activeNote) return;
    const updatedNotes = notes.map(n =>
      n.id === activeNote.id
        ? { ...n, content, html: renderMarkdown(content), updatedAt: Date.now() }
        : n
    );
    setNotes(updatedNotes);
  };

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = activeNote?.content.slice(start, end) || '';
    const newText = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${suffix}`;
    
    const newContent = 
      activeNote!.content.slice(0, start) + 
      newText + 
      activeNote!.content.slice(end);
    
    updateNoteContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + (selectedText || '').length;
    }, 0);
  };

  const addNote = () => {
    const newNote: RichNote = {
      id: generateId(),
      title: 'New Note',
      content: '# New Note\n\nStart writing here...',
      html: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    toast.success('Note created');
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(notes[0]?.id || null);
    }
    toast.info('Note deleted');
  };

  const copyContent = async () => {
    if (!activeNote) return;
    try {
      await navigator.clipboard.writeText(activeNote.content);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-4 rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-[#ffcc00]" />
          <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">Rich Notes</span>
          <span className="text-[10px] font-mono text-white/30">{notes.length} notes</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsPreview(!isPreview)} className={`p-1 rounded ${isPreview ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'text-white/30 hover:text-white/60'}`}>
            {isPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={addNote} className="p-1 text-white/30 hover:text-[#ffcc00]">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* Sidebar - Note List */}
        <div className="w-1/3 overflow-y-auto space-y-1 pr-1 border-r border-[#1a1a3a]">
          {notes.map(note => (
            <motion.button
              key={note.id}
              whileHover={{ x: 2 }}
              onClick={() => setActiveNoteId(note.id)}
              className={`w-full text-left p-2 rounded-lg transition-all ${
                activeNoteId === note.id
                  ? 'bg-[#ffcc00]/10 border border-[#ffcc00]/20'
                  : 'hover:bg-[#1a1a3a]/50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: note.color }} />
                <span className={`text-xs font-mono font-semibold truncate ${activeNoteId === note.id ? 'text-white' : 'text-white/70'}`}>
                  {note.title}
                </span>
              </div>
              <p className="text-[9px] font-mono text-white/30 line-clamp-2">
                {note.content.replace(/[#*`>-\n]/g, '').slice(0, 60)}...
              </p>
            </motion.button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeNote ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-1 mb-2 p-1 bg-[#0a0a1a] rounded-lg">
                <button onClick={() => insertFormat('**', '**')} className="p-1.5 rounded hover:bg-[#1a1a3a] text-white/50 hover:text-white" title="Bold">
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => insertFormat('*', '*')} className="p-1.5 rounded hover:bg-[#1a1a3a] text-white/50 hover:text-white" title="Italic">
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => insertFormat('<u>', '</u>')} className="p-1.5 rounded hover:bg-[#1a1a3a] text-white/50 hover:text-white" title="Underline">
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-[#1a1a3a] mx-1" />
                <button onClick={() => insertFormat('- ', '')} className="p-1.5 rounded hover:bg-[#1a1a3a] text-white/50 hover:text-white" title="Bullet List">
                  <List className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => insertFormat('1. ', '')} className="p-1.5 rounded hover:bg-[#1a1a3a] text-white/50 hover:text-white" title="Numbered List">
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-[#1a1a3a] mx-1" />
                <button onClick={() => insertFormat('`', '`')} className="p-1.5 rounded hover:bg-[#1a1a3a] text-white/50 hover:text-white" title="Inline Code">
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => insertFormat('```javascript\n', '\n```')} className="p-1.5 rounded hover:bg-[#1a1a3a] text-white/50 hover:text-white" title="Code Block">
                  <Code className="w-3.5 h-3.5 text-[#ffcc00]" />
                </button>
                <div className="flex-1" />
                <button onClick={copyContent} className="p-1.5 rounded hover:bg-[#1a1a3a] text-white/50 hover:text-[#00f0ff]" title="Copy">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteNote(activeNote.id)} className="p-1.5 rounded hover:bg-[#ff3366]/20 text-white/50 hover:text-[#ff3366]" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Editor / Preview */}
              {isPreview ? (
                <div
                  className="flex-1 overflow-y-auto p-4 bg-[#0a0a1a] rounded-lg prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(activeNote.content) }}
                />
              ) : (
                <textarea
                  ref={textareaRef}
                  value={activeNote.content}
                  onChange={(e) => updateNoteContent(e.target.value)}
                  className="flex-1 p-3 bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#ffcc00]/30 resize-none"
                  placeholder="Write your notes in Markdown..."
                />
              )}

              {/* Note Info */}
              <div className="flex items-center justify-between mt-2 text-[9px] font-mono text-white/20">
                <span>Created: {new Date(activeNote.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(activeNote.updatedAt).toLocaleDateString()}</span>
                <span>{activeNote.content.length} chars</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <StickyNote className="w-12 h-12 text-white/10 mx-auto mb-2" />
                <p className="text-xs font-mono text-white/30">No note selected</p>
                <button onClick={addNote} className="mt-2 text-[#ffcc00] hover:underline text-xs font-mono">
                  Create a new note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
