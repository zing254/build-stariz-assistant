export const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour12: false });
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatShortDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export const generateId = () => Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 5);

export const getWeatherIcon = (code: number) => {
  if (code === 0) return 'sun';
  if (code <= 3) return 'cloud-sun';
  if (code <= 48) return 'cloud-fog';
  if (code <= 67) return 'cloud-rain';
  if (code <= 77) return 'snowflake';
  if (code <= 82) return 'cloud-rain-wind';
  if (code <= 86) return 'snowflake';
  if (code <= 99) return 'cloud-lightning';
  return 'sun';
};

export const weatherCodeToDesc = (code: number) => {
  const codes: Record<number, string> = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle',
    55: 'Heavy Drizzle', 61: 'Slight Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Slight Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
    80: 'Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
    85: 'Snow Showers', 86: 'Heavy Snow Showers', 95: 'Thunderstorm',
    96: 'Thunderstorm & Hail', 99: 'Heavy Thunderstorm',
  };
  return codes[code] || 'Unknown';
};

export const mockNews = [
  { id: '1', title: 'Neural Interface Breakthrough Allows Direct Brain-to-Cloud Upload', source: 'TechNexus', time: '2h ago', category: 'Tech' },
  { id: '2', title: 'Quantum Computing Reaches 10,000 Qubits Milestone', source: 'QuantumDaily', time: '4h ago', category: 'Science' },
  { id: '3', title: 'Mars Colony Alpha Reports First Self-Sustaining Harvest', source: 'SpaceFront', time: '5h ago', category: 'Space' },
  { id: '4', title: 'Global Cyber Defense Network Goes Live', source: 'CyberWatch', time: '7h ago', category: 'Security' },
  { id: '5', title: 'Fusion Reactor Achieves Net Positive Energy for 72 Hours', source: 'EnergyToday', time: '9h ago', category: 'Energy' },
  { id: '6', title: 'Autonomous Drone Fleet Completes Pacific Ocean Cleanup', source: 'EcoTech', time: '12h ago', category: 'Environment' },
];

export const quickLinks = [
  { name: 'GitHub', url: 'https://github.com', color: '#00f0ff' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', color: '#ffcc00' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', color: '#ff6600' },
  { name: 'Dev.to', url: 'https://dev.to', color: '#a855f7' },
  { name: 'MDN Docs', url: 'https://developer.mozilla.org', color: '#00ff88' },
  { name: 'Vercel', url: 'https://vercel.com', color: '#ffffff' },
  { name: 'Figma', url: 'https://figma.com', color: '#ff00a0' },
  { name: 'Notion', url: 'https://notion.so', color: '#ffffff' },
];

export const worldCities = [
  { name: 'New York', timezone: 'America/New_York' },
  { name: 'London', timezone: 'Europe/London' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo' },
  { name: 'Sydney', timezone: 'Australia/Sydney' },
  { name: 'Dubai', timezone: 'Asia/Dubai' },
];

export const fetchWithFallback = async <T>(
  fetcher: () => Promise<T>,
  fallback: T,
  timeout = 8000
): Promise<T> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const result = await fetcher();
    clearTimeout(timer);
    return result;
  } catch {
    return fallback;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};

export const exportData = () => {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('stariz-')) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || 'null');
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stariz-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
        resolve(true);
      } catch {
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
};

export const generatePassword = (length = 16, options = { upper: true, lower: true, numbers: true, symbols: true }) => {
  const chars = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };
  let pool = '';
  if (options.upper) pool += chars.upper;
  if (options.lower) pool += chars.lower;
  if (options.numbers) pool += chars.numbers;
  if (options.symbols) pool += chars.symbols;
  if (!pool) pool = chars.lower;

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += pool[array[i] % pool.length];
  }
  return password;
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const generateLorem = (paragraphs = 1) => {
  const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
    'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
    'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
    'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
    'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
  ];
  const result: string[] = [];
  for (let p = 0; p < paragraphs; p++) {
    const sentenceCount = 3 + Math.floor(Math.random() * 4);
    const sentences: string[] = [];
    for (let s = 0; s < sentenceCount; s++) {
      const wordCount = 8 + Math.floor(Math.random() * 10);
      const sentenceWords: string[] = [];
      for (let w = 0; w < wordCount; w++) {
        sentenceWords.push(words[Math.floor(Math.random() * words.length)]);
      }
      sentences.push(sentenceWords.join(' ') + '.');
    }
    result.push(sentences.join(' '));
  }
  return result.join('\n\n');
};

export const debounce = <F extends (...args: unknown[]) => unknown>(fn: F, delay: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
