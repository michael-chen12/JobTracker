'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { uploadResume, deleteResume } from '@/actions/resumes';
import { triggerResumeParsing, getParsingJobStatus } from '@/actions/parse-resume';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, FileText, X, Loader2, Sparkles } from 'lucide-react';

function ParsedResumeSkeleton() {
  return (
    <div className="mt-6 space-y-4" aria-label="Loading parsed resume data" aria-busy="true">
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Contact */}
      <div className="p-4 border rounded-lg space-y-3">
        <Skeleton className="h-5 w-44" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 border rounded-lg space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Skills */}
      <div className="p-4 border rounded-lg space-y-3">
        <Skeleton className="h-5 w-20" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="p-4 border rounded-lg space-y-4">
        <Skeleton className="h-5 w-36" />
        {[1, 2].map((i) => (
          <div key={i} className="pb-4 border-b last:border-b-0 space-y-2">
            <div className="flex justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ResumeUploadProps {
  currentResumeUrl: string | null;
  isParsed?: boolean;
}

type ParsingStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';

export function ResumeUpload({ currentResumeUrl, isParsed = false }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resumeUrl, setResumeUrl] = useState(currentResumeUrl);
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus>(
    isParsed ? 'completed' : 'idle'
  );
  const [parsingJobId, setParsingJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Poll for parsing job status
  useEffect(() => {
    if (!parsingJobId || parsingStatus === 'completed' || parsingStatus === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      const result = await getParsingJobStatus(parsingJobId);

      if (result.success) {
        setParsingStatus(result.data.status);

        if (result.data.status === 'completed') {
          toast({
            title: 'Resume parsed successfully',
            description: 'Your resume has been analyzed by AI',
          });
          setParsingJobId(null);
          // Refresh the page to show parsed resume data
          router.refresh();
        } else if (result.data.status === 'failed') {
          toast({
            title: 'Parsing failed',
            description: result.data.error || 'Failed to parse resume',
            variant: 'destructive',
          });
          setParsingJobId(null);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [parsingJobId, parsingStatus, toast, router]);

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

      // Trigger resume parsing
      setParsingStatus('pending');
      const parseResult = await triggerResumeParsing();

      if (parseResult.success) {
        setParsingJobId(parseResult.data.jobId);
        setParsingStatus('processing');
        toast({
          title: 'AI parsing started',
          description: 'Analyzing your resume...',
        });
      } else {
        setParsingStatus('failed');
        toast({
          title: 'Failed to start parsing',
          description: parseResult.error,
          variant: 'destructive',
        });
      }
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
      setParsingStatus('idle');
      setParsingJobId(null);
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

  const getParsingStatusDisplay = () => {
    switch (parsingStatus) {
      case 'pending':
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI is analyzing your resume...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Sparkles className="h-4 w-4" />
            <span>Resume parsed successfully</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <X className="h-4 w-4" />
            <span>Parsing failed</span>
          </div>
        );
      default:
        return null;
    }
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
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Current Resume</p>
                <p className="text-sm text-gray-500">Uploaded successfully</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(resumeUrl, '_blank')}
                disabled={!resumeUrl}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Resume
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || parsingStatus === 'processing'}
                className="w-full sm:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                Replace
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deleting || parsingStatus === 'processing'}
                    className="w-full sm:w-auto"
                  >
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
          {getParsingStatusDisplay()}
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

      {(parsingStatus === 'pending' || parsingStatus === 'processing') && (
        <ParsedResumeSkeleton />
      )}
    </div>
  );
}
