-- Add image support to messages
-- image_url: URL to the uploaded image in storage

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS image_url text;

-- Comment for documentation
COMMENT ON COLUMN messages.image_url IS 'URL to an image attachment in the message';
