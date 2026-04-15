-- Add database-level referential integrity to prevent orphaned records.
-- This migration intentionally prefers fail-fast invariants over application-layer conventions.

-- Ensure per-user deck title uniqueness (code relies on this for deterministic imports).
CREATE UNIQUE INDEX `decks_userId_title_idx`
  ON `decks` (`userId`, `title`);
--> statement-breakpoint

-- Ensure one learning path per user.
CREATE UNIQUE INDEX `learningPaths_userId_unique`
  ON `learningPaths` (`userId`);
--> statement-breakpoint

-- FK helper indexes (MySQL requires indexed referencing columns for FK performance/validation).
CREATE INDEX `studyLogs_cardId_idx`
  ON `studyLogs` (`cardId`);
--> statement-breakpoint

-- Best-effort cleanup of orphan rows before adding foreign keys.
DELETE FROM `cards` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
--> statement-breakpoint
DELETE FROM `cards` WHERE `deckId` NOT IN (SELECT `id` FROM `decks`);
--> statement-breakpoint
DELETE FROM `decks` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
--> statement-breakpoint
DELETE FROM `dailySignIns` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
--> statement-breakpoint
DELETE FROM `learningPaths` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
--> statement-breakpoint
DELETE FROM `aiCourses` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
--> statement-breakpoint
DELETE FROM `studyLogs` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
--> statement-breakpoint
UPDATE `studyLogs` SET `cardId` = NULL WHERE `cardId` IS NOT NULL AND `cardId` NOT IN (SELECT `id` FROM `cards`);
--> statement-breakpoint
UPDATE `studyLogs` SET `videoId` = NULL WHERE `videoId` IS NOT NULL AND `videoId` NOT IN (SELECT `id` FROM `videos`);
--> statement-breakpoint
DELETE FROM `writingSubmissions` WHERE `userId` NOT IN (SELECT `id` FROM `users`);
--> statement-breakpoint
DELETE FROM `writingSubmissions` WHERE `challengeId` NOT IN (SELECT `id` FROM `writingChallenges`);
--> statement-breakpoint

-- Foreign keys.
ALTER TABLE `decks`
  ADD CONSTRAINT `decks_userId_fk`
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
  ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE `cards`
  ADD CONSTRAINT `cards_userId_fk`
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
  ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE `cards`
  ADD CONSTRAINT `cards_deckId_fk`
  FOREIGN KEY (`deckId`) REFERENCES `decks` (`id`)
  ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE `studyLogs`
  ADD CONSTRAINT `studyLogs_userId_fk`
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
  ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE `studyLogs`
  ADD CONSTRAINT `studyLogs_cardId_fk`
  FOREIGN KEY (`cardId`) REFERENCES `cards` (`id`)
  ON DELETE SET NULL;
--> statement-breakpoint

ALTER TABLE `studyLogs`
  ADD CONSTRAINT `studyLogs_videoId_fk`
  FOREIGN KEY (`videoId`) REFERENCES `videos` (`id`)
  ON DELETE SET NULL;
--> statement-breakpoint

ALTER TABLE `dailySignIns`
  ADD CONSTRAINT `dailySignIns_userId_fk`
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
  ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE `writingSubmissions`
  ADD CONSTRAINT `writingSubmissions_userId_fk`
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
  ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE `writingSubmissions`
  ADD CONSTRAINT `writingSubmissions_challengeId_fk`
  FOREIGN KEY (`challengeId`) REFERENCES `writingChallenges` (`id`)
  ON DELETE RESTRICT;
--> statement-breakpoint

ALTER TABLE `learningPaths`
  ADD CONSTRAINT `learningPaths_userId_fk`
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
  ON DELETE CASCADE;
--> statement-breakpoint

ALTER TABLE `aiCourses`
  ADD CONSTRAINT `aiCourses_userId_fk`
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
  ON DELETE CASCADE;
--> statement-breakpoint
