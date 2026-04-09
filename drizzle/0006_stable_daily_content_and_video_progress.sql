ALTER TABLE `studyLogs`
  ADD COLUMN `videoId` int NULL AFTER `quality`,
  ADD COLUMN `checkpointSecond` int NULL AFTER `videoId`;
--> statement-breakpoint
CREATE INDEX `studyLogs_user_activity_created_idx`
  ON `studyLogs` (`userId`, `activityType`, `createdAt`);
--> statement-breakpoint
CREATE INDEX `studyLogs_video_dedup_idx`
  ON `studyLogs` (`userId`, `activityType`, `videoId`, `checkpointSecond`, `createdAt`);
--> statement-breakpoint
ALTER TABLE `writingChallenges`
  ADD COLUMN `activeDate` varchar(10) NULL AFTER `proficiencyLevel`;
--> statement-breakpoint
UPDATE `writingChallenges`
SET `activeDate` = DATE_FORMAT(`createdAt`, '%Y-%m-%d')
WHERE `activeDate` IS NULL;
--> statement-breakpoint
ALTER TABLE `writingChallenges`
  MODIFY COLUMN `activeDate` varchar(10) NOT NULL;
--> statement-breakpoint
CREATE INDEX `writingChallenges_level_activeDate_idx`
  ON `writingChallenges` (`proficiencyLevel`, `activeDate`);
