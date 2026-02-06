import type { UUID } from "./item";

export type ReminderStatus = "scheduled" | "fired" | "snoozed" | "cancelled";

export type Reminder = {
  id: UUID;
  title: string;
  fireAt: string;
  repeatRule: string | null;
  itemId: UUID | null;
  status: ReminderStatus;
  snoozeUntil: string | null;
  createdAt: string;
  updatedAt: string;
};
