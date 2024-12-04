CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`name` text NOT NULL,
	`mime` text,
	`path` text NOT NULL,
	`metadata` text DEFAULT '{}',
	`status` text DEFAULT 'created' NOT NULL,
	`owner` text DEFAULT 'anonymous' NOT NULL,
	`size` integer NOT NULL,
	`created_at` integer NOT NULL,
	`last_accessed_at` integer,
	`last_kept_alive_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attachments_path_unique` ON `attachments` (`path`);--> statement-breakpoint
CREATE TABLE `attachments_tags` (
	`attachment_id` text NOT NULL,
	`tag_id` text NOT NULL,
	FOREIGN KEY (`attachment_id`) REFERENCES `attachments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attachmentIdTagIdIdx` ON `attachments_tags` (`attachment_id`,`tag_id`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nameIdx` ON `tags` (`name`);