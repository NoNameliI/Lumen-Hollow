import type { HintDef } from '../types';
import { t, tk } from '../i18n';
import { h } from './dom';
import { button } from './widgets';
import type { Session } from './session';

type Trigger = NonNullable<HintDef['trigger']>;

/** Queues the level's tutorial cards and shows them one at a time without pausing play. */
export class Hints {
  private queue: string[] = [];
  private seen = new Set<string>();
  private fired = new Set<string>();
  private card: HTMLElement | null = null;
  private text: HTMLElement | null = null;
  private current = '';

  constructor(private s: Session) {}

  start(): void {
    this.trigger('start');
    this.wave(0);
  }

  trigger(kind: Trigger): void {
    if (this.fired.has(`t:${kind}`)) return;
    this.fired.add(`t:${kind}`);
    for (const hint of this.hints()) if (hint.trigger === kind) this.enqueue(hint.key);
  }

  wave(n: number): void {
    for (const hint of this.hints()) {
      if (hint.wave === n && !hint.trigger) this.enqueue(hint.key);
    }
  }

  refresh(): void {
    if (this.text && this.current) this.text.textContent = tk(`hint.${this.current}`);
  }

  dispose(): void {
    this.card?.remove();
    this.card = null;
    this.queue = [];
  }

  private hints(): HintDef[] {
    return this.s.config.level.hints ?? [];
  }

  private enqueue(key: string): void {
    if (this.seen.has(key)) return;
    this.seen.add(key);
    const id = this.s.config.level.id;
    if (id > 3 && this.s.app.save.seenHints.includes(key)) return;
    this.queue.push(key);
    this.next();
  }

  private next(): void {
    if (this.card || this.queue.length === 0) return;
    const key = this.queue.shift() as string;
    this.current = key;
    this.text = h('p', null, tk(`hint.${key}`));
    this.card = h(
      'div',
      { class: 'hint enter', role: 'status' },
      h('span', { class: 'hint-mark', 'aria-hidden': 'true' }, 'i'),
      this.text,
      button('btn mini', t('ui.ok'), () => this.dismiss()),
    );
    this.s.app.toastLayer.append(this.card);
  }

  private dismiss(): void {
    const { save } = this.s.app;
    if (!save.seenHints.includes(this.current)) {
      save.seenHints.push(this.current);
      this.s.app.persist();
    }
    this.card?.remove();
    this.card = null;
    this.current = '';
    this.next();
  }
}
