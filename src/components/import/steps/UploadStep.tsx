"use client";

import { useRef, useState } from "react";
import { Upload, Eye, EyeOff, FileText, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ImportSource } from "@/types/application";
import { IMPORT_MAX_FILE_SIZE } from "@/schemas/application";

interface UploadStepProps {
  source: ImportSource;
  onCsvFile: (file: File) => void;
  onGreenhouseSubmit: (apiKey: string, companyName: string) => void;
  isLoading: boolean;
  error: string | null;
}

function CsvUpload({
  onFile,
  isLoading,
  error,
  source,
}: {
  onFile: (f: File) => void;
  isLoading: boolean;
  error: string | null;
  source: ImportSource;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File) {
    setSelectedFile(file);
    onFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const hints: Record<string, string> = {
    linkedin:
      "Upload the \"Easy Apply Applications.csv\" file from your LinkedIn data download.",
    indeed:
      "Upload the applications CSV from your Indeed data export.",
    generic_csv: "Upload any CSV file — you'll map columns in the next step.",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {hints[source] ?? "Upload a CSV file (max 5 MB)."}
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-lg border-2 border-dashed p-8 cursor-pointer
          transition-colors
          ${dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }
        `}
      >
        {selectedFile ? (
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="font-medium">{selectedFile.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="ml-1 text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Drop your CSV file here
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                or click to browse (max {IMPORT_MAX_FILE_SIZE / (1024 * 1024)}MB)
              </p>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button
        className="w-full"
        disabled={!selectedFile || isLoading}
        onClick={() => selectedFile && onFile(selectedFile)}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Parsing file…
          </>
        ) : (
          "Preview Import"
        )}
      </Button>
    </div>
  );
}

function GreenhouseForm({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (apiKey: string, companyName: string) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [apiKey, setApiKey] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showKey, setShowKey] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (apiKey.trim() && companyName.trim()) {
      onSubmit(apiKey.trim(), companyName.trim());
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Enter your Greenhouse Harvest API key to import applications. The key is
        used for this import only and is never stored.
      </p>

      <div className="space-y-2">
        <Label htmlFor="gh-company">Your Company Name</Label>
        <Input
          id="gh-company"
          placeholder="e.g. Acme Corp"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="h-11 md:h-9"
          required
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Used as the company name for all imported applications.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gh-api-key">Greenhouse API Key</Label>
        <div className="relative">
          <Input
            id="gh-api-key"
            type={showKey ? "text" : "password"}
            placeholder="Enter your Harvest API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="h-11 md:h-9 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Find your API key in Greenhouse → Settings → Dev Center → API Credential Management.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!apiKey.trim() || !companyName.trim() || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Fetching from Greenhouse…
          </>
        ) : (
          "Preview Applications"
        )}
      </Button>
    </form>
  );
}

export function UploadStep({
  source,
  onCsvFile,
  onGreenhouseSubmit,
  isLoading,
  error,
}: UploadStepProps) {
  if (source === "greenhouse") {
    return (
      <GreenhouseForm
        onSubmit={onGreenhouseSubmit}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  return (
    <CsvUpload
      onFile={onCsvFile}
      isLoading={isLoading}
      error={error}
      source={source}
    />
  );
}
