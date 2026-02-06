import type * as SQLite from "expo-sqlite";

type DbParams = SQLite.SQLStatementArg[] | SQLite.SQLStatementArg | undefined;

function normalizeParams(params: DbParams): SQLite.SQLStatementArg[] {
  if (params === undefined) return [];
  return Array.isArray(params) ? params : [params];
}

function toTaggedError(error: unknown, tag: string, sql?: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  const sqlSnippet = sql ? ` | ${sql}` : "";
  const tagged = new Error(`[db:${tag}] ${message}${sqlSnippet}`);
  (tagged as Error & { cause?: unknown }).cause = error;
  return tagged;
}

export class DbClient {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async run(
    sql: string,
    params?: DbParams,
    tag: string = "run",
  ): Promise<SQLite.SQLiteRunResult> {
    try {
      return await this.db.runAsync(sql, normalizeParams(params));
    } catch (error) {
      throw toTaggedError(error, tag, sql);
    }
  }

  async getFirst<T>(
    sql: string,
    params?: DbParams,
    tag: string = "getFirst",
  ): Promise<T | null> {
    try {
      const row = await this.db.getFirstAsync<T>(sql, normalizeParams(params));
      return row ?? null;
    } catch (error) {
      throw toTaggedError(error, tag, sql);
    }
  }

  async getAll<T>(
    sql: string,
    params?: DbParams,
    tag: string = "getAll",
  ): Promise<T[]> {
    try {
      return await this.db.getAllAsync<T>(sql, normalizeParams(params));
    } catch (error) {
      throw toTaggedError(error, tag, sql);
    }
  }

  async transaction<T>(
    handler: (client: DbClient) => Promise<T>,
    tag: string = "transaction",
  ): Promise<T> {
    try {
      let result: T | undefined;
      await this.db.withTransactionAsync(async () => {
        result = await handler(this);
      });
      return result as T;
    } catch (error) {
      throw toTaggedError(error, tag);
    }
  }
}

export function createDbClient(db: SQLite.SQLiteDatabase): DbClient {
  return new DbClient(db);
}
