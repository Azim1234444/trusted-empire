CREATE TABLE `order_numbers` (
	`number` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`notification_id` text NOT NULL,
	FOREIGN KEY (`notification_id`) REFERENCES `order_notifications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_numbers_notification_id_unique` ON `order_numbers` (`notification_id`);
--> statement-breakpoint
CREATE TRIGGER assign_order_number AFTER INSERT ON order_notifications
BEGIN
  INSERT INTO order_numbers (notification_id) VALUES (NEW.id);
END;
