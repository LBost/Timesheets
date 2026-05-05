ALTER TABLE `clients` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `currency` text DEFAULT 'EUR' NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `billing_model` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_active` integer DEFAULT true NOT NULL;