CREATE TABLE `aiCourses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`topic` varchar(255),
	`proficiencyLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`vocabulary` json,
	`grammar` json,
	`readingMaterial` json,
	`exercises` json,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`rating` int,
	`notes` text,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiCourses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `aiCourses` (`userId`);--> statement-breakpoint
CREATE INDEX `generatedAtIdx` ON `aiCourses` (`generatedAt`);