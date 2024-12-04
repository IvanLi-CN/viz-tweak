import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export enum AttachmentStatus {
  Created = "created",
  Uploaded = "uploaded",
  Deleted = "deleted",
}

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  name: text("name").notNull(),
  mime: text("mime"),
  path: text("path").notNull().unique(),
  metadata: text("metadata", { mode: "json" }).default("{}"),
  status: text("status", {
    enum: [
      AttachmentStatus.Created,
      AttachmentStatus.Uploaded,
      AttachmentStatus.Deleted,
    ],
  })
    .notNull()
    .default(AttachmentStatus.Created),
  owner: text("owner").notNull().default("anonymous"),
  size: integer("size").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  lastAccessedAt: integer("last_accessed_at", { mode: "timestamp" }),
  lastKeptAliveAt: integer("last_kept_alive_at", { mode: "timestamp" }),
});

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
  },
  (tags) => ({
    nameIdx: uniqueIndex("nameIdx").on(tags.name),
  }),
);

export const attachments_tags = sqliteTable(
  "attachments_tags",
  {
    attachmentId: text("attachment_id")
      .notNull()
      .references(() => attachments.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (attachments_tags) => ({
    attachmentIdTagIdIdx: uniqueIndex("attachmentIdTagIdIdx").on(
      attachments_tags.attachmentId,
      attachments_tags.tagId,
    ),
  }),
);
