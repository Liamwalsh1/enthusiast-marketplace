-- Add blur_data_urls column to listings table for image placeholders
-- These are tiny base64-encoded images used for blur-up loading effect

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS blur_data_urls TEXT[];

COMMENT ON COLUMN listings.blur_data_urls IS 'Array of base64 data URLs for blur placeholders, corresponding to image_urls';
