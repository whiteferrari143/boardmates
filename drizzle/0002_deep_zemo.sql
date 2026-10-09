CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`request_id` text NOT NULL,
	`player_id` text NOT NULL,
	`name` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_messages_request_id_unique` ON `chat_messages` (`request_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_player_created` ON `chat_messages` (`player_id`,`created`);