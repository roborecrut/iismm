import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Pre-process: convert **Headline** URL patterns to nested markdown links [Headline](URL)
  const processedContent = content.replace(/\*\*([^*]+)\*\*(?:\s*[:\-–—]?\s*)(https?:\/\/[^\s()<>]+)/g, '[$1]($2)');

  // Split content by code blocks to separate code and text
  const parts = processedContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-sans text-xs leading-relaxed text-slate-800 tracking-normal select-text">
      {parts.map((part, index) => {
        // If it is a code block
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          let language = 'text';
          let codeLines = lines;
          
          if (lines.length > 0 && /^[a-zA-Z0-9_-]+$/.test(lines[0])) {
            language = lines[0];
            codeLines = lines.slice(1);
          }
          
          const codeText = codeLines.join('\n');
          return (
            <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-200 shadow-xxs bg-slate-900 text-slate-100 font-mono text-[11px]">
              <div className="px-4 py-1.5 bg-slate-800 text-[10px] text-slate-400 flex justify-between items-center select-none font-bold uppercase tracking-wider">
                <span>{language}</span>
                <span className="text-[9px]">код</span>
              </div>
              <pre className="p-4 overflow-x-auto whitespace-pre scrolling-touch leading-relaxed">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }

        // Handle paragraphs and markdown headers, lists, links, tables, bold, italic
        const lines = part.split('\n');
        const renderedElements: React.ReactNode[] = [];
        let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null;
        let tableRows: string[][] | null = null;

        const flushList = (key: string) => {
          if (!listBuffer) return;
          const { type, items } = listBuffer;
          listBuffer = null;
          
          const parsedItems = items.map((item, i) => (
            <li key={i} className="ml-5 list-decimal py-0.5 leading-normal text-slate-700">
              {parseInlineMarkdown(item)}
            </li>
          ));

          renderedElements.push(
            type === 'ul' ? (
              <ul key={key} className="list-disc pl-5 my-2 space-y-1 text-slate-705">
                {parsedItems}
              </ul>
            ) : (
              <ol key={key} className="list-decimal pl-5 my-2 space-y-1 text-slate-705">
                {parsedItems}
              </ol>
            )
          );
        };

        const flushTable = (key: string) => {
          if (!tableRows || tableRows.length === 0) return;
          const rows = tableRows;
          tableRows = null;

          const isHeaderSep = (row: string[]) => row.every(cell => /^[:-|-]+$/.test(cell.trim()));
          
          // Filter out header separators
          const cleanRows = rows.filter(row => !isHeaderSep(row));
          if (cleanRows.length === 0) return;

          const hasHeader = rows.length > 1 && isHeaderSep(rows[1]);
          const headers = hasHeader ? cleanRows[0] : null;
          const bodyRows = hasHeader ? cleanRows.slice(1) : cleanRows;

          renderedElements.push(
            <div key={key} className="overflow-x-auto my-3.5 border border-slate-200/60 rounded-xl shadow-xxs">
              <table className="min-w-full divide-y divide-slate-200/50 text-xs">
                {headers && (
                  <thead className="bg-slate-50/70">
                    <tr>
                      {headers.map((cell, idx) => (
                        <th key={idx} className="px-3.5 py-2.5 text-left font-bold text-slate-700 uppercase tracking-widest text-[9.5px] border-r border-slate-200 last:border-0">
                          {parseInlineMarkdown(cell.trim())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-slate-100/50 bg-white">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/20' : ''}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-slate-650 border-r border-slate-100 last:border-0 leading-relaxed max-w-xs break-words">
                          {parseInlineMarkdown(cell.trim())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        };

        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i];
          const line = rawLine.trim();

          // 1. Tables check: lines containing "|"
          if (line.startsWith('|') && line.endsWith('|')) {
            flushList(`list-before-table-${index}-${i}`);
            const cells = rawLine.split('|').slice(1, -1);
            if (!tableRows) tableRows = [];
            tableRows.push(cells);
            continue;
          } else {
            flushTable(`table-before-line-${index}-${i}`);
          }

          // 2. Blockquotes Check
          if (line.startsWith('>')) {
            flushList(`list-before-quote-${index}-${i}`);
            const quoteContent = line.replace(/^>\s*/, '');
            renderedElements.push(
              <blockquote key={`quote-${index}-${i}`} className="border-l-4 border-pink-400 pl-4 py-1.5 my-3 bg-pink-500/5 text-slate-650 italic rounded-r-lg font-medium leading-relaxed">
                {parseInlineMarkdown(quoteContent)}
              </blockquote>
            );
            continue;
          }

          // 3. Headers Check
          if (line.startsWith('#')) {
            flushList(`list-before-header-${index}-${i}`);
            let level = 0;
            while (line[level] === '#') level++;
            const headerText = line.substring(level).trim();
            
            if (level === 1) {
              renderedElements.push(
                <h1 key={`h1-${index}-${i}`} className="text-base sm:text-lg font-black text-slate-800 tracking-tight mt-4 mb-2 flex items-center gap-1">
                  {parseInlineMarkdown(headerText)}
                </h1>
              );
            } else if (level === 2) {
              renderedElements.push(
                <h2 key={`h2-${index}-${i}`} className="text-sm sm:text-base font-extrabold text-slate-850 tracking-tight mt-3.5 mb-2 border-b border-slate-100 pb-1 flex items-center gap-1">
                  {parseInlineMarkdown(headerText)}
                </h2>
              );
            } else {
              renderedElements.push(
                <h3 key={`h3-${index}-${i}`} className="text-xs sm:text-sm font-bold text-slate-800 mt-3 mb-1.5 flex items-center gap-1">
                  {parseInlineMarkdown(headerText)}
                </h3>
              );
            }
            continue;
          }

          // 4. List Check
          const unorderedMatch = line.match(/^([*-])\s+(.*)/);
          const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);

          if (unorderedMatch) {
            const content = unorderedMatch[2];
            if (!listBuffer || listBuffer.type !== 'ul') {
              flushList(`list-flush-${index}-${i}`);
              listBuffer = { type: 'ul', items: [] };
            }
            listBuffer.items.push(content);
            continue;
          } else if (orderedMatch) {
            const content = orderedMatch[2];
            if (!listBuffer || listBuffer.type !== 'ol') {
              flushList(`list-flush-${index}-${i}`);
              listBuffer = { type: 'ol', items: [] };
            }
            listBuffer.items.push(content);
            continue;
          } else {
            // Not a list element, flush list buffer if we have one
            flushList(`list-end-${index}-${i}`);
          }

          // 5. Empty line or normal Paragraph
          if (line === '') {
            continue;
          }

          // Plain paragraph with inline tokens
          renderedElements.push(
            <div key={`p-${index}-${i}`} className="leading-relaxed mb-2 text-slate-700 whitespace-pre-wrap">
              {parseInlineMarkdown(line)}
            </div>
          );
        }

        // End-of-part flushes
        flushList(`list-final-${index}`);
        flushTable(`table-final-${index}`);

        return <div key={index}>{renderedElements}</div>;
      })}
    </div>
  );
}

// Function to parse bold, italic, code, links, and audio URLs within a single line
function parseInlineMarkdown(text: string): React.ReactNode {
  if (!text) return '';

  // Return voice/audio playback player directly if text only contains or includes an audio stream
  const grabAudioUrl = (str: string): string | null => {
    // Check for standard URL
    const match = str.match(/https?:\/\/[^\s"'<>]+\.(webm|mp3|wav|ogg|m4a)/i);
    if (match) return match[0];
    
    // Check for our relative server path /uploads/...
    const localMatch = str.match(/\/uploads\/[^\s"'<>]+\.(webm|mp3|wav|ogg|m4a)/i);
    if (localMatch) return localMatch[0];

    return null;
  };

  const audioUrl = grabAudioUrl(text);

  // We parse segments of the text sequentially for inline codes, bold, italic, and links.
  // RegEx tokens: 
  const tokens = [
    { type: 'code', regex: /`([^`]+)`/g },
    { type: 'bold', regex: /\*\*([^*]+)\*\*/g },
    { type: 'italic', regex: /\*([^*]+)\*/g },
    { type: 'link', regex: /\[([^\]]+)\]\(([^)]+)\)/g },
    { type: 'url', regex: /(https?:\/\/[^\s()<>]+)/g }
  ];

  // Simple token matching
  interface Segment {
    type: 'text' | 'code' | 'bold' | 'italic' | 'link' | 'url';
    content: string;
    linkUrl?: string;
  }

  let segments: Segment[] = [{ type: 'text', content: text }];

  for (const token of tokens) {
    const nextSegments: Segment[] = [];
    
    for (const seg of segments) {
      if (seg.type !== 'text') {
        nextSegments.push(seg);
        continue;
      }

      let lastIndex = 0;
      token.regex.lastIndex = 0;
      let match;
      let iterations = 0;

      while ((match = token.regex.exec(seg.content)) !== null) {
        // Prevent infinite loops just in case
        if (iterations++ > 100) break;

        if (match.index > lastIndex) {
          nextSegments.push({
            type: 'text',
            content: seg.content.substring(lastIndex, match.index)
          });
        }

        if (token.type === 'code') {
          nextSegments.push({ type: 'code', content: match[1] });
        } else if (token.type === 'bold') {
          nextSegments.push({ type: 'bold', content: match[1] });
        } else if (token.type === 'italic') {
          nextSegments.push({ type: 'italic', content: match[1] });
        } else if (token.type === 'link') {
          nextSegments.push({ type: 'link', content: match[1], linkUrl: match[2] });
        } else if (token.type === 'url') {
          nextSegments.push({ type: 'url', content: match[1], linkUrl: match[1] });
        }

        lastIndex = token.regex.lastIndex;
      }

      if (lastIndex < seg.content.length) {
        nextSegments.push({
          type: 'text',
          content: seg.content.substring(lastIndex)
        });
      }
    }
    
    segments = nextSegments;
  }

  const jsxElements = segments.map((seg, i) => {
    switch (seg.type) {
      case 'code':
        return (
          <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-pink-600 font-mono text-[10.5px] border border-slate-200/50">
            {seg.content}
          </code>
        );
      case 'bold':
        return <strong key={i} className="font-bold text-slate-900">{seg.content}</strong>;
      case 'italic':
        return <em key={i} className="italic text-slate-750">{seg.content}</em>;
      case 'link':
        // Check if destination is audio file
        const isAudioLink = seg.linkUrl && /\.(webm|mp3|wav|ogg|m4a)/i.test(seg.linkUrl);
        if (isAudioLink && seg.linkUrl) {
          return (
            <span key={i} className="block my-2 p-3 bg-pink-500/5 border border-pink-150/10 rounded-2xl max-w-sm">
              <span className="text-[10px] text-pink-600 font-bold block mb-1">🎤 Голосовое сообщение:</span>
              <audio controls src={seg.linkUrl} className="w-full h-8 focus:outline-none" />
            </span>
          );
        }
        return (
          <a key={i} href={seg.linkUrl} target="_blank" rel="noopener noreferrer" className="text-pink-500 font-semibold hover:underline inline-flex items-center gap-0.5 transition-colors">
            {seg.content}
            <span className="text-[9px]">↗</span>
          </a>
        );
      case 'url':
        const isAudioUrl = seg.linkUrl && /\.(webm|mp3|wav|ogg|m4a)/i.test(seg.linkUrl);
        if (isAudioUrl && seg.linkUrl) {
          return (
            <span key={i} className="block my-2 p-3 bg-pink-500/5 border border-pink-150/15 rounded-2xl max-w-sm">
              <span className="text-[10px] text-pink-600 font-bold block mb-1">🎵 Аудио трек:</span>
              <audio controls src={seg.linkUrl} className="w-full h-8 focus:outline-none" />
            </span>
          );
        }
        return (
          <a key={i} href={seg.linkUrl} target="_blank" rel="noopener noreferrer" className="text-pink-500 font-semibold hover:underline transition-colors break-all">
            {seg.content}
          </a>
        );
      default:
        return seg.content;
    }
  });

  return (
    <>
      {jsxElements}
      {audioUrl && (
        <div className="mt-2.5 p-2 bg-pink-500/5 border border-pink-200/10 rounded-2xl flex flex-col gap-1.5 max-w-xs shrink-0 shadow-xxs">
          <span className="text-[10px] text-pink-600 font-bold tracking-wide uppercase flex items-center gap-1 font-sans">
            <span className="animate-pulse">🔊</span> Голосовой ответ
          </span>
          <audio controls src={audioUrl} className="w-full h-8" />
        </div>
      )}
    </>
  );
}
