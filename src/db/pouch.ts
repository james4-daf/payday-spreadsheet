// src/db/pouch.ts
import PouchDB from 'pouchdb';
import PouchDBIdb from 'pouchdb-adapter-idb';

PouchDB.plugin(PouchDBIdb);

export const db = new PouchDB('paycheck_sheets', { adapter: 'idb' });
