DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'documents'
      AND a.attname = 'embedding'
      AND pg_catalog.format_type(a.atttypid, a.atttypmod) <> 'vector(2560)'
      AND NOT a.attisdropped
  ) THEN
    ALTER TABLE "documents"
    ALTER COLUMN "embedding" TYPE vector(2560)
    USING "embedding"::vector(2560);
  END IF;
END $$;
