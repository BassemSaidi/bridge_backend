-- Migration script to add nb_box column to Colis table
-- Run this script on existing databases to add the new column

ALTER TABLE Colis 
ADD COLUMN nb_box INT DEFAULT 1 AFTER KgCo;

-- Optional: Add index for better performance
CREATE INDEX idx_nb_box ON Colis(nb_box);

-- Update existing records to have nb_box = 1 as default
UPDATE Colis SET nb_box = 1 WHERE nb_box IS NULL;
