export const DB_NAME = "vaultops.db";

/**
 * Schema version tracked via PRAGMA user_version.
 * Bump this only when you add a new migration file.
 */
export const SCHEMA_VERSION = 1;

// Default Areas (seeded)
export const DEFAULT_AREAS: Array<{
  id: string;
  name: string;
  sortOrder: number;
}> = [
  { id: "home", name: "Home", sortOrder: 10 },
  { id: "health", name: "Health", sortOrder: 20 },
  { id: "admin", name: "Admin", sortOrder: 30 },
  { id: "learning", name: "Learning", sortOrder: 40 },
  { id: "social", name: "Social", sortOrder: 50 },
  { id: "service", name: "Service", sortOrder: 60 },
];
