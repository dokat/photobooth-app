import Dexie, { type EntityTable } from 'dexie';

export interface Visiteur {
  id?: number;
  email: string;
  photo?: Blob;
}

export const db = new Dexie('PhotoboothDB') as Dexie & {
  visiteurs: EntityTable<Visiteur, 'id'>;
};

db.version(1).stores({
  visiteurs: '++id, email'
});
