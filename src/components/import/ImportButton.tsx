"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const ImportWizardDialog = dynamic(
  () =>
    import("@/components/import/ImportWizardDialog").then((mod) => ({
      default: mod.ImportWizardDialog,
    })),
  { loading: () => null, ssr: false },
);

interface ImportButtonProps {
  onSuccess?: () => void;
}

export function ImportButton({ onSuccess }: ImportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="hidden sm:flex w-auto"
        onClick={() => setOpen(true)}
      >
        <Upload className="h-5 w-5 mr-2" />
        Import
      </Button>

      {open && (
        <ImportWizardDialog
          open={open}
          onOpenChange={setOpen}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
