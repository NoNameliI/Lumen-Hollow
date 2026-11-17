export type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown>;

/** Tiny element factory: `on*` props become listeners, everything else an attribute. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...kids: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, kids);
  return el;
}

export function append(el: Element, kids: Child[]): void {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    el.append(typeof k === 'number' ? String(k) : k);
  }
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function setText(el: Element, text: string): void {
  if (el.textContent !== text) el.textContent = text;
}

export function span(cls: string, ...kids: Child[]): HTMLSpanElement {
  return h('span', { class: cls }, ...kids);
}

/** Inline SVG from a trusted constant string. */
export function svg(markup: string, cls = 'ico', size = 20): HTMLSpanElement {
  const el = h('span', { class: cls, 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" focusable="false">${markup}</svg>`;
  return el;
}
