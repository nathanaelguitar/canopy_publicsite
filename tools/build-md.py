#!/usr/bin/env python3
"""Generate plain-Markdown twins (page.md) of the public pages, for AI agents.
Run from the repo root: python3 tools/build-md.py   (needs pandoc)"""
import re, subprocess, glob, pathlib
PAGES = ['index','canopy-code','flame','plans','support','privacy','terms'] + \
        [p[:-5] for p in sorted(glob.glob('blog/*.html'))]
BASE = 'https://canopychat.app'
for page in PAGES:
    html = pathlib.Path(page + '.html').read_text()
    m = re.search(r'<main[^>]*>(.*?)</main>', html, re.S)
    title = re.search(r'<title>(.*?)</title>', html, re.S).group(1).strip()
    body = re.sub(r'<(script|style|svg|form)\b.*?</\1>', '', m.group(1), flags=re.S)
    body = re.sub(r'<time[^>]*>', '<time>', body)
    body = re.sub(r'<div class="terminal-tabs".*?</div>', '', body, flags=re.S)
    body = re.sub(r'<span class="terminal-prompt"[^>]*>.*?</span>', '', body, flags=re.S)
    body = re.sub(r'<button\b.*?</button>', '', body, flags=re.S)
    body = re.sub(r'<div class="terminal-line[^"]*">\s*<code[^>]*>(.*?)</code>\s*</div>',
                  lambda x: '<pre><code>%s</code></pre>' % re.sub(r'<[^>]+>', '', x.group(1)).strip(), body, flags=re.S)
    md = subprocess.run(['pandoc', '-f', 'html', '-t', 'gfm-raw_html', '--wrap=none'],
                        input=body, capture_output=True, text=True, check=True).stdout
    md = re.sub(r'\]\((/[^)]*)\)', lambda x: '](%s%s)' % (BASE, x.group(1)), md)
    md = re.sub(r'\n{3,}', '\n\n', md).strip()
    url = BASE + ('/' if page == 'index' else '/' + page)
    out = '# %s\n\nSource: %s\n\n%s\n' % (title, url, md)
    out = re.sub(r'\n{3,}', '\n\n', out)
    pathlib.Path(page + '.md').write_text(out)
    # advertise the twin in the HTML head (idempotent)
    tag = '<link rel="alternate" type="text/markdown" href="%s.md">' % ('/' + page if page != 'index' else '/index')
    if 'type="text/markdown"' not in html:
        html = html.replace('</head>', '  %s\n</head>' % tag, 1)
        pathlib.Path(page + '.html').write_text(html)
    print('wrote', page + '.md', len(out))
