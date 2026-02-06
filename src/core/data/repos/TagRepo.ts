import type { UUID } from "../../domain/item";
import type { DbClient } from "../db/DbClient";

type TagRow = {
  id: string;
  name: string;
  created_at: string;
};

const createId = (): UUID => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `tag_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export type Tag = {
  id: UUID;
  name: string;
  createdAt: string;
};

export class TagRepo {
  constructor(private readonly client: DbClient) {}

  async getOrCreateTag(name: string): Promise<Tag> {
    const normalized = name.trim();
    const existing = await this.client.getFirst<TagRow>(
      "SELECT * FROM tags WHERE name = ?",
      [normalized],
      "tag.getOrCreate.fetch",
    );
    if (existing) {
      return {
        id: existing.id,
        name: existing.name,
        createdAt: existing.created_at,
      };
    }

    const now = new Date().toISOString();
    const id = createId();
    await this.client.run(
      "INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)",
      [id, normalized, now],
      "tag.getOrCreate.insert",
    );
    return { id, name: normalized, createdAt: now };
  }

  async setItemTags(itemId: UUID, tagNames: string[]): Promise<void> {
    await this.client.transaction(async (tx) => {
      await tx.run(
        "DELETE FROM item_tags WHERE item_id = ?",
        [itemId],
        "tag.setItemTags.clear",
      );

      for (const name of tagNames) {
        const tag = await new TagRepo(tx).getOrCreateTag(name);
        await tx.run(
          "INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)",
          [itemId, tag.id],
          "tag.setItemTags.insert",
        );
      }
    }, "tag.setItemTags");
  }

  async listTags(): Promise<Tag[]> {
    const rows = await this.client.getAll<TagRow>(
      "SELECT * FROM tags ORDER BY name ASC",
      [],
      "tag.list",
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));
  }
}
