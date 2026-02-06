import * as SQLite from "expo-sqlite";

import { getOrCreateDbKey } from "../../services/security/keyManager.expo";

/**
 * IMPORTANT: SQLCipher isn't supported in Expo Go.
 * You must use a dev build (prebuild/EAS) with useSQLCipher enabled.
 */
export async function openVaultDb() {
  const db = await SQLite.openDatabaseAsync("vaultops.db");

  // Load key from SecureStore (after app lock gate in your bootstrap)
  const keyHex = await getOrCreateDbKey();

  // Set cipher key immediately after opening the db. :contentReference[oaicite:8]{index=8}
  // Quote escaping: hex is safe, but we still use single quotes as required.
  await db.execAsync(`PRAGMA key = '${keyHex}'`);

  // Defensive pragmas for reliability (reasonable defaults)
  await db.execAsync(`PRAGMA foreign_keys = ON`);
  await db.execAsync(`PRAGMA journal_mode = WAL`);
  await db.execAsync(`PRAGMA synchronous = NORMAL`);

  return db;
}
