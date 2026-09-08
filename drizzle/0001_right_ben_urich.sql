CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(140) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(40) NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`paymentMethod` enum('RAZORPAY','MANUAL_QR') NOT NULL,
	`orderStatus` enum('PENDING','PAID','FAILED','REJECTED','DELIVERED') NOT NULL DEFAULT 'PENDING',
	`razorpayOrderId` varchar(100),
	`razorpayPaymentId` varchar(100),
	`razorpaySignature` varchar(180),
	`qrScreenshotUrl` text,
	`manualPaymentNote` varchar(120),
	`adminReviewedBy` int,
	`adminReviewedAt` timestamp,
	`adminRejectionReason` text,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `paymentSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`qrCodeImageUrl` text,
	`upiId` varchar(160),
	`payeeName` varchar(160),
	`isRazorpayEnabled` boolean NOT NULL DEFAULT true,
	`isManualQrEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(220) NOT NULL,
	`slug` varchar(240) NOT NULL,
	`description` text NOT NULL,
	`shortDescription` varchar(320) NOT NULL,
	`type` enum('SOURCE_CODE','PROMPT','PROJECT') NOT NULL,
	`categoryId` int NOT NULL,
	`price` int NOT NULL,
	`discountPrice` int,
	`thumbnailUrl` text NOT NULL,
	`previewImages` json,
	`demoUrl` text,
	`techStack` json,
	`fileUrl` text NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`salesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `isDisabled` boolean DEFAULT false NOT NULL;