CREATE TABLE `schedulerState` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskName` varchar(64) NOT NULL,
	`lastExecutedAt` timestamp NOT NULL,
	`nextScheduledAt` timestamp,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedulerState_id` PRIMARY KEY(`id`),
	CONSTRAINT `schedulerState_taskName_unique` UNIQUE(`taskName`)
);
