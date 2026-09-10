CREATE TABLE `order_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`payload_hash` text NOT NULL,
	`customer_name` text NOT NULL,
	`contact` text NOT NULL,
	`plan` text NOT NULL,
	`months` integer NOT NULL,
	`amount_sen` integer NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`state` text NOT NULL,
	`telegram_message_id` integer
);
--> statement-breakpoint
CREATE INDEX `notice_ip_created` ON `order_notifications` (`ip_hash`,`created_at`);