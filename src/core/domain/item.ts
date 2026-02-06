export type ItemType = "note" | "task" | "event";

export type UUID = string;

export type BaseItem = {
  id: UUID;
  type: ItemType;
  title: string;
  body: string | null;
  areaId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type NoteItem = BaseItem & {
  type: "note";
  pinned: boolean;
  favorite: boolean;
};

export type TaskStatus = "todo" | "doing" | "done" | "blocked";
export type TaskPriority = "low" | "med" | "high";

export type TaskItem = BaseItem & {
  type: "task";
  status: TaskStatus;
  priority: TaskPriority;
  scheduledAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  estimateMin: number | null;
  actualMin: number | null;
};

export type EventItem = BaseItem & {
  type: "event";
  startAt: string;
  endAt: string;
  allDay: boolean;
  location: string | null;
};

export type Item = NoteItem | TaskItem | EventItem;
