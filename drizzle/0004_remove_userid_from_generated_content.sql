-- Remove userId from generatedContent table
-- generatedContent is site-wide shared content per proficiency level, not per-user
ALTER TABLE `generatedContent` DROP COLUMN `userId`;
