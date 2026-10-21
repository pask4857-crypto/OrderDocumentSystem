
-- =========================================================
-- OrderDocumentSystem 示範資料庫
-- 適用於全新資料庫；請勿直接對既有開發資料庫執行
-- =========================================================

CREATE DATABASE IF NOT EXISTS `order_document_demo`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `order_document_demo`;

-- ---------------------------------------------------------
-- EF Core Migration 歷史
-- ---------------------------------------------------------

CREATE TABLE `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory`
        PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

-- ---------------------------------------------------------
-- 客戶
-- ---------------------------------------------------------

CREATE TABLE `Customers` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Email` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_Customers` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

-- ---------------------------------------------------------
-- 商品
-- ---------------------------------------------------------

CREATE TABLE `Products` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Price` decimal(65,30) NOT NULL,
    `Stock` int NOT NULL,
    CONSTRAINT `PK_Products` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

-- ---------------------------------------------------------
-- 使用者
-- ---------------------------------------------------------

CREATE TABLE `Users` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Username` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Role` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_Users_Username`
    ON `Users` (`Username`);

-- ---------------------------------------------------------
-- 訂單
-- ---------------------------------------------------------

CREATE TABLE `Orders` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `CustomerId` int NOT NULL,
    `OrderDate` datetime(6) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_Orders` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Orders_Customers_CustomerId`
        FOREIGN KEY (`CustomerId`)
        REFERENCES `Customers` (`Id`)
        ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Orders_CustomerId`
    ON `Orders` (`CustomerId`);

-- ---------------------------------------------------------
-- 訂單明細
-- ---------------------------------------------------------

CREATE TABLE `OrderDetails` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `OrderId` int NOT NULL,
    `ProductId` int NOT NULL,
    `Quantity` int NOT NULL,
    `UnitPrice` decimal(65,30) NOT NULL,
    CONSTRAINT `PK_OrderDetails` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_OrderDetails_Orders_OrderId`
        FOREIGN KEY (`OrderId`)
        REFERENCES `Orders` (`Id`)
        ON DELETE CASCADE,
    CONSTRAINT `FK_OrderDetails_Products_ProductId`
        FOREIGN KEY (`ProductId`)
        REFERENCES `Products` (`Id`)
        ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_OrderDetails_OrderId`
    ON `OrderDetails` (`OrderId`);

CREATE INDEX `IX_OrderDetails_ProductId`
    ON `OrderDetails` (`ProductId`);

-- ---------------------------------------------------------
-- 示範使用者
-- 密碼使用 BCrypt 雜湊；僅供本機展示，不可用於正式環境
-- ---------------------------------------------------------

INSERT INTO `Users` (`Username`, `PasswordHash`, `Role`)
VALUES
(
    'demo_user',
    '$2b$10$2dUuQNdKocPkeoP.8UicmupQ7ApST7E234Ukp2JyNpGdmf0Pj99uy',
    'USER'
),
(
    'demo_admin',
    '$2b$10$uqh/RUq/TBoozYMcYQZ0ZeEGHSGK/D6Qf9m8v0j.nmtzbQ8Fifc6G',
    'ADMIN'
);

-- ---------------------------------------------------------
-- 示範客戶
-- ---------------------------------------------------------

INSERT INTO `Customers` (`Id`, `Name`, `Email`)
VALUES
(1, '王小明', 'ming@example.com'),
(2, '陳小華', 'hua@example.com');

-- ---------------------------------------------------------
-- 示範商品
-- ---------------------------------------------------------

INSERT INTO `Products` (`Id`, `Name`, `Price`, `Stock`)
VALUES
(1, '無線滑鼠', 590.00, 50),
(2, '機械鍵盤', 1890.00, 30),
(3, 'USB-C 集線器', 890.00, 40);

-- ---------------------------------------------------------
-- 示範訂單
-- ---------------------------------------------------------

INSERT INTO `Orders` (`Id`, `CustomerId`, `OrderDate`, `Status`)
VALUES
(1, 1, '2026-10-01 10:00:00', 'Pending'),
(2, 2, '2026-10-02 14:30:00', 'Confirmed');

INSERT INTO `OrderDetails`
    (`Id`, `OrderId`, `ProductId`, `Quantity`, `UnitPrice`)
VALUES
(1, 1, 1, 2, 590.00),
(2, 1, 3, 1, 890.00),
(3, 2, 2, 1, 1890.00);

-- ---------------------------------------------------------
-- 標記現有 Migration 均已套用
-- 避免未來執行 database update 時重播舊的建表操作
-- ---------------------------------------------------------

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES
('20260916084214_InitialCreate', '8.0.19'),
('20260919065730_AddProduct', '8.0.19'),
('20260919074754_RecreateProduct', '8.0.19'),
('20260919080212_RRecreateProduct', '8.0.19'),
('20260921013129_AddOrder', '8.0.19'),
('20260921015044_AddOrderDetail', '8.0.19'),
('20260924020235_AddUser', '8.0.19'),
('20260930002317_AddUniqueUsername', '8.0.19');
