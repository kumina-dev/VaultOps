import { ensureMetaKeys } from "./dbHealthRepo";
import { migrateIfNeeded } from "./migrate";

import type * as SQLite from "expo-sqlite";

export async function initVaultDb(db: SQLite.SQLiteDatabase): Promise<void> {
  await migrateIfNeeded(db);
  await ensureMetaKeys(db);
}
