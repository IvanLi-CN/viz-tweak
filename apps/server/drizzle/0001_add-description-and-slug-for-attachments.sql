ALTER TABLE `attachments` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `attachments_slug_unique` ON `attachments` (`slug`);