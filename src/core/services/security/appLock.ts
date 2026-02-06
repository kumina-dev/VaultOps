export type AppLockState = "locked" | "unlocked";

export interface AppLock {
  isAvailable(): Promise<boolean>;
  unlock(): Promise<boolean>;
}
