import { LinkIndexRepo } from "../../data/repos/LinkIndexRepo";

import type { DbClient } from "../../data/db/DbClient";
import type { UUID } from "../../domain/item";

const pendingUpdates = new Map<UUID, ReturnType<typeof setTimeout>>();

export function scheduleLinkIndexUpdate(
  client: DbClient,
  noteId: UUID,
  delayMs: number = 300,
): void {
  const existing = pendingUpdates.get(noteId);
  if (existing) {
    clearTimeout(existing);
  }

  const timeout = setTimeout(() => {
    pendingUpdates.delete(noteId);
    const repo = new LinkIndexRepo(client);
    void repo.updateForNote(noteId);
  }, delayMs);

  pendingUpdates.set(noteId, timeout);
}
