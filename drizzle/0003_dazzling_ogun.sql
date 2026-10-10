ALTER TABLE `sessions` ADD `last_seen` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `name_changed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_sessions_last_seen` ON `sessions` (`last_seen`);