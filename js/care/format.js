const HEADING = /^(\*\*[^*]+\*\*|[A-Z][^:]{1,54}:)\s*/;

function appendInline(parent, value) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g);
  for (const part of parts) {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      parent.append(strong);
    } else if (part) parent.append(document.createTextNode(part));
  }
}

/** Render provider text as safe, semantic paragraphs and lists. Never parse HTML. */
export function formatAIResponse(container, value) {
  const lines = String(value ?? '').replace(/\r/g, '').split('\n');
  const output = [];
  let list = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { list = null; continue; }
    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (item) {
      if (!list) { list = document.createElement('ul'); output.push(list); }
      const li = document.createElement('li');
      appendInline(li, item[1]);
      list.append(li);
      continue;
    }
    list = null;
    const p = document.createElement('p');
    const heading = line.match(HEADING);
    if (heading) {
      const label = document.createElement('strong');
      label.textContent = heading[1].replace(/^\*\*|\*\*$/g, '').replace(/:$/, '');
      p.append(label);
      const rest = line.slice(heading[0].length);
      if (rest) { p.append(document.createTextNode(': ')); appendInline(p, rest); }
    } else appendInline(p, line);
    output.push(p);
  }
  container.replaceChildren(...output);
  container.classList.add('formatted-response');
}
