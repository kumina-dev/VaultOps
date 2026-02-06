import { readUserVersion, writeLastMigratedAt } from "./dbHealthRepo";
import { MIGRATIONS } from "./migrations";
import { SCHEMA_VERSION } from "./schema";

import type * as SQLite from "expo-sqlite";

async function setUserVersion(
  db: SQLite.SQLiteDatabase,
  version: number,
): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

/**
 * Runs pending migrations inside transactions.
 * Uses PRAGMA user_version for tracking.
 */
export async function migrateIfNeeded(
  db: SQLite.SQLiteDatabase,
): Promise<void> {
  await db.execAsync("PRAGMA foreign_keys = ON");

  const current = await readUserVersion(db);
  if (current > SCHEMA_VERSION) {
    throw new Error(
      `DB user_version (${current}) is newer than app schema (${SCHEMA_VERSION}). Refusing to run.`,
    );
  }
  if (current === SCHEMA_VERSION) return;

  const pending = MIGRATIONS.filter(
    (m) => m.version > current && m.version <= SCHEMA_VERSION,
  );
  if (pending.length === 0) {
    // Ensure user_version is at least SCHEMA_VERSION if migrations list changed
    await setUserVersion(db, SCHEMA_VERSION);
    return;
  }

  for (const m of pending) {
    await db.withTransactionAsync(async () => {
      await m.up(db);
      await setUserVersion(db, m.version);
    });
  }

  // Defensive: ensure it ends at SCHEMA_VERSION
  if (pending[pending.length - 1].version !== SCHEMA_VERSION) {
    await setUserVersion(db, SCHEMA_VERSION);
  }

  await writeLastMigratedAt(db);
}
