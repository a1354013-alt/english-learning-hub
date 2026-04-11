-- Add missing fields to studyLogs table
ALTER TABLE `studyLogs` ADD COLUMN IF NOT EXISTS `activityType` enum('review','video','writing','quiz') NOT NULL AFTER `cardId`;
ALTER TABLE `studyLogs` MODIFY `quality` int;
ALTER TABLE `studyLogs` ADD COLUMN IF NOT EXISTS `xpEarned` int NOT NULL DEFAULT 0 AFTER `quality`;
ALTER TABLE `studyLogs` ADD COLUMN IF NOT EXISTS `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `xpEarned`;
