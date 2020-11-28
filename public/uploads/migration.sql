CREATE TABLE IF NOT EXISTS `fiscalyear` (
    `id` INTEGER NOT NULL auto_increment,
    `year` VARCHAR(255),
    `name` VARCHAR(255),
    `state` INTEGER,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `account` (
    `id` INTEGER NOT NULL auto_increment,
    `name` VARCHAR(255),
    `level` INTEGER,
    `order` INTEGER,
    `status` INTEGER,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `journal` (
    `id` INTEGER NOT NULL auto_increment,
    `from_account` INTEGER,
    `to_account` INTEGER,
    `date` DATE,
    `memo` VARCHAR(255),
    `journalNo` INTEGER DEFAULT NULL,
    `amount` DECIMAL(7, 2),
    `status` INTEGER,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`from_account`) REFERENCES `account` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
    FOREIGN KEY (`to_account`) REFERENCES `account` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE = InnoDB;
