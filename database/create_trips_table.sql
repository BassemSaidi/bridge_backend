-- Create trips table
CREATE TABLE trips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT NOT NULL,
  PaysD VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  villePD JSON,
  PaysF VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  villePF JSON,
  DateD DATE NOT NULL,
  DateF DATE NOT NULL,
  status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'a arriver',
  codeT VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  maxWeight DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (account_id) REFERENCES Account(id) ON DELETE CASCADE,
  INDEX idx_account_id (account_id),
  INDEX idx_status (status),
  INDEX idx_codeT (codeT)
);
