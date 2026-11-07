CREATE DATABASE IF NOT EXISTS my_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE my_wallet;

CREATE TABLE IF NOT EXISTS utilisateurs (
  id_user BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL DEFAULT '',
  email VARCHAR(190) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  statut ENUM('ACTIF','INACTIF') NOT NULL DEFAULT 'ACTIF',
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  id_categorie BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_user BIGINT UNSIGNED NULL,
  nom VARCHAR(100) NOT NULL,
  type_categorie ENUM('REVENU','DEPENSE','MIXTE') NOT NULL DEFAULT 'MIXTE',
  description VARCHAR(255) NULL,
  CONSTRAINT fk_categories_user FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
  UNIQUE KEY uq_category_user_name (id_user, nom),
  INDEX idx_category_name (nom)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS portefeuilles (
  id_wallet BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_user BIGINT UNSIGNED NOT NULL,
  nom VARCHAR(100) NOT NULL,
  type_wallet ENUM('CASH','MOBILE_MONEY','BANK','OTHER') NOT NULL DEFAULT 'CASH',
  solde_initial DECIMAL(15,2) NOT NULL DEFAULT 0,
  devise CHAR(3) NOT NULL DEFAULT 'MGA',
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  statut ENUM('ACTIF','ARCHIVE') NOT NULL DEFAULT 'ACTIF',
  CONSTRAINT fk_wallet_user FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
  INDEX idx_wallet_user (id_user)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id_transaction BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_user BIGINT UNSIGNED NOT NULL,
  id_wallet BIGINT UNSIGNED NOT NULL,
  id_categorie BIGINT UNSIGNED NULL,
  type_transaction ENUM('REVENU','DEPENSE') NOT NULL,
  montant DECIMAL(15,2) NOT NULL,
  libelle VARCHAR(180) NOT NULL,
  description TEXT NULL,
  justificatif VARCHAR(500) NULL,
  date_transaction DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_transaction_amount CHECK (montant > 0),
  CONSTRAINT fk_transaction_user FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
  CONSTRAINT fk_transaction_wallet FOREIGN KEY (id_wallet) REFERENCES portefeuilles(id_wallet) ON DELETE RESTRICT,
  CONSTRAINT fk_transaction_category FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie) ON DELETE SET NULL,
  INDEX idx_transaction_user_date (id_user, date_transaction),
  INDEX idx_transaction_wallet (id_wallet),
  INDEX idx_transaction_category (id_categorie)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transferts (
  id_transfert BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_user BIGINT UNSIGNED NOT NULL,
  id_wallet_source BIGINT UNSIGNED NOT NULL,
  id_wallet_destination BIGINT UNSIGNED NOT NULL,
  montant DECIMAL(15,2) NOT NULL,
  frais DECIMAL(15,2) NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL,
  date_transfert DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_transfer_amount CHECK (montant > 0),
  CONSTRAINT chk_transfer_fees CHECK (frais >= 0),
  CONSTRAINT chk_transfer_wallets CHECK (id_wallet_source <> id_wallet_destination),
  CONSTRAINT fk_transfer_user FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
  CONSTRAINT fk_transfer_source FOREIGN KEY (id_wallet_source) REFERENCES portefeuilles(id_wallet) ON DELETE RESTRICT,
  CONSTRAINT fk_transfer_destination FOREIGN KEY (id_wallet_destination) REFERENCES portefeuilles(id_wallet) ON DELETE RESTRICT,
  INDEX idx_transfer_user_date (id_user, date_transfert),
  INDEX idx_transfer_source (id_wallet_source),
  INDEX idx_transfer_destination (id_wallet_destination)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS budgets (
  id_budget BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_user BIGINT UNSIGNED NOT NULL,
  id_categorie BIGINT UNSIGNED NULL,
  nom VARCHAR(120) NOT NULL,
  montant_limite DECIMAL(15,2) NOT NULL,
  seuil_alerte TINYINT UNSIGNED NOT NULL DEFAULT 80,
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_budget_amount CHECK (montant_limite > 0),
  CONSTRAINT chk_budget_period CHECK (periode_fin >= periode_debut),
  CONSTRAINT fk_budget_user FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
  CONSTRAINT fk_budget_category FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie) ON DELETE SET NULL,
  INDEX idx_budget_user_period (id_user, periode_debut, periode_fin)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS objectifs_epargne (
  id_objectif BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_user BIGINT UNSIGNED NOT NULL,
  nom VARCHAR(150) NOT NULL,
  montant_cible DECIMAL(15,2) NOT NULL,
  date_limite DATE NULL,
  statut ENUM('EN_COURS','ATTEINT','ABANDONNE') NOT NULL DEFAULT 'EN_COURS',
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_saving_target CHECK (montant_cible > 0),
  CONSTRAINT fk_goal_user FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
  INDEX idx_goal_user (id_user)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contributions (
  id_contribution BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_objectif BIGINT UNSIGNED NOT NULL,
  montant DECIMAL(15,2) NOT NULL,
  description VARCHAR(255) NULL,
  date_contribution DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_contribution_amount CHECK (montant > 0),
  CONSTRAINT fk_contribution_goal FOREIGN KEY (id_objectif) REFERENCES objectifs_epargne(id_objectif) ON DELETE CASCADE,
  INDEX idx_contribution_goal_date (id_objectif, date_contribution)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dettes (
  id_dette BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_user BIGINT UNSIGNED NOT NULL,
  personne VARCHAR(150) NOT NULL,
  type_dette ENUM('OWED','LENT') NOT NULL COMMENT 'OWED: je dois payer; LENT: on me doit',
  montant_initial DECIMAL(15,2) NOT NULL,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_echeance DATE NULL,
  statut ENUM('EN_COURS','REGLEE','ANNULEE') NOT NULL DEFAULT 'EN_COURS',
  CONSTRAINT chk_debt_amount CHECK (montant_initial > 0),
  CONSTRAINT fk_debt_user FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user) ON DELETE CASCADE,
  INDEX idx_debt_user (id_user)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS remboursements (
  id_remboursement BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_dette BIGINT UNSIGNED NOT NULL,
  montant DECIMAL(15,2) NOT NULL,
  description VARCHAR(255) NULL,
  date_remboursement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_repayment_amount CHECK (montant > 0),
  CONSTRAINT fk_repayment_debt FOREIGN KEY (id_dette) REFERENCES dettes(id_dette) ON DELETE CASCADE,
  INDEX idx_repayment_debt (id_dette)
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (id_user, nom, type_categorie, description) VALUES
(NULL,'Alimentation','DEPENSE','Courses et repas'),
(NULL,'Transport','DEPENSE','Taxi, bus et carburant'),
(NULL,'Factures','DEPENSE','Internet, eau, électricité'),
(NULL,'Loisirs','DEPENSE','Sorties et divertissement'),
(NULL,'Santé','DEPENSE','Soins et pharmacie'),
(NULL,'Logement','DEPENSE','Loyer et entretien'),
(NULL,'Travail','REVENU','Salaire et missions'),
(NULL,'Autres revenus','REVENU','Autres entrées d’argent'),
(NULL,'Autres dépenses','DEPENSE','Dépenses diverses');
