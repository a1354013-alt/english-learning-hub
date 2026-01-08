CREATE TABLE `cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`userId` int NOT NULL,
	`frontText` varchar(255) NOT NULL,
	`backText` text NOT NULL,
	`phonetic` varchar(255),
	`audioUrl` varchar(512),
	`exampleSentence` text,
	`imageUrl` varchar(512),
	`repetitionCount` int NOT NULL DEFAULT 0,
	`interval` int NOT NULL DEFAULT 0,
	`easinessFactor` decimal(4,2) NOT NULL DEFAULT '2.50',
	`nextReviewAt` timestamp NOT NULL DEFAULT (now()),
	`lastReviewedAt` timestamp,
	`proficiencyLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentArchive` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentId` int NOT NULL,
	`contentType` enum('card','video','writing','generated') NOT NULL,
	`archivedDate` date NOT NULL,
	`proficiencyLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentArchive_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailySignIns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`signInDate` date NOT NULL,
	`xpEarned` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dailySignIns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`proficiencyLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`cardCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `decks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dictionaryCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`word` varchar(255) NOT NULL,
	`phonetic` varchar(255),
	`audioUrl` varchar(512),
	`definitions` json NOT NULL,
	`exampleSentences` json,
	`proficiencyLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`frequency` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dictionaryCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `dictionaryCache_word_unique` UNIQUE(`word`)
);
--> statement-breakpoint
CREATE TABLE `generatedContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` enum('vocabulary','phrase','sentence','passage') NOT NULL,
	`content` text NOT NULL,
	`definition` text,
	`exampleUsage` text,
	`proficiencyLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`generatedDate` date NOT NULL,
	`isArchived` boolean NOT NULL DEFAULT false,
	`archivedDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learningPaths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`targetLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`completionPercentage` int NOT NULL DEFAULT 0,
	`estimatedDaysToTarget` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningPaths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` int,
	`activityType` enum('review','video','writing','quiz') NOT NULL,
	`quality` int,
	`xpEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studyLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`youtubeId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`transcript` json NOT NULL,
	`proficiencyLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`durationSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videos_id` PRIMARY KEY(`id`),
	CONSTRAINT `videos_youtubeId_unique` UNIQUE(`youtubeId`)
);
--> statement-breakpoint
CREATE TABLE `writingChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(255) NOT NULL,
	`prompt` text NOT NULL,
	`proficiencyLevel` enum('junior_high','senior_high','college','advanced') NOT NULL,
	`createdDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `writingChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `writingSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`content` text NOT NULL,
	`errors` json,
	`score` int,
	`xpEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `writingSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `proficiencyLevel` enum('junior_high','senior_high','college','advanced') DEFAULT 'junior_high' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalXp` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `currentStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `longestStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `lastActivityDate` date;--> statement-breakpoint
CREATE INDEX `nextReviewIdx` ON `cards` (`nextReviewAt`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `cards` (`userId`);--> statement-breakpoint
CREATE INDEX `deckIdIdx` ON `cards` (`deckId`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `contentArchive` (`userId`);--> statement-breakpoint
CREATE INDEX `archivedDateIdx` ON `contentArchive` (`archivedDate`);--> statement-breakpoint
CREATE INDEX `userIdDateIdx` ON `dailySignIns` (`userId`,`signInDate`);--> statement-breakpoint
CREATE INDEX `wordIdx` ON `dictionaryCache` (`word`);--> statement-breakpoint
CREATE INDEX `generatedDateIdx` ON `generatedContent` (`generatedDate`);--> statement-breakpoint
CREATE INDEX `proficiencyLevelIdx` ON `generatedContent` (`proficiencyLevel`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `studyLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `createdAtIdx` ON `studyLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `youtubeIdIdx` ON `videos` (`youtubeId`);--> statement-breakpoint
CREATE INDEX `createdDateIdx` ON `writingChallenges` (`createdDate`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `writingSubmissions` (`userId`);--> statement-breakpoint
CREATE INDEX `challengeIdIdx` ON `writingSubmissions` (`challengeId`);