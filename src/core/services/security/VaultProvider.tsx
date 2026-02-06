import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { unlockOrThrow } from "./appLock.expo";
import { bootstrapVault } from "./bootstrapVault";
import { log } from "../../../shared/utils/log";

import type * as SQLite from "expo-sqlite";

const LOCK_AFTER_MINUTES = 5;

type VaultContextValue = {
  db: SQLite.SQLiteDatabase | null;
  locked: boolean;
  error: Error | null;
  unlock: () => Promise<boolean>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastBackgroundAt = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const database = await bootstrapVault();
        if (!mounted) return;
        setDb(database);
      } catch (err) {
        if (!mounted) return;
        const errorInstance =
          err instanceof Error ? err : new Error("Vault bootstrap failed.");
        setError(errorInstance);
        log.error("Vault bootstrap failed", errorInstance);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appState.current;
      appState.current = nextState;

      if (previousState === "active" && nextState !== "active") {
        lastBackgroundAt.current = Date.now();
        return;
      }

      if (previousState !== "active" && nextState === "active") {
        if (lastBackgroundAt.current === null) return;
        const elapsedMinutes = (Date.now() - lastBackgroundAt.current) / 60000;
        if (elapsedMinutes >= LOCK_AFTER_MINUTES) {
          setLocked(true);
          log.info("Vault locked after background.", { elapsedMinutes });
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const unlock = useCallback(async () => {
    try {
      await unlockOrThrow();
      setLocked(false);
      return true;
    } catch (err) {
      const errorInstance =
        err instanceof Error ? err : new Error("Unlock failed.");
      log.warn("Unlock attempt failed", errorInstance);
      return false;
    }
  }, []);

  return (
    <VaultContext.Provider value={{ db, locked, error, unlock }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context)
    throw new Error("useVault must be used within a VaultProvider.");
  return context;
}
