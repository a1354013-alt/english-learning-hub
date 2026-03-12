-- Add missing fields to studyLogs table
ALTER TABLE `studyLogs` ADD `activityType` enum('review','video','writing','quiz') NOT NULL AFTER `cardId`;
ALTER TABLE `studyLogs` MODIFY `quality` int;
ALTER TABLE `studyLogs` ADD `xpEarned` int NOT NULL DEFAULT 0 AFTER `quality`;
ALTER TABLE `studyLogs` ADD `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `xpEarned`;
