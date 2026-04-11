-- Align schema with current application contracts.
-- This migration updates existing tables to match the current drizzle/schema.ts structure.

ALTER TABLE `dailySignIns`
  MODIFY COLUMN `signInDate` varchar(10) NOT NULL;

ALTER TABLE `writingChallenges`
  ADD COLUMN IF NOT EXISTS `title` varchar(255) NOT NULL DEFAULT '' AFTER `topic`,
  ADD COLUMN IF NOT EXISTS `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `createdAt`;

UPDATE `writingChallenges`
SET `title` = `topic`
WHERE `title` = '';

ALTER TABLE `writingChallenges`
  DROP COLUMN IF EXISTS `createdDate`;

ALTER TABLE `writingSubmissions`
  ADD COLUMN IF NOT EXISTS `feedback` text AFTER `content`;

ALTER TABLE `aiCourses`
  ADD COLUMN IF NOT EXISTS `description` text AFTER `topic`;

ALTER TABLE `videos`
  ADD COLUMN IF NOT EXISTS `url` varchar(512) NOT NULL DEFAULT '' AFTER `description`;

UPDATE `videos`
SET `url` = CONCAT('https://www.youtube.com/watch?v=', `youtubeId`)
WHERE `url` = '' AND `youtubeId` IS NOT NULL AND `youtubeId` != '';

ALTER TABLE `videos`
  MODIFY COLUMN `youtubeId` varchar(255) NULL,
  MODIFY COLUMN `transcript` json NULL;

-- Migrate generatedContent to new structured lesson format
ALTER TABLE `generatedContent`
  ADD COLUMN IF NOT EXISTS `vocabulary` json NULL AFTER `proficiencyLevel`,
  ADD COLUMN IF NOT EXISTS `grammar` json NULL AFTER `vocabulary`,
  ADD COLUMN IF NOT EXISTS `readingMaterial` json NULL AFTER `grammar`,
  ADD COLUMN IF NOT EXISTS `exercises` json NULL AFTER `readingMaterial`;

UPDATE `generatedContent`
SET `vocabulary` = JSON_ARRAY(JSON_OBJECT('word', `content`, 'definition', `definition`, 'usage', `exampleUsage`))
WHERE `contentType` = 'vocabulary';

UPDATE `generatedContent`
SET `readingMaterial` = JSON_OBJECT('phrase', `content`, 'definition', `definition`, 'usage', `exampleUsage`)
WHERE `contentType` = 'phrase';

UPDATE `generatedContent`
SET `readingMaterial` = JSON_OBJECT('sentence', `content`, 'definition', `definition`, 'usage', `exampleUsage`)
WHERE `contentType` = 'sentence';

UPDATE `generatedContent`
SET `readingMaterial` = JSON_OBJECT('text', `content`, 'explanation', `definition`, 'usage', `exampleUsage`)
WHERE `contentType` = 'passage';

UPDATE `generatedContent`
SET `vocabulary` = JSON_ARRAY() WHERE `vocabulary` IS NULL;
UPDATE `generatedContent`
SET `grammar` = JSON_OBJECT() WHERE `grammar` IS NULL;
UPDATE `generatedContent`
SET `readingMaterial` = JSON_OBJECT() WHERE `readingMaterial` IS NULL;
UPDATE `generatedContent`
SET `exercises` = JSON_ARRAY() WHERE `exercises` IS NULL;

ALTER TABLE `generatedContent`
  MODIFY COLUMN `vocabulary` json NOT NULL DEFAULT '[]',
  MODIFY COLUMN `grammar` json NOT NULL DEFAULT '{}',
  MODIFY COLUMN `readingMaterial` json NOT NULL DEFAULT '{}',
  MODIFY COLUMN `exercises` json NOT NULL DEFAULT '[]';

ALTER TABLE `generatedContent`
  DROP COLUMN IF EXISTS `contentType`,
  DROP COLUMN IF EXISTS `content`,
  DROP COLUMN IF EXISTS `definition`,
  DROP COLUMN IF EXISTS `exampleUsage`;

CREATE UNIQUE INDEX IF NOT EXISTS `generatedContent_date_level_unique`
  ON `generatedContent` (`generatedDate`, `proficiencyLevel`);
CREATE INDEX IF NOT EXISTS `generatedContent_isArchived_idx`
  ON `generatedContent` (`isArchived`);

-- Migrate contentArchive to new structured lesson format
ALTER TABLE `contentArchive`
  ADD COLUMN IF NOT EXISTS `generatedDate` varchar(10) NOT NULL DEFAULT '' AFTER `userId`,
  ADD COLUMN IF NOT EXISTS `vocabulary` json NOT NULL DEFAULT '[]' AFTER `proficiencyLevel`,
  ADD COLUMN IF NOT EXISTS `grammar` json NOT NULL DEFAULT '{}' AFTER `vocabulary`,
  ADD COLUMN IF NOT EXISTS `readingMaterial` json NOT NULL DEFAULT '{}' AFTER `grammar`,
  ADD COLUMN IF NOT EXISTS `exercises` json NOT NULL DEFAULT '[]' AFTER `readingMaterial`;

UPDATE `contentArchive`
SET `generatedDate` = DATE_FORMAT(`archivedDate`, '%Y-%m-%d')
WHERE `generatedDate` = '';

UPDATE `contentArchive`
SET `vocabulary` = JSON_ARRAY(JSON_OBJECT('word', `content`, 'definition', `definition`, 'usage', `notes`))
WHERE `contentType` = 'vocabulary';

UPDATE `contentArchive`
SET `readingMaterial` = JSON_OBJECT('phrase', `content`, 'definition', `definition`, 'usage', `notes`)
WHERE `contentType` = 'phrase';

UPDATE `contentArchive`
SET `readingMaterial` = JSON_OBJECT('sentence', `content`, 'definition', `definition`, 'usage', `notes`)
WHERE `contentType` = 'sentence';

UPDATE `contentArchive`
SET `readingMaterial` = JSON_OBJECT('text', `content`, 'explanation', `definition`, 'usage', `notes`)
WHERE `contentType` = 'passage';

ALTER TABLE `contentArchive`
  DROP COLUMN IF EXISTS `contentType`,
  DROP COLUMN IF EXISTS `content`,
  DROP COLUMN IF EXISTS `definition`,
  DROP COLUMN IF EXISTS `notes`;

CREATE INDEX IF NOT EXISTS `contentArchive_user_generated_date_idx`
  ON `contentArchive` (`userId`, `generatedDate`, `proficiencyLevel`);
