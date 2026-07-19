-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `titleRo` VARCHAR(191) NOT NULL,
    `titleRu` VARCHAR(191) NOT NULL,
    `descriptionRo` TEXT NULL,
    `descriptionRu` TEXT NULL,
    `photo` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `categories_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed categories from the previously hardcoded category list, so existing
-- events (which store the category name as free text) can be backfilled below.
INSERT INTO `categories` (`id`, `titleRo`, `titleRu`, `updatedAt`) VALUES
    (UUID(), 'Fitness', 'Фитнес', CURRENT_TIMESTAMP(3)),
    (UUID(), 'CrossFit', 'Кроссфит', CURRENT_TIMESTAMP(3)),
    (UUID(), 'Pilates', 'Пилатес', CURRENT_TIMESTAMP(3)),
    (UUID(), 'Tenis', 'Теннис', CURRENT_TIMESTAMP(3)),
    (UUID(), 'Squash', 'Сквош', CURRENT_TIMESTAMP(3)),
    (UUID(), 'Kids Park', 'Кидс Парк', CURRENT_TIMESTAMP(3));

-- AlterTable
ALTER TABLE `events` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- Backfill: match each event's old free-text category to the seeded row by name.
UPDATE `events` e
    JOIN `categories` c ON c.`titleRo` = e.`category`
    SET e.`categoryId` = c.`id`;

-- Any event whose category string didn't match a seeded row (unexpected legacy
-- data) falls back to the first category rather than being left dangling.
UPDATE `events` SET `categoryId` = (SELECT `id` FROM `categories` ORDER BY `titleRo` LIMIT 1)
    WHERE `categoryId` IS NULL;

ALTER TABLE `events` MODIFY COLUMN `categoryId` VARCHAR(191) NOT NULL;
ALTER TABLE `events` DROP COLUMN `category`;

-- CreateIndex
CREATE INDEX `events_categoryId_idx` ON `events`(`categoryId`);

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
