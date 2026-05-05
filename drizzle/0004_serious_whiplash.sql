CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`project_id` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_project_code_unique` ON `orders` (`project_id`,`code`);--> statement-breakpoint
ALTER TABLE `projects` ADD `use_orders` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `time_entries` ADD `project_id` integer REFERENCES projects(id);--> statement-breakpoint
ALTER TABLE `time_entries` ADD `order_id` integer REFERENCES orders(id);