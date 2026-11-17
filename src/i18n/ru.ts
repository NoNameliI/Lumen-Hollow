import type { en } from './en';
import { ruHints } from './ruHints';
import { ruUi } from './ruUi';
import { ruWorld } from './ruWorld';

export const ru: Record<keyof typeof en, string> = { ...ruUi, ...ruWorld, ...ruHints };
