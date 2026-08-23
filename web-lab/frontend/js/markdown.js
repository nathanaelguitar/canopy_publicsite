/**
 * Safe, robust lightweight Markdown parser with syntax highlighting and code block copy actions.
 */

export function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Keep model scratchpad markers and HTML-ish line breaks out of the UI. */
export function cleanAssistantText(rawText, { streaming = false } = {}) {
  if (!rawText) return '';

  let text = String(rawText)
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;br\s*\/?&gt;/gi, '\n');

  const closingThink = text.match(/<\/think\s*>/i);
  if (closingThink) {
    text = text.slice(closingThink.index + closingThink[0].length);
  } else {
    const openingThink = text.search(/<think(?:ing)?\b[^>]*>/i);
    const thinkingPreamble = text.match(/^\s*(?:here(?:['’]s| is)\s+)?a\s+thinking\s+process\s*:\s*/i);
    if (openingThink >= 0) {
      if (streaming) return '';
      text = text.slice(openingThink).replace(/^<think(?:ing)?\b[^>]*>/i, '');
    } else if (thinkingPreamble) {
      // Some local checkpoints emit a prose scratchpad with no <think> tags,
      // then mark the user-facing answer with a check emoji. Never render the
      // scratchpad as chat content, including in old Grove previews.
      const scratchpadSignal = /(?:thinking process|final output generation|self-correction|meets all criteria|analyze user input)/i.test(text);
      const answerMarker = text.match(/✅\s*/u);
      if (answerMarker) {
        text = text.slice(answerMarker.index + answerMarker[0].length);
        if (scratchpadSignal) {
          text = text.replace(/\s+->\s+(?:meets|fits|satisfies)\b.*$/is, '');
        }
      } else if (streaming) {
        return '';
      } else {
        const finalMarker = text.match(/(?:^|\n)\s*(?:final\s+(?:answer|response|output)|answer)\s*:\s*/i);
        if (finalMarker) {
          text = text.slice(finalMarker.index + finalMarker[0].length);
        } else {
          return '';
        }
      }
    }
  }

  return text.trim();
}

function parseSources(text) {
  const lines = text.split('\n');
  const sourcesHeaderIndex = lines.findLastIndex(l => l.trim().toLowerCase() === 'sources');
  
  if (sourcesHeaderIndex === -1) {
    return { body: text, sources: [] };
  }

  const bodyText = lines.slice(0, sourcesHeaderIndex).join('\n').trim();
  const sourceLines = lines.slice(sourcesHeaderIndex + 1).join('\n');
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const sources = [];
  let match;

  while ((match = linkRegex.exec(sourceLines)) !== null) {
    let url = match[2];
    let title = match[1];
    let host = '';
    try {
      host = new URL(url).hostname.replace('www.', '');
    } catch {
      host = url;
    }
    sources.push({
      title: title || host,
      url: url,
      host: host
    });
  }

  return { body: bodyText, sources };
}

function renderInline(text) {
  let out = escapeHtml(text);

  // Inline Code: `code`
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold & Italic: ***text***
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold: **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/(^|\s)_([^_]+)_(\s|$)/g, '$1<em>$2</em>$3');

  // Strikethrough: ~~text~~
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Links: [title](url)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return out;
}

export function renderMarkdown(rawText) {
  if (!rawText) return '';

  const cleanedText = cleanAssistantText(rawText, { streaming: true });
  if (!cleanedText) return '';

  const { body, sources } = parseSources(cleanedText);
  const lines = body.split(/\r?\n/);
  const htmlBlocks = [];

  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockContent = [];
  let inList = false;
  let listType = 'ul'; // 'ul' or 'ol'
  let inTable = false;
  let tableRows = [];

  function flushList() {
    if (inList) {
      htmlBlocks.push(`</${listType}>`);
      inList = false;
    }
  }

  function flushTable() {
    if (inTable && tableRows.length > 0) {
      let tableHtml = '<table><thead>';
      const headerCells = tableRows[0];
      tableHtml += '<tr>' + headerCells.map(c => `<th>${renderInline(c.trim())}</th>`).join('') + '</tr></thead><tbody>';
      
      for (let i = 1; i < tableRows.length; i++) {
        tableHtml += '<tr>' + tableRows[i].map(c => `<td>${renderInline(c.trim())}</td>`).join('') + '</tr>';
      }
      tableHtml += '</tbody></table>';
      htmlBlocks.push(tableHtml);
      tableRows = [];
      inTable = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code Block Fence
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim() || 'text';
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        const rawCode = codeBlockContent.join('\n');
        const escapedCode = escapeHtml(rawCode);
        const codeId = 'code-' + Math.random().toString(36).slice(2, 9);

        htmlBlocks.push(`
          <div class="code-block-wrapper">
            <div class="code-block-header">
              <span class="code-block-lang">${escapeHtml(codeBlockLang)}</span>
              <button class="code-block-copy-btn" data-code-id="${codeId}" aria-label="Copy code">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
              </button>
            </div>
            <pre class="code-block-pre"><code id="${codeId}">${escapedCode}</code></pre>
          </div>
        `);
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // 2. Table row: | col1 | col2 |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed.slice(1, -1).split('|');
      // Check if it's a separator line like |---|---|
      const isSeparator = cells.every(c => /^[\s:-]+$/.test(c));
      if (!isSeparator) {
        inTable = true;
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // 3. Headings: #, ##, ###, ####
    if (trimmed.startsWith('#')) {
      flushList();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = renderInline(match[2]);
        htmlBlocks.push(`<h${level}>${content}</h${level}>`);
        continue;
      }
    }

    // 4. Blockquotes: > quote
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s?/, '');
      htmlBlocks.push(`<blockquote><p>${renderInline(quoteText)}</p></blockquote>`);
      continue;
    }

    // 5. Unordered list item: - item or * item
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
        htmlBlocks.push('<ul>');
      }
      htmlBlocks.push(`<li>${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    // 6. Ordered list item: 1. item
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
        htmlBlocks.push('<ol>');
      }
      htmlBlocks.push(`<li>${renderInline(olMatch[2])}</li>`);
      continue;
    }

    // 7. Empty line or normal paragraph
    if (trimmed === '') {
      flushList();
      continue;
    }

    flushList();
    htmlBlocks.push(`<p>${renderInline(trimmed)}</p>`);
  }

  flushList();
  flushTable();

  // If still in unclosed code block, finish it
  if (inCodeBlock) {
    const rawCode = codeBlockContent.join('\n');
    htmlBlocks.push(`<pre class="code-block-pre"><code>${escapeHtml(rawCode)}</code></pre>`);
  }

  let finalHtml = htmlBlocks.join('');

  // 8. Append Sources Chips if present
  if (sources.length > 0) {
    let sourcesHtml = '<div class="sources-tray">';
    sources.forEach(src => {
      sourcesHtml += `
        <a class="source-chip" href="${escapeHtml(src.url)}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span>${escapeHtml(src.title)}</span>
        </a>
      `;
    });
    sourcesHtml += '</div>';
    finalHtml += sourcesHtml;
  }

  return finalHtml;
}
