-- Add missing fields to studyLogs table
SET @studyLogs_has_activityType := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'studyLogs'
    AND COLUMN_NAME = 'activityType'
);--> statement-breakpoint
SET @studyLogs_add_activityType_sql := IF(
  @studyLogs_has_activityType = 0,
  'ALTER TABLE `studyLogs` ADD COLUMN `activityType` enum(''review'',''video'',''writing'',''quiz'') NOT NULL AFTER `cardId`',
  'SELECT 1'
);--> statement-breakpoint
PREPARE stmt FROM @studyLogs_add_activityType_sql;--> statement-breakpoint
EXECUTE stmt;--> statement-breakpoint
DEALLOCATE PREPARE stmt;--> statement-breakpoint

ALTER TABLE `studyLogs` MODIFY `quality` int;--> statement-breakpoint

SET @studyLogs_has_xpEarned := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'studyLogs'
    AND COLUMN_NAME = 'xpEarned'
);--> statement-breakpoint
SET @studyLogs_add_xpEarned_sql := IF(
  @studyLogs_has_xpEarned = 0,
  'ALTER TABLE `studyLogs` ADD COLUMN `xpEarned` int NOT NULL DEFAULT 0 AFTER `quality`',
  'SELECT 1'
);--> statement-breakpoint
PREPARE stmt FROM @studyLogs_add_xpEarned_sql;--> statement-breakpoint
EXECUTE stmt;--> statement-breakpoint
DEALLOCATE PREPARE stmt;--> statement-breakpoint

SET @studyLogs_has_createdAt := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'studyLogs'
    AND COLUMN_NAME = 'createdAt'
);--> statement-breakpoint
SET @studyLogs_add_createdAt_sql := IF(
  @studyLogs_has_createdAt = 0,
  'ALTER TABLE `studyLogs` ADD COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `xpEarned`',
  'SELECT 1'
);--> statement-breakpoint
PREPARE stmt FROM @studyLogs_add_createdAt_sql;--> statement-breakpoint
EXECUTE stmt;--> statement-breakpoint
DEALLOCATE PREPARE stmt;--> statement-breakpoint
