// src/db/storage.ts
export type PaycheckDoc = {
  _id: string;
  name?: string;
  date: string;
  income: number;
  // legacy single-list support (kept for backward compatibility)
  allocations?: { category: string; amount: number }[];
  // new split lists
  savings?: { category: string; amount: number }[];
  expenses?: { category: string; amount: number }[];
  leftover: number;
  _rev?: string;
};

export interface DocStore<T extends { _id: string; _rev?: string }> {
  get(id: string): Promise<T>;
  put(doc: T): Promise<{ ok: true; id: string; rev: string }>;
  remove(id: string): Promise<void>;
  list(prefix?: string): Promise<string[]>; // returns _ids
}
