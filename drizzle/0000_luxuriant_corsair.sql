CREATE TABLE `time_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`project` text NOT NULL,
	`description` text,
	`hours` integer NOT NULL,
	`created_at` integer NOT NULL
);
