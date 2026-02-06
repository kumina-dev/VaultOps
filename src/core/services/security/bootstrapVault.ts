import { unlockOrThrow } from "./appLock.expo";
import { initVaultDb } from "../../data/db/initVaultDb";
import { openVaultDb } from "../../data/db/openVaultDb";

import type * as SQLite from "expo-sqlite";

export async function bootstrapVault(): Promise<SQLite.SQLiteDatabase> {
  await unlockOrThrow();

  const db = await openVaultDb();
  await initVaultDb(db);

  return db;
}
