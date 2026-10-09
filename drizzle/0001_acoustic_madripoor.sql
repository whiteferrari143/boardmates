CREATE TABLE `seats` (
	`player_id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`lease_until` integer NOT NULL
);
