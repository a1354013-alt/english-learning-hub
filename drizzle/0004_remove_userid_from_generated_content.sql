-- Remove userId from generatedContent table
-- generatedContent is site-wide shared content per proficiency level, not per-user
SET @generatedContent_has_userId := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'generatedContent'
    AND COLUMN_NAME = 'userId'
);--> statement-breakpoint
SET @generatedContent_drop_userId_sql := IF(
  @generatedContent_has_userId > 0,
  'ALTER TABLE `generatedContent` DROP COLUMN `userId`',
  'SELECT 1'
);--> statement-breakpoint
PREPARE stmt FROM @generatedContent_drop_userId_sql;--> statement-breakpoint
EXECUTE stmt;--> statement-breakpoint
DEALLOCATE PREPARE stmt;--> statement-breakpoint
