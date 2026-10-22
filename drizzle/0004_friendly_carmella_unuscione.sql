ALTER TABLE `sessions` ADD `private_ok` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `private_fail` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `private_fail_at` integer DEFAULT 0 NOT NULL;