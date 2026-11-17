import type { LangId } from '../types';
import { en } from './en';
import { ru } from './ru';

export type Key = keyof typeof en;
export type Params = Record<string, string | number>;

const dicts: Record<LangId, Record<Key, string>> = { en, ru };
let lang: LangId = 'en';
const listeners = new Set<() => void>();

function format(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m));
}

/** Typed lookup for static keys. */
export function t(key: Key, params?: Params): string {
  return format(dicts[lang][key] ?? dicts.en[key] ?? key, params);
}

/** Lookup for keys assembled from data ids; falls back to the key itself. */
export function tk(key: string, params?: Params): string {
  const d = dicts[lang] as Record<string, string>;
  const e = dicts.en as Record<string, string>;
  return format(d[key] ?? e[key] ?? key, params);
}

export function hasKey(key: string): boolean {
  return key in dicts.en;
}

export function getLang(): LangId {
  return lang;
}

export function setLang(next: LangId): void {
  if (next === lang) return;
  lang = next;
  document.documentElement.lang = next;
  for (const cb of [...listeners]) cb();
}

export function onLangChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
