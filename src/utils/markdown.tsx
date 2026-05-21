/**
 * Simple Markdown Renderer for AI responses.
 * Converts markdown text to HTML-safe React elements.
 */

interface MarkdownToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'codeblock' | 'heading' | 'list' | 'link' | 'newline' | 'hr';
  content: string;
  level?: number;
}

export function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  // Escape HTML (but preserve our markdown)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre class="bg-[#0a0a1a] border border-white/10 rounded-lg p-3 my-2 overflow-x-auto"><code class="text-xs font-mono text-[#00f0ff]">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[#0a0a1a] border border-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-[#ff00a0]">$1</code>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em class="italic text-white/80">$1</em>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-[#00f0ff] mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-base font-bold text-[#00f0ff] mt-3 mb-1">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-[#00f0ff] mt-3 mb-1">$1</h1>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="border-white/10 my-3" />');

  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc text-white/70">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-white/70">$1</li>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#00f0ff] underline hover:text-[#00ff88]">$1</a>');

  // Line breaks (double newline = paragraph, single = br)
  html = html.replace(/\n\n/g, '</p><p class="my-2">');
  html = html.replace(/\n/g, '<br />');

  // Wrap in paragraph
  html = `<p class="my-2">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p class="my-2"><\/p>/g, '');

  return html;
}

export function renderMarkdown(text: string): React.ReactNode {
  const html = parseMarkdown(text);
  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function formatMarkdownSimple(text: string): string {
  /**
   * Simple text formatter that preserves markdown-like formatting
   * for display in monospace contexts.
   */
  if (!text) return '';

  let result = text;

  // Bold: **text** → text (with visual indicator)
  result = result.replace(/\*\*(.+?)\*\*/g, '▸ $1 ◂');

  // Code: `text` → [text]
  result = result.replace(/`([^`]+)`/g, '⟨$1⟩');

  // Headings: # text → === text ===
  result = result.replace(/^### (.+)$/gm, '─── $1 ───');
  result = result.replace(/^## (.+)$/gm, '═══ $1 ═══');
  result = result.replace(/^# (.+)$/gm, '═══ $1 ═══');

  // Links: [text](url) → text (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  return result;
}
