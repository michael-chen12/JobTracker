'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadResume, deleteResume } from '@/actions/resumes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, FileText, X } from 'lucide-react';

interface ResumeUploadProps {
  currentResumeUrl: string | null;
}

export function ResumeUpload({ currentResumeUrl }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(currentResumeUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size on client
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or DOCX file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'File must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadResume(formData);

    if (result.success) {
      setResumeUrl(result.data.url);
      toast({
        title: 'Resume uploaded',
        description: `${result.data.fileName} uploaded successfully`,
      });
    } else {
      toast({
        title: 'Upload failed',
        description: result.error,
        variant: 'destructive',
      });
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteResume();

    if (result.success) {
      setResumeUrl(null);
      toast({
        title: 'Resume deleted',
        description: 'Your resume has been removed',
      });
    } else {
      toast({
        title: 'Delete failed',
        description: result.error,
        variant: 'destructive',
      });
    }

    setDeleting(false);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload resume"
      />

      {resumeUrl ? (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">Current Resume</p>
              <p className="text-sm text-gray-500">Uploaded successfully</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Replace
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={deleting}>
                  <X className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete your resume? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Upload Resume</h3>
          <p className="mt-2 text-sm text-gray-500">
            PDF or DOCX format, max 5MB
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4"
          >
            {uploading ? 'Uploading...' : 'Select File'}
          </Button>
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
          Uploading...
        </div>
      )}
    </div>
  );
}
