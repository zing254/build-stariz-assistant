import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';
import { generateId } from '../../../utils/helpers';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { toast } from '../../Toast';

export function TasksWidget() {
  const [tasks, setTasks] = useLocalStorage<Array<{ id: string; text: string; done: boolean; priority: 'low' | 'medium' | 'high' }>>('stariz-tasks', [
    { id: '1', text: 'Review system diagnostics', done: false, priority: 'high' },
    { id: '2', text: 'Update security protocols', done: true, priority: 'medium' },
    { id: '3', text: 'Sync neural network data', done: false, priority: 'low' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: generateId(), text: newTask, done: false, priority }]);
    setNewTask('');
    toast.success('Task added');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    toast.info('Task removed');
  };

  const priorityColor = { low: '#00ff88', medium: '#ffcc00', high: '#ff3366' };
  const pending = tasks.filter((t) => !t.done).length;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
        <span className="text-xs font-mono text-[#00ff88]/60 uppercase tracking-widest">Task Manager</span>
        <span className="ml-auto text-[10px] font-mono text-white/30">{pending} pending</span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add new mission..."
          className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-3 py-1.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/50"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none"
        >
          <option value="low">LOW</option>
          <option value="medium">MED</option>
          <option value="high">HIGH</option>
        </select>
        <button
          onClick={addTask}
          className="px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50 group hover:bg-[#0a0a1a] transition-colors"
            >
              <button onClick={() => toggleTask(task.id)}>
                {task.done ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                ) : (
                  <Circle className="w-4 h-4 text-white/30" />
                )}
              </button>
              <span className={`flex-1 text-xs font-mono ${task.done ? 'line-through text-white/30' : 'text-white/80'}`}>
                {task.text}
              </span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor[task.priority] }} />
              <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-[#ff3366]/60 hover:text-[#ff3366]" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-xs font-mono text-white/20">No missions assigned</div>
        )}
      </div>
    </div>
  );
}
