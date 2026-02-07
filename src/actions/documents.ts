'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ApplicationDocument } from '@/types/application';
import {
  uploadDocumentSchema,
  DOCUMENT_MAX_FILE_SIZE,
  DOCUMENT_MAX_TOTAL_SIZE,
  DOCUMENT_ACCEPTED_MIME_TYPES,
} from '@/schemas/application';

// --- Return types (discriminated unions, matching project pattern) ---

type UploadDocumentResult =
  | {
      success: true;
      data: { id: string; fileName: string; fileSize: number; storagePath: string };
    }
  | { success: false; error: string };

type DeleteDocumentResult = { success: true } | { success: false; error: string };

type GetDocumentUrlResult =
  | { success: true; data: { signedUrl: string } }
  | { success: false; error: string };

type ListDocumentsResult =
  | { success: true; data: { documents: ApplicationDocument[]; totalSize: number } }
  | { success: false; error: string };

// --- Helper: Get authenticated user ---

async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { authUser: null, dbUser: null };
  }

  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (userError || !dbUser) {
    return { authUser, dbUser: null };
  }

  return { authUser, dbUser };
}

// --- Actions ---

export async function uploadDocument(formData: FormData): Promise<UploadDocumentResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Extract form data
    const file = formData.get('file') as File;
    const applicationId = formData.get('application_id') as string;
    const documentType = formData.get('document_type') as string;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate metadata with Zod
    const parsed = uploadDocumentSchema.safeParse({
      application_id: applicationId,
      document_type: documentType,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    // Validate file MIME type
    if (
      !DOCUMENT_ACCEPTED_MIME_TYPES.includes(
        file.type as (typeof DOCUMENT_ACCEPTED_MIME_TYPES)[number]
      )
    ) {
      return {
        success: false,
        error: 'File must be PDF, DOCX, TXT, JPEG, or PNG format',
      };
    }

    // Validate file size (10MB per file)
    if (file.size > DOCUMENT_MAX_FILE_SIZE) {
      return { success: false, error: 'File size must be less than 10MB' };
    }

    // Verify application ownership (RLS handles this, but explicit check)
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', parsed.data.application_id)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Application not found' };
    }

    // Check total size limit (50MB per application)
    const { data: existingDocs, error: docsError } = await supabase
      .from('application_documents')
      .select('file_size')
      .eq('application_id', parsed.data.application_id);

    if (docsError) {
      console.error('Failed to check existing documents:', docsError);
      return { success: false, error: 'Failed to check storage usage' };
    }

    const currentTotalSize = (existingDocs ?? []).reduce(
      (sum, doc) => sum + (doc.file_size ?? 0),
      0
    );

    if (currentTotalSize + file.size > DOCUMENT_MAX_TOTAL_SIZE) {
      return {
        success: false,
        error: `Storage limit exceeded. ${((DOCUMENT_MAX_TOTAL_SIZE - currentTotalSize) / (1024 * 1024)).toFixed(1)}MB remaining of 50MB`,
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedName}`;
    const storagePath = `${authUser.id}/applications/${parsed.data.application_id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: 'Failed to upload file' };
    }

    // Insert metadata into application_documents table
    const { data: docRecord, error: insertError } = await supabase
      .from('application_documents')
      .insert({
        application_id: parsed.data.application_id,
        document_type: parsed.data.document_type,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select('id')
      .single();

    if (insertError || !docRecord) {
      console.error('Metadata insert error:', insertError);
      // Rollback: delete uploaded file
      await supabase.storage.from('documents').remove([storagePath]);
      return { success: false, error: 'Failed to save document metadata' };
    }

    revalidatePath(`/dashboard/applications/${parsed.data.application_id}`);

    return {
      success: true,
      data: {
        id: docRecord.id,
        fileName: file.name,
        fileSize: file.size,
        storagePath,
      },
    };
  } catch (error) {
    console.error('Unexpected error in uploadDocument:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteDocument(
  documentId: string,
  applicationId: string
): Promise<DeleteDocumentResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch document metadata (RLS ensures ownership through application join)
    const { data: document, error: fetchError } = await supabase
      .from('application_documents')
      .select('id, storage_path, application_id')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return { success: false, error: 'Document not found' };
    }

    // Verify application ownership
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', document.application_id)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Unauthorized access' };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      return { success: false, error: 'Failed to delete file from storage' };
    }

    // Delete metadata row
    const { error: deleteError } = await supabase
      .from('application_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Metadata delete error:', deleteError);
      return { success: false, error: 'Failed to delete document record' };
    }

    revalidatePath(`/dashboard/applications/${applicationId}`);

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteDocument:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getDocumentUrl(documentId: string): Promise<GetDocumentUrlResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch document metadata
    const { data: document, error: fetchError } = await supabase
      .from('application_documents')
      .select('id, storage_path, application_id')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return { success: false, error: 'Document not found' };
    }

    // Verify application ownership
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', document.application_id)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Unauthorized access' };
    }

    // Generate signed URL (1-hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.storage_path, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Signed URL error:', signedUrlError);
      return { success: false, error: 'Failed to generate download URL' };
    }

    return {
      success: true,
      data: { signedUrl: signedUrlData.signedUrl },
    };
  } catch (error) {
    console.error('Unexpected error in getDocumentUrl:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function listDocuments(applicationId: string): Promise<ListDocumentsResult> {
  try {
    const supabase = await createClient();
    const { authUser, dbUser } = await getAuthenticatedUser(supabase);

    if (!authUser || !dbUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify application ownership
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', dbUser.id)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Application not found' };
    }

    // Fetch all documents for this application
    const { data: documents, error: docsError } = await supabase
      .from('application_documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('List documents error:', docsError);
      return { success: false, error: 'Failed to fetch documents' };
    }

    const totalSize = (documents ?? []).reduce(
      (sum, doc) => sum + (doc.file_size ?? 0),
      0
    );

    return {
      success: true,
      data: {
        documents: documents ?? [],
        totalSize,
      },
    };
  } catch (error) {
    console.error('Unexpected error in listDocuments:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
