// src/db/local.ts
import type { DocStore, PaycheckDoc } from './storage';

const NS = 'paycheck_sheets:'; // namespace prefix

export class LocalStore<T extends { _id: string; _rev?: string }>
  implements DocStore<T>
{
  async get(id: string): Promise<T> {
    const raw = localStorage.getItem(NS + id);
    if (!raw) throw Object.assign(new Error('not found'), { status: 404 });
    return JSON.parse(raw);
  }

  async put(doc: T) {
    const rev = new Date().toISOString(); // simple rev; replace with hash if you want
    const toSave = { ...doc, _rev: rev };
    localStorage.setItem(NS + doc._id, JSON.stringify(toSave));
    return { ok: true as const, id: doc._id, rev };
  }

  async remove(id: string) {
    localStorage.removeItem(NS + id);
  }

  async list(prefix = '') {
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (!key.startsWith(NS)) continue;
      const id = key.slice(NS.length);
      if (id.startsWith(prefix)) ids.push(id);
    }
    return ids.sort();
  }
}

export const sheetStore: DocStore<PaycheckDoc> = new LocalStore<PaycheckDoc>();
