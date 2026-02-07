-- Migration: Setup pg_cron for account deletion processing
-- Ticket #26: Export & GDPR Compliance

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the function that processes pending deletions
CREATE OR REPLACE FUNCTION process_pending_account_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deletion_record RECORD;
  auth_id_to_delete UUID;
BEGIN
  FOR deletion_record IN
    SELECT adr.id, adr.user_id
    FROM account_deletion_requests adr
    WHERE adr.status = 'pending'
      AND adr.scheduled_deletion_at <= NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      -- Mark as processing
      UPDATE account_deletion_requests
      SET status = 'processing'
      WHERE id = deletion_record.id;

      -- Get the auth_id before cascade delete
      SELECT auth_id INTO auth_id_to_delete
      FROM users
      WHERE id = deletion_record.user_id;

      IF auth_id_to_delete IS NULL THEN
        -- User already deleted, clean up orphan request
        DELETE FROM account_deletion_requests WHERE id = deletion_record.id;
        CONTINUE;
      END IF;

      -- Delete storage objects from all buckets
      DELETE FROM storage.objects
      WHERE bucket_id IN ('resumes', 'documents', 'data-exports')
        AND (storage.foldername(name))[1] = auth_id_to_delete::text;

      -- Delete the users row (CASCADE handles all child tables including account_deletion_requests)
      DELETE FROM users WHERE id = deletion_record.user_id;

      -- Delete the auth account
      DELETE FROM auth.users WHERE id = auth_id_to_delete;

    EXCEPTION WHEN OTHERS THEN
      -- On failure, revert to pending for retry
      UPDATE account_deletion_requests
      SET status = 'pending'
      WHERE id = deletion_record.id;
      RAISE WARNING 'Failed to process deletion for user %: %', deletion_record.user_id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Schedule the cron job: runs every hour
SELECT cron.schedule(
  'process-account-deletions',
  '0 * * * *',
  $$SELECT process_pending_account_deletions()$$
);
