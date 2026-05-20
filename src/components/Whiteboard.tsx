import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Pencil, Eraser, Square, Circle as CircleIcon, Minus, Trash2, Download,
  Palette, Brush, Save, X
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from './Toast';

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'line';

interface Point { x: number; y: number }

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#00f0ff');
  const [brushSize, setBrushSize] = useState(3);
  const [savedBoards, setSavedBoards] = useLocalStorage<Array<{ id: string; name: string; data: string; date: number }>>('stariz-whiteboards', []);
  const [showSaved, setShowSaved] = useState(false);
  const [currentName] = useState('Untitled');
  const startPoint = useRef<Point | null>(null);
  const snapshot = useRef<ImageData | null>(null);

  const colors = [
    '#00f0ff', '#ff00a0', '#a855f7', '#00ff88', '#ffcc00',
    '#ff3366', '#ffffff', '#ff6600', '#38bdf8', '#f472b6',
  ];

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);
    // Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }, []);

  useEffect(() => {
    initCanvas();
    const onResize = () => initCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [initCanvas]);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    setIsDrawing(true);
    startPoint.current = pos;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = tool === 'eraser' ? '#0a0a1a' : color;
      ctx.lineWidth = brushSize * (tool === 'eraser' ? 3 : 1);
    } else {
      snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (snapshot.current && startPoint.current) {
      ctx.putImageData(snapshot.current, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';

      if (tool === 'rect') {
        ctx.strokeRect(startPoint.current.x, startPoint.current.y, pos.x - startPoint.current.x, pos.y - startPoint.current.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(pos.x - startPoint.current.x, 2) + Math.pow(pos.y - startPoint.current.y, 2));
        ctx.arc(startPoint.current.x, startPoint.current.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.moveTo(startPoint.current.x, startPoint.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const endDraw = () => {
    setIsDrawing(false);
    startPoint.current = null;
    snapshot.current = null;
  };

  const clearCanvas = () => {
    initCanvas();
    toast.info('Canvas cleared');
  };

  const saveBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    const board = { id: Date.now().toString(), name: currentName, data, date: Date.now() };
    setSavedBoards([board, ...savedBoards].slice(0, 20));
    toast.success('Whiteboard saved');
  };

  const loadBoard = (data: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    };
    img.src = data;
    setShowSaved(false);
    toast.success('Whiteboard loaded');
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `stariz-whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Image exported');
  };

  const tools: { id: Tool; icon: React.ElementType; label: string }[] = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rect', icon: Square, label: 'Rect' },
    { id: 'circle', icon: CircleIcon, label: 'Circle' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a3a] bg-[#0a0a1a]/60 backdrop-blur flex-wrap">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${
                tool === t.id
                  ? 'border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff]'
                  : 'border-[#1a1a3a] text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}

        <div className="w-px h-6 bg-[#1a1a3a] mx-1" />

        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-[#1a1a3a] mx-1" />

        <div className="flex items-center gap-2">
          <Brush className="w-3 h-3 text-white/30" />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 h-1"
          />
          <span className="text-[10px] font-mono text-white/40 w-4">{brushSize}</span>
        </div>

        <div className="w-px h-6 bg-[#1a1a3a] mx-1" />

        <button onClick={clearCanvas} className="flex items-center gap-1 px-2 py-1.5 rounded border border-[#ff3366]/20 text-[#ff3366]/60 hover:bg-[#ff3366]/10 text-[10px] font-mono">
          <Trash2 className="w-3 h-3" />
        </button>
        <button onClick={exportImage} className="flex items-center gap-1 px-2 py-1.5 rounded border border-[#00f0ff]/20 text-[#00f0ff]/60 hover:bg-[#00f0ff]/10 text-[10px] font-mono">
          <Download className="w-3 h-3" />
        </button>
        <button onClick={saveBoard} className="flex items-center gap-1 px-2 py-1.5 rounded border border-[#00ff88]/20 text-[#00ff88]/60 hover:bg-[#00ff88]/10 text-[10px] font-mono">
          <Save className="w-3 h-3" />
        </button>
        <button onClick={() => setShowSaved(!showSaved)} className="flex items-center gap-1 px-2 py-1.5 rounded border border-[#a855f7]/20 text-[#a855f7]/60 hover:bg-[#a855f7]/10 text-[10px] font-mono">
          <Palette className="w-3 h-3" />
          <span className="hidden sm:inline">{savedBoards.length}</span>
        </button>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
            className="absolute inset-0 cursor-crosshair touch-none"
          />
        </div>

        {/* Saved boards sidebar */}
        {showSaved && (
          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            className="w-64 border-l border-[#1a1a3a] bg-[#0a0a1a]/90 backdrop-blur flex flex-col"
          >
            <div className="flex items-center justify-between p-3 border-b border-[#1a1a3a]">
              <span className="text-xs font-mono text-white/60">Saved Boards</span>
              <button onClick={() => setShowSaved(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {savedBoards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => loadBoard(board.data)}
                  className="w-full text-left p-2 rounded bg-[#0f0f2a] border border-[#1a1a3a] hover:border-[#00f0ff]/30 transition-all group"
                >
                  <img src={board.data} alt={board.name} className="w-full h-20 object-cover rounded mb-1.5 bg-[#0a0a1a]" />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/60 truncate">{board.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSavedBoards(savedBoards.filter((b) => b.id !== board.id)); toast.info('Deleted'); }}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3 text-[#ff3366]/60" />
                    </button>
                  </div>
                  <span className="text-[9px] font-mono text-white/20">{new Date(board.date).toLocaleDateString()}</span>
                </button>
              ))}
              {savedBoards.length === 0 && (
                <div className="text-center py-8 text-xs font-mono text-white/20">No saved boards</div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
