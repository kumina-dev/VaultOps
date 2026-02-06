import type { UUID } from "../../domain/item";
import type { Reminder, ReminderStatus } from "../../domain/reminder";
import type { DbClient } from "../db/DbClient";

type ReminderRow = {
  id: string;
  title: string;
  fire_at: string;
  repeat_rule: string | null;
  item_id: string | null;
  status: ReminderStatus;
  snooze_until: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateReminderInput = {
  id: UUID;
  title: string;
  fireAt: string;
  repeatRule?: string | null;
  itemId?: UUID | null;
  status?: ReminderStatus;
  snoozeUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateReminderPatch = Omit<
  CreateReminderInput,
  "id" | "createdAt"
> & { updatedAt?: string };

function mapRowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    fireAt: row.fire_at,
    repeatRule: row.repeat_rule,
    itemId: row.item_id,
    status: row.status,
    snoozeUntil: row.snooze_until,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ReminderRepo {
  constructor(private readonly client: DbClient) {}

  async createReminder(data: CreateReminderInput): Promise<void> {
    const createdAt = data.createdAt ?? new Date().toISOString();
    const updatedAt = data.updatedAt ?? createdAt;
    await this.client.run(
      `
        INSERT INTO reminders (
          id,
          title,
          fire_at,
          repeat_rule,
          item_id,
          status,
          snooze_until,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.id,
        data.title,
        data.fireAt,
        data.repeatRule ?? null,
        data.itemId ?? null,
        data.status ?? "scheduled",
        data.snoozeUntil ?? null,
        createdAt,
        updatedAt,
      ],
      "reminder.create",
    );
  }

  async updateReminder(id: UUID, patch: UpdateReminderPatch): Promise<void> {
    const updates: string[] = [];
    const params: Array<string | null> = [];

    const addField = (column: string, value: string | null) => {
      updates.push(`${column} = ?`);
      params.push(value);
    };

    if (patch.title !== undefined) addField("title", patch.title);
    if (patch.fireAt !== undefined) addField("fire_at", patch.fireAt);
    if (patch.repeatRule !== undefined)
      addField("repeat_rule", patch.repeatRule ?? null);
    if (patch.itemId !== undefined) addField("item_id", patch.itemId ?? null);
    if (patch.status !== undefined) addField("status", patch.status);
    if (patch.snoozeUntil !== undefined)
      addField("snooze_until", patch.snoozeUntil ?? null);

    const updatedAt = patch.updatedAt ?? new Date().toISOString();
    addField("updated_at", updatedAt);

    if (updates.length === 0) {
      return;
    }

    const sql = `UPDATE reminders SET ${updates.join(", ")} WHERE id = ?`;
    await this.client.run(sql, [...params, id], "reminder.update");
  }

  async cancelReminder(id: UUID): Promise<void> {
    await this.updateReminder(id, { status: "cancelled", snoozeUntil: null });
  }

  async snoozeReminder(id: UUID, until: string): Promise<void> {
    await this.updateReminder(id, { status: "snoozed", snoozeUntil: until });
  }

  async listUpcoming(limit: number): Promise<Reminder[]> {
    const safeLimit = Math.max(0, limit);
    const rows = await this.client.getAll<ReminderRow>(
      `
        SELECT * FROM reminders
        WHERE status IN ('scheduled', 'snoozed')
        ORDER BY COALESCE(snooze_until, fire_at) ASC
        LIMIT ?
      `,
      [safeLimit],
      "reminder.listUpcoming",
    );
    return rows.map(mapRowToReminder);
  }

  async listForItem(itemId: UUID): Promise<Reminder[]> {
    const rows = await this.client.getAll<ReminderRow>(
      `
        SELECT * FROM reminders
        WHERE item_id = ?
        ORDER BY fire_at ASC
      `,
      [itemId],
      "reminder.listForItem",
    );
    return rows.map(mapRowToReminder);
  }

  async getReminder(id: UUID): Promise<Reminder | null> {
    const row = await this.client.getFirst<ReminderRow>(
      "SELECT * FROM reminders WHERE id = ?",
      [id],
      "reminder.get",
    );
    return row ? mapRowToReminder(row) : null;
  }
}
