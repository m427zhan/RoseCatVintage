"""Convert the Module*.md files in this folder into linked HTML pages in ./html.

Usage:  python build_html.py
Re-run any time you edit a Markdown file.
"""
import html
import re
from pathlib import Path

import markdown

DOC_DIR = Path(__file__).parent
OUT_DIR = DOC_DIR / "html"

CSS = """
:root {
  --bg: #fbf7f4; --panel: #ffffff; --text: #2e2a28; --muted: #7a6e69;
  --accent: #b5566e; --border: #eadfd9; --code-bg: #f3ece8;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1c1918; --panel: #242120; --text: #ece6e3; --muted: #a89c97;
    --accent: #e48aa1; --border: #3a3432; --code-bg: #2d2826;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text);
  font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
.layout { display: flex; min-height: 100vh; }
nav { width: 260px; flex-shrink: 0; background: var(--panel);
  border-right: 1px solid var(--border); padding: 24px 16px;
  position: sticky; top: 0; height: 100vh; overflow-y: auto; }
nav .brand { font-weight: 700; font-size: 1.1rem; color: var(--accent);
  margin: 0 8px 16px; display: block; text-decoration: none; }
nav a.item { display: block; padding: 8px 10px; border-radius: 6px;
  color: var(--text); text-decoration: none; font-size: .95rem; }
nav a.item:hover { background: var(--code-bg); }
nav a.item.active { background: var(--accent); color: #fff; }
main { flex: 1; min-width: 0; padding: 40px 48px; max-width: 900px; }
h1 { color: var(--accent); margin-top: 0; }
h2 { border-bottom: 1px solid var(--border); padding-bottom: 4px; margin-top: 2em; }
a { color: var(--accent); }
hr { border: 0; border-top: 1px solid var(--border); margin: 2em 0; }
blockquote { margin: 1em 0; padding: 8px 16px; border-left: 4px solid var(--accent);
  background: var(--code-bg); color: var(--muted); border-radius: 0 6px 6px 0; }
blockquote p { margin: 0; }
code { background: var(--code-bg); padding: 2px 5px; border-radius: 4px; font-size: .9em; }
pre { background: var(--code-bg); padding: 14px; border-radius: 8px; overflow-x: auto; }
pre code { padding: 0; background: none; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; display: block; overflow-x: auto; }
th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
th { background: var(--code-bg); }
ul.task-list { list-style: none; padding-left: 4px; }
ul.task-list input { margin-right: 8px; accent-color: var(--accent); }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
  padding: 18px; text-decoration: none; color: var(--text); }
.card:hover { border-color: var(--accent); }
.card .num { color: var(--accent); font-weight: 700; font-size: .85rem; }
.card .title { font-weight: 600; font-size: 1.05rem; }
@media (max-width: 760px) {
  .layout { flex-direction: column; }
  nav { width: 100%; height: auto; position: static; border-right: 0;
    border-bottom: 1px solid var(--border); }
  main { padding: 24px 16px; }
}
"""


def module_files():
    files = list(DOC_DIR.glob("Module*.md"))
    return sorted(files, key=lambda p: int(re.match(r"Module(\d+)", p.stem).group(1)))


def title_of(md_text, fallback):
    m = re.search(r"^#\s+(.+)$", md_text, re.M)
    return m.group(1).strip() if m else fallback


def fix_list_spacing(md_text):
    # Python-Markdown needs a blank line before a list; GitHub doesn't. Add one.
    out = []
    for line in md_text.splitlines():
        is_item = re.match(r"\s*([-*+]|\d+\.)\s", line)
        prev = out[-1] if out else ""
        if is_item and prev.strip() and not re.match(r"\s*([-*+]|\d+\.)\s", prev):
            out.append("")
        out.append(line)
    return "\n".join(out)


def render_tasks(body_html):
    # Turn "[ ] item" / "[x] item" list entries into checkboxes.
    body_html = re.sub(r"<li>\[ \]\s*", '<li><input type="checkbox" disabled> ', body_html)
    body_html = re.sub(r"<li>\[[xX]\]\s*", '<li><input type="checkbox" checked disabled> ', body_html)
    return re.sub(r"<ul>(\s*<li><input)", r'<ul class="task-list">\1', body_html)


def page(title, nav_html, body_html):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)} · Rosecat Vintage Docs</title>
<style>{CSS}</style>
</head>
<body>
<div class="layout">
<nav>{nav_html}</nav>
<main>{body_html}</main>
</div>
</body>
</html>
"""


def build():
    OUT_DIR.mkdir(exist_ok=True)
    # Remove pages left over from renamed or deleted modules.
    for old in OUT_DIR.glob("Module*.html"):
        old.unlink()
    modules = []
    for path in module_files():
        text = path.read_text(encoding="utf-8")
        modules.append((path, text, title_of(text, path.stem)))

    def nav(active=None):
        links = ['<a class="brand" href="index.html">Rosecat Vintage Docs</a>']
        for path, _, title in modules:
            cls = "item active" if path.stem == active else "item"
            links.append(f'<a class="{cls}" href="{path.stem}.html">{html.escape(title)}</a>')
        return "\n".join(links)

    for path, text, title in modules:
        # Point cross-links at the generated HTML instead of the .md source.
        text = re.sub(r"\((Module[\w-]+)\.md\)", r"(\1.html)", text)
        body = markdown.markdown(fix_list_spacing(text), extensions=["tables", "fenced_code"])
        (OUT_DIR / f"{path.stem}.html").write_text(
            page(title, nav(path.stem), render_tasks(body)), encoding="utf-8")

    cards = []
    for path, _, title in modules:
        num, _, name = title.partition("—")
        cards.append(f'<a class="card" href="{path.stem}.html"><div class="num">'
                     f'{html.escape(num.strip())}</div><div class="title">'
                     f'{html.escape(name.strip() or title)}</div></a>')
    index_body = ("<h1>Rosecat Vintage — Project Documentation</h1>"
                  "<p>Step-by-step web development modules for the Rosecat Vintage website.</p>"
                  f'<div class="cards">{"".join(cards)}</div>')
    (OUT_DIR / "index.html").write_text(page("Home", nav(), index_body), encoding="utf-8")
    print(f"Built {len(modules)} module pages + index.html in {OUT_DIR}")


if __name__ == "__main__":
    build()
