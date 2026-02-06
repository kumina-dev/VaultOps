import type {
  BaseItem,
  EventItem,
  Item,
  ItemType,
  NoteItem,
  TaskItem,
  TaskPriority,
  TaskStatus,
  UUID,
} from "../../domain/item";
import type { DbClient } from "../db/DbClient";

type ItemRow = {
  id: string;
  type: ItemType;
  title: string;
  body: string | null;
  area_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  note_pinned: number | null;
  note_favorite: number | null;
  task_status: TaskStatus | null;
  task_priority: TaskPriority | null;
  task_scheduled_at: string | null;
  task_due_at: string | null;
  task_completed_at: string | null;
  task_estimate_min: number | null;
  task_actual_min: number | null;
  event_start_at: string | null;
  event_end_at: string | null;
  event_all_day: number | null;
  event_location: string | null;
};

export type CreateItemInput = {
  id: UUID;
  type: ItemType;
  title: string;
  body?: string | null;
  areaId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string | null;
  notePinned?: boolean | null;
  noteFavorite?: boolean | null;
  taskStatus?: TaskStatus | null;
  taskPriority?: TaskPriority | null;
  taskScheduledAt?: string | null;
  taskDueAt?: string | null;
  taskCompletedAt?: string | null;
  taskEstimateMin?: number | null;
  taskActualMin?: number | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  eventAllDay?: boolean | null;
  eventLocation?: string | null;
};

export type UpdateItemPatch = Omit<
  CreateItemInput,
  "id" | "type" | "createdAt"
> & { updatedAt?: string };

function toDbBoolean(value?: boolean | null): number | null {
  if (value === undefined) {
    return null;
  }
  if (value === null) {
    return null;
  }
  return value ? 1 : 0;
}

function fromDbBoolean(value: number | null): boolean {
  return value === 1;
}

function mapRowToItem(row: ItemRow): Item {
  const base: BaseItem = {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    areaId: row.area_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };

  switch (row.type) {
    case "note":
      return {
        ...base,
        type: "note",
        pinned: fromDbBoolean(row.note_pinned),
        favorite: fromDbBoolean(row.note_favorite),
      } satisfies NoteItem;
    case "task":
      return {
        ...base,
        type: "task",
        status: row.task_status ?? "todo",
        priority: row.task_priority ?? "med",
        scheduledAt: row.task_scheduled_at,
        dueAt: row.task_due_at,
        completedAt: row.task_completed_at,
        estimateMin: row.task_estimate_min,
        actualMin: row.task_actual_min,
      } satisfies TaskItem;
    case "event":
      return {
        ...base,
        type: "event",
        startAt: row.event_start_at ?? row.created_at,
        endAt: row.event_end_at ?? row.created_at,
        allDay: fromDbBoolean(row.event_all_day),
        location: row.event_location,
      } satisfies EventItem;
  }
}

export class ItemRepo {
  constructor(private readonly client: DbClient) {}

