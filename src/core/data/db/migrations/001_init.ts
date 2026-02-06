import { DEFAULT_AREAS } from "../schema";

import type { Migration } from "./types";
import type * as SQLite from "expo-sqlite";

async function seedAreas(db: SQLite.SQLiteDatabase) {
  for (const area of DEFAULT_AREAS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO areas (id, name, sort_order) VALUES (?, ?, ?)`,
      [area.id, area.name, area.sortOrder],
    );
  }
}

export const migration001Init: Migration = {
  version: 1,
  name: "init core tables",
  up: async (db) => {
    // Core tables
    await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS areas (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      );

      -- Unified items table: note/task/event. Irrelevant columns are NULL.
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('note','task','event')),
        title TEXT NOT NULL,
        body TEXT NULL,
        area_id TEXT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT NULL,

        -- Note fields
        note_pinned INTEGER NULL CHECK (note_pinned IN (0,1)),
        note_favorite INTEGER NULL CHECK (note_favorite IN (0,1)),

        -- Task fields
        task_status TEXT NULL CHECK (task_status IN ('todo','doing','done','blocked')),
        task_priority TEXT NULL CHECK (task_priority IN ('low','med','high')),
        task_scheduled_at TEXT NULL,
        task_due_at TEXT NULL,
        task_completed_at TEXT NULL,
        task_estimate_min INTEGER NULL,
        task_actual_min INTEGER NULL,

        -- Event fields
        event_start_at TEXT NULL,
        event_end_at TEXT NULL,
        event_all_day INTEGER NULL CHECK (event_all_day IN (0,1)),
        event_location TEXT NULL,

        FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS item_tags (
        item_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        PRIMARY KEY (item_id, tag_id),
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- Standalone reminders; may link to an item.
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        fire_at TEXT NOT NULL,
        repeat_rule TEXT NULL,
        item_id TEXT NULL,
        status TEXT NOT NULL CHECK (status IN ('scheduled','fired','snoozed','cancelled')),
        snooze_until TEXT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
      );

      -- Derived link index for note backlinks. Rebuildable.
      CREATE TABLE IF NOT EXISTS note_links (
        from_note_id TEXT NOT NULL,
        to_note_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        raw_text TEXT NULL,
        PRIMARY KEY (from_note_id, to_note_id),
        FOREIGN KEY (from_note_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (to_note_id) REFERENCES items(id) ON DELETE CASCADE
      );

      -- Action events for gamification (append-only).
      CREATE TABLE IF NOT EXISTS action_events (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        item_id TEXT NULL,
        occurred_at TEXT NOT NULL,
        payload_json TEXT NULL,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
      );

      -- Simple KV store for settings / flags / last rebuild timestamps.
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      -- Indexes (performance)
      CREATE INDEX IF NOT EXISTS idx_items_type_archived ON items(type, archived_at);
      CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_due ON items(task_due_at) WHERE type='task' AND archived_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON items(task_scheduled_at) WHERE type='task' AND archived_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_events_start ON items(event_start_at) WHERE type='event' AND archived_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_reminders_fire ON reminders(fire_at, status);
      CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON item_tags(tag_id);
      CREATE INDEX IF NOT EXISTS idx_note_links_to ON note_links(to_note_id);
    `);

    await seedAreas(db);
  },
};
