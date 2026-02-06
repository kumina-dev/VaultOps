import type * as SQLite from "expo-sqlite";

export const META_KEYS = {
  lastMigratedAt: "db.last_migrated_at",
  linksLastRebuildAt: "links.last_rebuild_at",
  remindersLastReconcileAt: "reminders.last_reconcile_at",
  inboxStrictCriteria: "inbox.strict_criteria",
} as const;

const CORE_TABLES = [
  "areas",
  "tags",
  "items",
  "item_tags",
  "reminders",
  "note_links",
  "action_events",
  "meta",
];

export type DbTableCheck = {
  table: string;
  exists: boolean;
};

export type DbHealthSnapshot = {
  userVersion: number;
  tables: DbTableCheck[];
  meta: {
    lastMigratedAt: string | null;
    linksLastRebuildAt: string | null;
    remindersLastReconcileAt: string | null;
  };
};

export async function readUserVersion(
  db: SQLite.SQLiteDatabase,
): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  return row?.user_version ?? 0;
}

async function readMetaValue(
  db: SQLite.SQLiteDatabase,
  key: string,
): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM meta WHERE key = ?",
    [key],
  );
  return row?.value ?? null;
}

export async function ensureMetaKeys(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const key of Object.values(META_KEYS)) {
      await db.runAsync(
        "INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)",
        [key, ""],
      );
    }
  });
}

export async function writeLastMigratedAt(
  db: SQLite.SQLiteDatabase,
  migratedAt: string = new Date().toISOString(),
): Promise<void> {
  await ensureMetaKeys(db);
  await db.runAsync("UPDATE meta SET value = ? WHERE key = ?", [
    migratedAt,
    META_KEYS.lastMigratedAt,
  ]);
}

export async function checkTableExists(
  db: SQLite.SQLiteDatabase,
  table: string,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [table],
  );
  return Boolean(row?.name);
}

export async function getDbHealthSnapshot(
  db: SQLite.SQLiteDatabase,
): Promise<DbHealthSnapshot> {
  const [
    userVersion,
    lastMigratedAt,
    linksLastRebuildAt,
    remindersLastReconcileAt,
  ] = await Promise.all([
    readUserVersion(db),
    readMetaValue(db, META_KEYS.lastMigratedAt),
    readMetaValue(db, META_KEYS.linksLastRebuildAt),
    readMetaValue(db, META_KEYS.remindersLastReconcileAt),
  ]);

  const tables = await Promise.all(
    CORE_TABLES.map(async (table) => ({
      table,
      exists: await checkTableExists(db, table),
    })),
  );

  return {
    userVersion,
    tables,
    meta: {
      lastMigratedAt,
      linksLastRebuildAt,
      remindersLastReconcileAt,
    },
  };
}
