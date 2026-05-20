import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Play, Loader, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

interface AgentStep {
  thought: string;
  action?: { tool: string; input: string };
  observation?: string;
}

export function AgentStatus() {
  const [task, setTask] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const executeTask = async () => {
    if (!task.trim() || isRunning) return;
    setIsRunning(true);
    setResult(null);
    setSteps([]);

    try {
      const res = await fetch(`${BACKEND_URL}/api/agent/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, max_iterations: 5 }),
      });
      const data = await res.json();
      setResult(data);

      // Build steps from thoughts/actions/observations
      const newSteps: AgentStep[] = [];
      for (let i = 0; i < (data.thoughts?.length || 0); i++) {
        newSteps.push({
          thought: data.thoughts[i],
          action: data.actions?.[i],
          observation: data.observations?.[i],
        });
      }
      setSteps(newSteps);
    } catch (err) {
      setResult({ answer: `Error: ${err}`, error: true });
    }
    setIsRunning(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-[#ff00a0]" />
        <h2 className="text-lg font-mono font-bold text-white">Agent Loop</h2>
      </div>

      {/* Task Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeTask()}
          placeholder="Give the agent a complex task..."
          className="flex-1 bg-[#1a1a3a]/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:border-[#ff00a0]/50 focus:outline-none"
        />
        <button
          onClick={executeTask}
          disabled={isRunning || !task.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff00a0]/20 border border-[#ff00a0]/30 text-[#ff00a0] font-mono text-sm hover:bg-[#ff00a0]/30 transition-all disabled:opacity-50"
        >
          {isRunning ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Execute
        </button>
      </div>

      {/* Running Indicator */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-[#ff00a0] font-mono text-sm"
        >
          <Loader className="w-4 h-4 animate-spin" />
          Agent is thinking...
        </motion.div>
      )}

      {/* Steps */}
      <AnimatePresence>
        {steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 max-h-64 overflow-y-auto"
          >
            {steps.map((step, i) => (
              <div key={i} className="bg-[#1a1a3a]/30 rounded-lg border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                  className="w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-all"
                >
                  {expandedStep === i ? (
                    <ChevronDown className="w-3 h-3 text-white/40" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-white/40" />
                  )}
                  <span className="text-[10px] font-mono text-[#ff00a0]">Step {i + 1}</span>
                  <span className="text-xs font-mono text-white/60 truncate">{step.thought}</span>
                </button>
                <AnimatePresence>
                  {expandedStep === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3 pb-3 space-y-2"
                    >
                      {step.action && (
                        <div className="text-[10px] font-mono">
                          <span className="text-white/30">Action: </span>
                          <span className="text-[#00f0ff]">{step.action.tool}</span>
                          <span className="text-white/30"> → </span>
                          <span className="text-white/50">{step.action.input}</span>
                        </div>
                      )}
                      {step.observation && (
                        <div className="text-[10px] font-mono">
                          <span className="text-white/30">Observation: </span>
                          <span className="text-white/50 line-clamp-2">{step.observation}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-3 border ${
            result.error
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-green-500/10 border-green-500/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {result.error ? (
              <XCircle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            <span className="text-xs font-mono text-white/60">
              {result.iterations} iterations
            </span>
          </div>
          <p className="text-sm font-mono text-white">{result.answer}</p>
        </motion.div>
      )}
    </div>
  );
}
