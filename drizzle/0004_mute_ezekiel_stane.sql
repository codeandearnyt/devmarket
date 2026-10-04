ALTER TABLE `reviews` ADD `adminReply` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `repliedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;