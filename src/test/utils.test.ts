/**
 * Tests for STARIZ frontend utilities.
 */
import { describe, it, expect } from 'vitest';
import { parseMarkdown, formatMarkdownSimple } from '../utils/markdown.tsx';
import { formatTime, formatDate, getGreeting, generateId, generatePassword, generateUUID, generateLorem } from '../utils/helpers';

describe('Markdown Parser', () => {
  it('should handle bold text', () => {
    const result = parseMarkdown('**bold text**');
    expect(result).toContain('<strong');
    expect(result).toContain('bold text');
  });

  it('should handle italic text', () => {
    const result = parseMarkdown('*italic text*');
    expect(result).toContain('<em');
    expect(result).toContain('italic text');
  });

  it('should handle inline code', () => {
    const result = parseMarkdown('Use `console.log()`');
    expect(result).toContain('<code');
    expect(result).toContain('console.log()');
  });

  it('should handle code blocks', () => {
    const result = parseMarkdown('```python\nprint("hello")\n```');
    expect(result).toContain('<pre');
    expect(result).toContain('<code');
    expect(result).toContain('print("hello")');
  });

  it('should handle headings', () => {
    const h1 = parseMarkdown('# Heading 1');
    expect(h1).toContain('<h1');

    const h2 = parseMarkdown('## Heading 2');
    expect(h2).toContain('<h2');

    const h3 = parseMarkdown('### Heading 3');
    expect(h3).toContain('<h3');
  });

  it('should handle links', () => {
    const result = parseMarkdown('[Google](https://google.com)');
    expect(result).toContain('<a');
    expect(result).toContain('https://google.com');
    expect(result).toContain('Google');
  });

  it('should handle empty input', () => {
    expect(parseMarkdown('')).toBe('');
    expect(parseMarkdown(null as any)).toBe('');
  });

  it('should escape HTML', () => {
    const result = parseMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

describe('Simple Markdown Formatter', () => {
  it('should format bold text', () => {
    const result = formatMarkdownSimple('**bold**');
    expect(result).toContain('▸');
    expect(result).toContain('◂');
  });

  it('should format code', () => {
    const result = formatMarkdownSimple('Use `code`');
    expect(result).toContain('⟨');
    expect(result).toContain('⟩');
  });

  it('should format headings', () => {
    const result = formatMarkdownSimple('# Heading');
    expect(result).toContain('═══');
  });

  it('should format links', () => {
    const result = formatMarkdownSimple('[text](url)');
    expect(result).toContain('text (url)');
  });
});

describe('Helper Functions', () => {
  it('should format time', () => {
    const date = new Date(2024, 0, 1, 14, 30, 0);
    const time = formatTime(date);
    expect(time).toBe('14:30:00');
  });

  it('should format date', () => {
    const date = new Date(2024, 0, 15);
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('January');
  });

  it('should get correct greeting', () => {
    const morningDate = new Date(2024, 0, 1, 9, 0, 0);
    const originalDate = global.Date;
    global.Date = jest.fn(() => morningDate) as any;
    global.Date.prototype = originalDate.prototype;
    expect(getGreeting()).toBe('Good Morning');
    global.Date = originalDate;
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1.length).toBeGreaterThan(5);
  });

  it('should generate secure passwords', () => {
    const pwd = generatePassword(16);
    expect(pwd.length).toBe(16);

    const pwd2 = generatePassword(32);
    expect(pwd2.length).toBe(32);
  });

  it('should generate valid UUIDs', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should generate lorem ipsum', () => {
    const lorem = generateLorem(2);
    expect(lorem).toContain('lorem');
    expect(lorem.split('\n\n').length).toBe(2);
  });
});
