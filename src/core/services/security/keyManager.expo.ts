import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY_NAME = "vaultops.db.key.v1";

/**
 * Generates a random 32-byte key and stores it as hex.
 * Hex is small (64 chars) and safe for SecureStore value size constraints.
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getOrCreateDbKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing && existing.length >= 64) return existing;

  const bytes = await Crypto.getRandomBytesAsync(32);
  const hexKey = bytesToHex(bytes);

  await SecureStore.setItemAsync(KEY_NAME, hexKey);
  return hexKey;
}

export async function deleteDbKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_NAME);
}
