PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`name` text NOT NULL,
	`mime` text,
	`path` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`metadata` text DEFAULT '{}',
	`status` text DEFAULT 'created' NOT NULL,
	`owner` text DEFAULT 'anonymous' NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL,
	`generated_at` integer,
	`last_accessed_at` integer,
	`last_kept_alive_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_attachments`("id", "filename", "name", "mime", "path", "slug", "description", "metadata", "status", "owner", "size", "created_at", "generated_at", "last_accessed_at", "last_kept_alive_at") SELECT "id", "filename", "name", "mime", "path", "id", "slug", "metadata", "status", "owner", "size", "created_at", "generated_at", "last_accessed_at", "last_kept_alive_at" FROM `attachments`;--> statement-breakpoint
DROP TABLE `attachments`;--> statement-breakpoint
ALTER TABLE `__new_attachments` RENAME TO `attachments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `attachments_path_unique` ON `attachments` (`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `attachments_slug_unique` ON `attachments` (`slug`);