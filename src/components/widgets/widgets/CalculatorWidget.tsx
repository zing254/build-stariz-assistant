import { useState } from 'react';

export function CalculatorWidget() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState('');
  const [op, setOp] = useState('');
  const [newNum, setNewNum] = useState(true);

  const handleNum = (n: string) => {
    if (newNum) {
      setDisplay(n);
      setNewNum(false);
    } else {
      setDisplay(display === '0' ? n : display + n);
    }
  };

  const handleOp = (o: string) => {
    setPrev(display);
    setOp(o);
    setNewNum(true);
  };

  const calculate = () => {
    const a = parseFloat(prev);
    const b = parseFloat(display);
    let res = 0;
    switch (op) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case '*': res = a * b; break;
      case '/': res = b !== 0 ? a / b : 0; break;
    }
    setDisplay(String(Math.round(res * 1000000) / 1000000));
    setOp('');
    setNewNum(true);
  };

  const clear = () => {
    setDisplay('0');
    setPrev('');
    setOp('');
    setNewNum(true);
  };

  const buttons = [
    ['C', '÷', '×', '⌫'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', '%', '='],
  ];

  const getBtnClass = (btn: string) => {
    if (['C', '⌫'].includes(btn)) return 'bg-[#ff3366]/10 text-[#ff3366] border-[#ff3366]/30 hover:bg-[#ff3366]/20';
    if (['÷', '×', '-', '+', '=', '%'].includes(btn)) return 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30 hover:bg-[#00f0ff]/20';
    return 'bg-[#0a0a1a] text-white/80 border-[#1a1a3a] hover:bg-[#1a1a3a]';
  };

  const handleBtn = (btn: string) => {
    if (btn >= '0' && btn <= '9') handleNum(btn);
    else if (btn === '.') handleNum('.');
    else if (btn === 'C') clear();
    else if (btn === '⌫') setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    else if (btn === '÷') handleOp('/');
    else if (btn === '×') handleOp('*');
    else if (['+', '-'].includes(btn)) handleOp(btn);
    else if (btn === '%') setDisplay(String(parseFloat(display) / 100));
    else if (btn === '=') calculate();
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded border border-[#00f0ff]/40 flex items-center justify-center">
          <span className="text-[#00f0ff] text-[10px] font-mono">=</span>
        </div>
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Calculator</span>
      </div>

      <div className="bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg p-3 mb-3 text-right">
        <div className="text-[10px] font-mono text-white/30 h-4">{prev} {op}</div>
        <div className="text-xl font-mono font-bold text-[#00f0ff] truncate">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {buttons.flat().map((btn, i) => (
          <button
            key={`${btn}-${i}`}
            onClick={() => handleBtn(btn)}
            className={`rounded border text-sm font-mono font-semibold transition-all active:scale-95 ${getBtnClass(btn)} ${
              btn === '0' ? 'col-span-1' : ''
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
