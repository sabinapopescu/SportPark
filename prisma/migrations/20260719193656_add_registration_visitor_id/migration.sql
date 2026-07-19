-- AlterTable
ALTER TABLE `registrations` ADD COLUMN `visitorId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `registrations_eventId_visitorId_idx` ON `registrations`(`eventId`, `visitorId`);
