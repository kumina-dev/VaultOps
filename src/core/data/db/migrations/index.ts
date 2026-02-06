import { migration001Init } from "./001_init";

import type { Migration } from "./types";

export const MIGRATIONS: Migration[] = [migration001Init].sort(
  (a, b) => a.version - b.version,
);
