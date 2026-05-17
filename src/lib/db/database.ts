import Dexie, { type Table } from 'dexie';
import type { Word, Attempt, Session, SpacedRepetitionEntry, AppSettings } from '$lib/types';

export class HablaAnomiaDB extends Dexie {
  words!: Table<Word, string>;
  attempts!: Table<Attempt, number>;
  sessions!: Table<Session, number>;
  spacedRepetition!: Table<SpacedRepetitionEntry, number>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('habla-anomia');
    this.version(1).stores({
      words: 'id, word, category, language, difficulty',
      attempts: '++id, word_id, exercise_type, correct, timestamp, language',
      sessions: '++id, started_at, language',
      spacedRepetition: '++id, word_id, next_review, language',
      settings: 'key'
    });

    // v2: add compound index for efficient SR lookups
    this.version(2).stores({
      spacedRepetition: '++id, word_id, next_review, language, [word_id+language]'
    });
  }
}

export const db = new HablaAnomiaDB();
