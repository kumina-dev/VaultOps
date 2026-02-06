import type { UUID } from "../../domain/item";
import type { DbClient } from "../db/DbClient";

type AreaRow = {
  id: string;
  name: string;
  sort_order: number;
};

export type Area = {
  id: UUID;
  name: string;
  sortOrder: number;
};

export class AreaRepo {
  constructor(private readonly client: DbClient) {}

  async listAreas(): Promise<Area[]> {
    const rows = await this.client.getAll<AreaRow>(
      "SELECT * FROM areas ORDER BY sort_order ASC",
      [],
      "area.list",
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
    }));
  }

  async setItemArea(itemId: UUID, areaId: UUID | null): Promise<void> {
    const updatedAt = new Date().toISOString();
    await this.client.run(
      "UPDATE items SET area_id = ?, updated_at = ? WHERE id = ?",
      [areaId, updatedAt, itemId],
      "area.setItemArea",
    );
  }
}
