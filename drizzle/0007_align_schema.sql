-- Align schema with current application contracts.
-- This migration updates existing tables to match the current drizzle/schema.ts structure.

ALTER TABLE `dailySignIns`
  MODIFY COLUMN `signInDate` varchar(10) NOT NULL;
--> statement-breakpoint

ALTER TABLE `writingChallenges`
  ADD COLUMN `title` varchar(255) NOT NULL DEFAULT '' AFTER `topic`,
  ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `createdAt`;
--> statement-breakpoint

UPDATE `writingChallenges`
SET `title` = `topic`
WHERE `title` = '';
--> statement-breakpoint

ALTER TABLE `writingChallenges`
  DROP COLUMN `createdDate`;
--> statement-breakpoint

ALTER TABLE `writingSubmissions`
  ADD COLUMN `feedback` text AFTER `content`;
--> statement-breakpoint

ALTER TABLE `aiCourses`
  ADD COLUMN `description` text AFTER `topic`;
--> statement-breakpoint

ALTER TABLE `videos`
  ADD COLUMN `url` varchar(512) NOT NULL DEFAULT '' AFTER `description`;
--> statement-breakpoint

UPDATE `videos`
SET `url` = CONCAT('https://www.youtube.com/watch?v=', `youtubeId`)
WHERE `url` = '' AND `youtubeId` IS NOT NULL AND `youtubeId` != '';
--> statement-breakpoint

ALTER TABLE `videos`
  MODIFY COLUMN `youtubeId` varchar(255) NULL,
  MODIFY COLUMN `transcript` json NULL;
--> statement-breakpoint

-- Migrate generatedContent to new structured lesson format
ALTER TABLE `generatedContent`
  MODIFY COLUMN `generatedDate` varchar(10) NOT NULL,
  ADD COLUMN `vocabulary` json NULL AFTER `proficiencyLevel`,
  ADD COLUMN `grammar` json NULL AFTER `vocabulary`,
  ADD COLUMN `readingMaterial` json NULL AFTER `grammar`,
  ADD COLUMN `exercises` json NULL AFTER `readingMaterial`,
  ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `createdAt`;
--> statement-breakpoint

UPDATE `generatedContent`
SET `vocabulary` = JSON_ARRAY(JSON_OBJECT('word', `content`, 'definition', `definition`, 'usage', `exampleUsage`))
WHERE `contentType` = 'vocabulary';
--> statement-breakpoint

UPDATE `generatedContent`
SET `readingMaterial` = JSON_OBJECT('phrase', `content`, 'definition', `definition`, 'usage', `exampleUsage`)
WHERE `contentType` = 'phrase';
--> statement-breakpoint

UPDATE `generatedContent`
SET `readingMaterial` = JSON_OBJECT('sentence', `content`, 'definition', `definition`, 'usage', `exampleUsage`)
WHERE `contentType` = 'sentence';
--> statement-breakpoint

UPDATE `generatedContent`
SET `readingMaterial` = JSON_OBJECT('text', `content`, 'explanation', `definition`, 'usage', `exampleUsage`)
WHERE `contentType` = 'passage';
--> statement-breakpoint

UPDATE `generatedContent`
SET `vocabulary` = JSON_ARRAY() WHERE `vocabulary` IS NULL;
--> statement-breakpoint
UPDATE `generatedContent`
SET `grammar` = JSON_OBJECT() WHERE `grammar` IS NULL;
--> statement-breakpoint
UPDATE `generatedContent`
SET `readingMaterial` = JSON_OBJECT() WHERE `readingMaterial` IS NULL;
--> statement-breakpoint
UPDATE `generatedContent`
SET `exercises` = JSON_ARRAY() WHERE `exercises` IS NULL;
--> statement-breakpoint

ALTER TABLE `generatedContent`
  MODIFY COLUMN `vocabulary` json NOT NULL DEFAULT '[]',
  MODIFY COLUMN `grammar` json NOT NULL DEFAULT '{}',
  MODIFY COLUMN `readingMaterial` json NOT NULL DEFAULT '{}',
  MODIFY COLUMN `exercises` json NOT NULL DEFAULT '[]';
--> statement-breakpoint

ALTER TABLE `generatedContent`
  DROP COLUMN `contentType`,
  DROP COLUMN `content`,
  DROP COLUMN `definition`,
  DROP COLUMN `exampleUsage`,
  DROP COLUMN `archivedDate`;
--> statement-breakpoint

CREATE UNIQUE INDEX `generatedContent_date_level_unique`
  ON `generatedContent` (`generatedDate`, `proficiencyLevel`);
--> statement-breakpoint
CREATE INDEX `generatedContent_isArchived_idx`
  ON `generatedContent` (`isArchived`);
--> statement-breakpoint

-- contentArchive table was an abandoned half-implementation (app uses generatedContent.isArchived).
DROP TABLE IF EXISTS `contentArchive`;
--> statement-breakpoint
