-- Add 'correspondence' to the document_type CHECK constraint on application_documents
-- The original constraint was inline (unnamed), so Postgres auto-generated the name
ALTER TABLE application_documents
  DROP CONSTRAINT IF EXISTS application_documents_document_type_check;

ALTER TABLE application_documents
  ADD CONSTRAINT application_documents_document_type_check
  CHECK (document_type IN (
    'resume', 'cover_letter', 'portfolio', 'transcript', 'correspondence', 'other'
  ));
