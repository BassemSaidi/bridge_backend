-- BridgeTN Database Schema
-- MySQL 8.0+ compatible

CREATE DATABASE IF NOT EXISTS bridgetn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bridgetn;

-- Users table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mail VARCHAR(191) UNIQUE NOT NULL,
    mdp VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'TRANSPORTEUR') DEFAULT 'TRANSPORTEUR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_mail (mail),
    INDEX idx_role (role)
);

-- Account table
CREATE TABLE Account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nom VARCHAR(255) NOT NULL,
    Tel1 VARCHAR(50),
    Tel2W VARCHAR(50),
    Bio TEXT,
    voiture VARCHAR(100),
    paysTrajet JSON,
    guide JSON,
    interdits JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_nom (nom)
);

-- Voyage table
CREATE TABLE Voyage (
    idV INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    PaysD VARCHAR(100) NOT NULL,
    villePD JSON,
    PaysF VARCHAR(100) NOT NULL,
    villePF JSON,
    DateD DATE NOT NULL,
    DateF DATE,
    status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
    codeT VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES Account(id) ON DELETE CASCADE,
    INDEX idx_account_id (account_id),
    INDEX idx_status (status),
    INDEX idx_date (DateD),
    INDEX idx_codeT (codeT)
);

-- Colis table
CREATE TABLE Colis (
    idCo INT AUTO_INCREMENT PRIMARY KEY,
    voyage_id INT NOT NULL,
    nomS VARCHAR(255) NOT NULL,
    TelS VARCHAR(50) NOT NULL,
    adresseS TEXT NOT NULL,
    detailsS TEXT,
    nomR VARCHAR(255) NOT NULL,
    TelR VARCHAR(50) NOT NULL,
    adresseR TEXT NOT NULL,
    detailsR TEXT,
    KgCo DECIMAL(10,2) NOT NULL,
    nb_box INT DEFAULT 1,
    prixTotale DECIMAL(10,2) NOT NULL,
    payementStatus ENUM('PAID', 'TO PAY') DEFAULT 'TO PAY',
    photoCo JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (voyage_id) REFERENCES Voyage(idV) ON DELETE CASCADE,
    INDEX idx_voyage_id (voyage_id),
    INDEX idx_payment_status (payementStatus),
    INDEX idx_nomS (nomS),
    INDEX idx_nomR (nomR)
);
