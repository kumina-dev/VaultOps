export interface KeyManager {
  getOrCreateDbKey(): Promise<string>;
  deleteDbKey(): Promise<void>;
}
