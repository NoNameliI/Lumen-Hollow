import { enHints } from './enHints';
import { enUi } from './enUi';
import { enWorld } from './enWorld';

export const en = { ...enUi, ...enWorld, ...enHints } as const;
