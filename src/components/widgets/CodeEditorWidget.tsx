import { useState, useRef, useEffect } from 'react';
import {
  Play, Save, FileText, RefreshCw, Copy, X, Plus, FileEdit
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from '../Toast';

interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'json', label: 'JSON', ext: 'json' },
  { id: 'markdown', label: 'Markdown', ext: 'md' },
];

export default function CodeEditorWidget() {
  const [files, setFiles] = useLocalStorage<CodeFile[]>('stariz-code-files', [
    { id: '1', name: 'script.js', content: '// Welcome to STARIZ Code Editor\nconsole.log("Hello, Commander!");\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));', language: 'javascript' },
  ]);
  const [activeFileId, setActiveFileId] = useState(files[0]?.id || '');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content);
      setLanguage(activeFile.language);
    }
  }, [activeFile, activeFileId]);

  const saveFile = () => {
    if (!activeFile) return;
    setFiles(files.map(f =>
      f.id === activeFileId
        ? { ...f, content, language, name: activeFile.name }
        : f
    ));
    setIsEditing(false);
    toast.success('File saved');
  };

  const createFile = () => {
    if (!newFileName.trim()) return;

    const ext = newFileName.split('.').pop() || 'js';
    const lang = LANGUAGES.find(l => l.ext === ext)?.id || 'javascript';

    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: newFileName,
      content: `// New file: ${newFileName}`,
      language: lang,
    };

    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setNewFileName('');
    setShowNewFile(false);
    toast.success('File created');
  };

  const deleteFile = (id: string) => {
    if (files.length <= 1) {
      toast.error('Cannot delete the last file');
      return;
    }
    setFiles(files.filter(f => f.id !== id));
    if (activeFileId === id) {
      setActiveFileId(files[0]?.id || '');
    }
    toast.info('File deleted');
  };

  const runCode = () => {
    if (language !== 'javascript') {
      toast.info('Execution only supported for JavaScript');
      return;
    }

    // Execute JavaScript in a DOM-less Worker with a hard timeout instead of
    // evaluating it in the application window.
    const workerSource = `self.onmessage = function(event) {
      try {
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.map(String).join(' '));
        const result = (function() { ${content} })();
        originalLog.call(console, JSON.stringify({ ok: true, result: result === undefined ? '' : String(result), logs }));
      } catch (error) {
        console.log(JSON.stringify({ ok: false, error: error && error.message ? error.message : String(error) }));
      }
    };`;
    const worker = new Worker(URL.createObjectURL(new Blob([workerSource], { type: 'application/javascript' })));
    const timeout = window.setTimeout(() => {
      worker.terminate();
      toast.error('Execution stopped after 2 seconds');
    }, 2000);
    worker.onmessage = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      try {
        const result = JSON.parse(event.data);
        if (!result.ok) toast.error(`Error: ${result.error}`);
        else toast.success(result.logs?.length ? `Output: ${result.logs.join(' | ')}` : 'Code executed successfully');
      } catch { toast.error('Execution returned an unreadable result'); }
    };
    worker.onerror = (error) => {
      window.clearTimeout(timeout);
      worker.terminate();
      toast.error(`Execution error: ${error.message || 'unknown error'}`);
    };
    worker.postMessage(null);
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Code copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const formatContent = () => {
    try {
      if (language === 'json') {
        const parsed = JSON.parse(content);
        setContent(JSON.stringify(parsed, null, 2));
        toast.success('JSON formatted');
      } else {
        toast.info('Format only available for JSON');
      }
    } catch {
      toast.error('Invalid JSON');
    }
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-4 rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileEdit className="w-4 h-4 text-[#a855f7]" />
          <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Code Editor</span>
          <span className="text-[10px] font-mono text-white/30">{files.length} files</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewFile(!showNewFile)}
            className="p-1 text-white/30 hover:text-[#a855f7] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {isEditing && (
            <button
              onClick={saveFile}
              className="p-1 text-[#00ff88] hover:text-[#00ff88]/80 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={runCode}
            className="p-1 text-white/30 hover:text-[#ffcc00] transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* File tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {files.map((file) => (
          <button
            key={file.id}
            onClick={() => setActiveFileId(file.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all whitespace-nowrap ${
              activeFileId === file.id
                ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30'
                : 'bg-[#0a0a1a]/50 text-white/40 hover:text-white/60'
            }`}
          >
            <FileText className="w-3 h-3" />
            {file.name}
            {files.length > 1 && (
              <X
                className="w-3 h-3 ml-1 hover:text-[#ff3366]"
                onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
              />
            )}
          </button>
        ))}
      </div>

      {/* New file input */}
      {showNewFile && (
        <div className="mb-3 flex gap-2">
          <input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createFile()}
            placeholder="filename.js..."
            className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#a855f7]/50"
            autoFocus
          />
          <button
            onClick={createFile}
            className="px-2 py-1 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded text-[#a855f7] text-xs font-mono hover:bg-[#a855f7]/20"
          >
            CREATE
          </button>
          <button
            onClick={() => { setShowNewFile(false); setNewFileName(''); }}
            className="px-2 py-1 text-white/40 text-xs font-mono hover:text-white/60"
          >
            X
          </button>
        </div>
      )}

      {/* Language selector */}
      <div className="flex items-center gap-2 mb-3">
        <select
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            if (activeFile) {
              setFiles(files.map(f =>
                f.id === activeFileId
                  ? { ...f, language: e.target.value }
                  : f
              ));
            }
          }}
          className="bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>{lang.label}</option>
          ))}
        </select>
        <button
          onClick={formatContent}
          className="p-1 text-white/30 hover:text-[#00f0ff] transition-colors"
          title="Format code"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={copyContent}
          className="p-1 text-white/30 hover:text-[#00f0ff] transition-colors"
          title="Copy code"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg overflow-hidden">
          {/* Line numbers */}
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#0f0f2a]/50 border-r border-[#1a1a3a] overflow-hidden">
            {content.split('\n').map((_, i) => (
              <div key={i} className="text-right pr-2 text-[10px] font-mono text-white/20 leading-6">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); setIsEditing(true); }}
            className="w-full h-full pl-12 pr-3 py-2 bg-transparent text-xs font-mono text-[#00ff88] focus:outline-none resize-none leading-6"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            spellCheck={false}
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between mt-2 text-[9px] font-mono text-white/30">
          <span>{content.split('\n').length} lines</span>
          <span>{content.length} chars</span>
          <span className={isEditing ? 'text-[#ffcc00]' : 'text-[#00ff88]'}>
            {isEditing ? 'MODIFIED' : 'SAVED'}
          </span>
          <span>{language.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
