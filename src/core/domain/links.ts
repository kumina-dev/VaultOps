import type { UUID } from "./item";

export type ParsedLink =
  | { kind: "note-id"; id: UUID; raw: string }
  | { kind: "title"; title: string; raw: string };

export type NoteLinkEdge = {
  fromNoteId: UUID;
  toNoteId: UUID;
};