  async createItem(data: CreateItemInput): Promise<void> {
    const createdAt = data.createdAt ?? new Date().toISOString();
    const updatedAt = data.updatedAt ?? createdAt;
    const archivedAt = data.archivedAt ?? null;

    const sql = `
      INSERT INTO items (
        id,
        type,
        title,
        body,
        area_id,
        created_at,
        updated_at,
        archived_at,
        note_pinned,
        note_favorite,
        task_status,
        task_priority,
        task_scheduled_at,
        task_due_at,
        task_completed_at,
        task_estimate_min,
        task_actual_min,
        event_start_at,
        event_end_at,
        event_all_day,
        event_location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.client.run(
      sql,
      [
        data.id,
        data.type,
        data.title,
        data.body ?? null,
        data.areaId ?? null,
        createdAt,
        updatedAt,
        archivedAt,
        toDbBoolean(data.notePinned),
        toDbBoolean(data.noteFavorite),
        data.taskStatus ?? null,
        data.taskPriority ?? null,
        data.taskScheduledAt ?? null,
        data.taskDueAt ?? null,
        data.taskCompletedAt ?? null,
        data.taskEstimateMin ?? null,
        data.taskActualMin ?? null,
        data.eventStartAt ?? null,
        data.eventEndAt ?? null,
        toDbBoolean(data.eventAllDay),
        data.eventLocation ?? null,
      ],
      "item.create",
    );
  }

  async updateItem(id: UUID, patch: UpdateItemPatch): Promise<void> {
    const updates: string[] = [];
    const params: Array<string | number | null> = [];

    const addField = (column: string, value: string | number | null) => {
      updates.push(`${column} = ?`);
      params.push(value);
    };

    if (patch.title !== undefined) addField("title", patch.title);
    if (patch.body !== undefined) addField("body", patch.body ?? null);
    if (patch.areaId !== undefined) addField("area_id", patch.areaId ?? null);
    if (patch.archivedAt !== undefined)
      addField("archived_at", patch.archivedAt ?? null);
    if (patch.notePinned !== undefined)
      addField("note_pinned", toDbBoolean(patch.notePinned));
    if (patch.noteFavorite !== undefined)
      addField("note_favorite", toDbBoolean(patch.noteFavorite));
    if (patch.taskStatus !== undefined)
      addField("task_status", patch.taskStatus ?? null);
    if (patch.taskPriority !== undefined)
      addField("task_priority", patch.taskPriority ?? null);
    if (patch.taskScheduledAt !== undefined)
      addField("task_scheduled_at", patch.taskScheduledAt ?? null);
    if (patch.taskDueAt !== undefined)
      addField("task_due_at", patch.taskDueAt ?? null);
    if (patch.taskCompletedAt !== undefined)
      addField("task_completed_at", patch.taskCompletedAt ?? null);
    if (patch.taskEstimateMin !== undefined)
      addField("task_estimate_min", patch.taskEstimateMin ?? null);
    if (patch.taskActualMin !== undefined)
      addField("task_actual_min", patch.taskActualMin ?? null);
    if (patch.eventStartAt !== undefined)
      addField("event_start_at", patch.eventStartAt ?? null);
    if (patch.eventEndAt !== undefined)
      addField("event_end_at", patch.eventEndAt ?? null);
    if (patch.eventAllDay !== undefined)
      addField("event_all_day", toDbBoolean(patch.eventAllDay));
    if (patch.eventLocation !== undefined)
      addField("event_location", patch.eventLocation ?? null);

    const updatedAt = patch.updatedAt ?? new Date().toISOString();
    addField("updated_at", updatedAt);

    if (updates.length === 0) {
      return;
    }

    const sql = `UPDATE items SET ${updates.join(", ")} WHERE id = ?`;
    await this.client.run(sql, [...params, id], "item.update");
  }

  async archiveItem(id: UUID): Promise<void> {
    const archivedAt = new Date().toISOString();
    await this.client.run(
      "UPDATE items SET archived_at = ?, updated_at = ? WHERE id = ?",
      [archivedAt, archivedAt, id],
      "item.archive",
    );
  }

  async getItem(id: UUID): Promise<Item | null> {
    const row = await this.client.getFirst<ItemRow>(
      "SELECT * FROM items WHERE id = ?",
      [id],
      "item.get",
    );
    return row ? mapRowToItem(row) : null;
  }

  async listInbox(): Promise<Item[]> {
    const rows = await this.client.getAll<ItemRow>(
      `
        SELECT items.*
        FROM items
        LEFT JOIN item_tags ON items.id = item_tags.item_id
        WHERE items.archived_at IS NULL
          AND items.area_id IS NULL
          AND item_tags.item_id IS NULL
        ORDER BY items.updated_at DESC
      `,
      [],
      "item.listInbox",
    );
    return rows.map(mapRowToItem);
  }

  async listTasksToday(): Promise<TaskItem[]> {
    const rows = await this.client.getAll<ItemRow>(
      `
        SELECT *
        FROM items
        WHERE type = 'task'
          AND archived_at IS NULL
          AND task_status != 'done'
          AND date(COALESCE(task_due_at, task_scheduled_at)) = date('now')
        ORDER BY COALESCE(task_due_at, task_scheduled_at) ASC
      `,
      [],
      "item.listTasksToday",
    );
    return rows.map(mapRowToItem) as TaskItem[];
  }

  async listTasksUpcoming(): Promise<TaskItem[]> {
    const rows = await this.client.getAll<ItemRow>(
      `
        SELECT *
        FROM items
        WHERE type = 'task'
          AND archived_at IS NULL
          AND task_status != 'done'
          AND date(COALESCE(task_due_at, task_scheduled_at)) > date('now')
        ORDER BY COALESCE(task_due_at, task_scheduled_at) ASC
      `,
      [],
      "item.listTasksUpcoming",
    );
    return rows.map(mapRowToItem) as TaskItem[];
  }

  async listTasksOverdue(): Promise<TaskItem[]> {
    const rows = await this.client.getAll<ItemRow>(
      `
        SELECT *
        FROM items
        WHERE type = 'task'
          AND archived_at IS NULL
          AND task_status != 'done'
          AND date(COALESCE(task_due_at, task_scheduled_at)) < date('now')
        ORDER BY COALESCE(task_due_at, task_scheduled_at) ASC
      `,
      [],
      "item.listTasksOverdue",
    );
    return rows.map(mapRowToItem) as TaskItem[];
  }

  async listNotes(): Promise<NoteItem[]> {
    const rows = await this.client.getAll<ItemRow>(
      `
        SELECT *
        FROM items
        WHERE type = 'note'
          AND archived_at IS NULL
        ORDER BY note_pinned DESC, updated_at DESC
      `,
      [],
      "item.listNotes",
    );
    return rows.map(mapRowToItem) as NoteItem[];
  }

  async listCalendarRange(start: string, end: string): Promise<Item[]> {
    const rows = await this.client.getAll<ItemRow>(
      `
        SELECT *
        FROM items
        WHERE archived_at IS NULL
          AND (
            (
              type = 'event'
              AND event_start_at <= ?
              AND event_end_at >= ?
            )
            OR (
              type = 'task'
              AND task_scheduled_at IS NOT NULL
              AND task_scheduled_at BETWEEN ? AND ?
            )
          )
        ORDER BY COALESCE(event_start_at, task_scheduled_at) ASC
      `,
      [end, start, start, end],
      "item.listCalendarRange",
    );
    return rows.map(mapRowToItem);
  }
}
