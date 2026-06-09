-- Add status column to Colis table for package request workflow
ALTER TABLE Colis 
ADD COLUMN status ENUM('demande', 'accepted', 'refused') DEFAULT 'accepted' AFTER payementStatus;

-- Add index for status filtering
ALTER TABLE Colis ADD INDEX idx_status (status);
