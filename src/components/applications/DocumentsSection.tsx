'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ApplicationDocument, DocumentType } from '@/types/application';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Loader2,
  File,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadDocument, deleteDocument, getDocumentUrl } from '@/actions/documents';
import {
  DOCUMENT_MAX_FILE_SIZE,
  DOCUMENT_MAX_TOTAL_SIZE,
  DOCUMENT_ACCEPTED_MIME_TYPES,
  DOCUMENT_ACCEPTED_EXTENSIONS,
  DOCUMENT_TYPE_LABELS,
} from '@/schemas/application';
import { formatFileSize, formatRelativeTime, truncate } from '@/lib/utils/formatters';

interface DocumentsSectionProps {
  applicationId: string;
  documents: ApplicationDocument[];
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-5 w-5 text-gray-400" />;
  if (mimeType.startsWith('image/'))
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (mimeType === 'application/pdf')
    return <FileText className="h-5 w-5 text-red-500" />;
  if (mimeType.includes('wordprocessingml'))
    return <FileText className="h-5 w-5 text-blue-600" />;
  if (mimeType === 'text/plain')
    return <FileText className="h-5 w-5 text-gray-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
}

function canPreview(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return mimeType === 'application/pdf' || mimeType.startsWith('image/');
}

function getStorageUsageColor(percentage: number): string {
  if (percentage >= 95) return 'bg-red-500';
  if (percentage >= 80) return 'bg-yellow-500';
  return '';
}

export function DocumentsSection({ applicationId, documents }: DocumentsSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState<DocumentType>('other');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApplicationDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size ?? 0), 0);
  const usagePercentage = (totalSize / DOCUMENT_MAX_TOTAL_SIZE) * 100;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so same file can be selected again
    e.target.value = '';

    // Client-side validation
    if (
      !DOCUMENT_ACCEPTED_MIME_TYPES.includes(
        file.type as (typeof DOCUMENT_ACCEPTED_MIME_TYPES)[number]
      )
    ) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Accepted formats: PDF, DOCX, TXT, JPEG, PNG',
      });
      return;
    }

    if (file.size > DOCUMENT_MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Maximum file size is 10MB',
      });
      return;
    }

    if (totalSize + file.size > DOCUMENT_MAX_TOTAL_SIZE) {
      toast({
        variant: 'destructive',
        title: 'Storage Limit',
        description: `Maximum 50MB total per application. ${formatFileSize(DOCUMENT_MAX_TOTAL_SIZE - totalSize)} remaining.`,
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('application_id', applicationId);
      formData.append('document_type', selectedType);

      const result = await uploadDocument(formData);

      if (result.success) {
        toast({
          title: 'Document Uploaded',
          description: `${result.data.fileName} uploaded successfully`,
        });
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await deleteDocument(deleteTarget.id, applicationId);

      if (result.success) {
        toast({
          title: 'Document Deleted',
          description: 'Document has been removed',
        });
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = async (doc: ApplicationDocument) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setIsLoadingPreview(true);

    try {
      const result = await getDocumentUrl(doc.id);
      if (result.success) {
        setPreviewUrl(result.data.signedUrl);
      } else {
        toast({
          variant: 'destructive',
          title: 'Preview Failed',
          description: result.error,
        });
        setPreviewDoc(null);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        variant: 'destructive',
        title: 'Preview Failed',
        description: 'An unexpected error occurred',
      });
      setPreviewDoc(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDownload = async (doc: ApplicationDocument) => {
    setIsDownloading(doc.id);
    try {
      const result = await getDocumentUrl(doc.id);
      if (result.success) {
        window.open(result.data.signedUrl, '_blank');
      } else {
        toast({
          variant: 'destructive',
          title: 'Download Failed',
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsDownloading(null);
    }
  };

  // Sort documents by most recent first
  const sortedDocuments = [...documents].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({documents.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedType}
              onValueChange={(val) => setSelectedType(val as DocumentType)}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleUploadClick}
              size="sm"
              variant="outline"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={DOCUMENT_ACCEPTED_EXTENSIONS}
          onChange={handleFileSelected}
          className="hidden"
          aria-label="Upload document"
        />

        {/* Storage usage bar */}
        {documents.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Storage used</span>
              <span>
                {formatFileSize(totalSize)} / {formatFileSize(DOCUMENT_MAX_TOTAL_SIZE)}
              </span>
            </div>
            <Progress
              value={usagePercentage}
              className={`h-1.5 ${getStorageUsageColor(usagePercentage)}`}
            />
          </div>
        )}

        {/* Document list or empty state */}
        {sortedDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents yet</p>
            <p className="text-sm mt-1">
              Upload cover letters, portfolios, and other documents
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <TooltipProvider>
              {sortedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  {/* File icon + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc.mime_type)}
                    <div className="min-w-0 flex-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {doc.file_name}
                          </p>
                        </TooltipTrigger>
                        {doc.file_name.length > 30 && (
                          <TooltipContent>
                            <p>{doc.file_name}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>&middot;</span>
                        <span>{formatRelativeTime(doc.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Type badge + actions */}
                  <div className="flex items-center gap-2 ml-8 sm:ml-0">
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownload(doc)}
                            disabled={isDownloading === doc.id}
                            aria-label={`Download ${doc.file_name}`}
                          >
                            {isDownloading === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>

                      {canPreview(doc.mime_type) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handlePreview(doc)}
                              aria-label={`Preview ${doc.file_name}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            onClick={() => setDeleteTarget(doc)}
                            aria-label={`Delete ${doc.file_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.file_name
                ? truncate(deleteTarget.file_name, 40)
                : ''}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview dialog */}
      <Dialog
        open={!!previewDoc}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewDoc(null);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {previewDoc?.file_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 relative">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : previewUrl ? (
              previewDoc?.mime_type?.startsWith('image/') ? (
                <div className="flex items-center justify-center h-full overflow-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={previewDoc.file_name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded border border-gray-200 dark:border-gray-700"
                  title={`Preview: ${previewDoc?.file_name}`}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Failed to load preview
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Skeleton loading state for DocumentsSection */
export function DocumentsSectionSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
