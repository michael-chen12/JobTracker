'use client';

import { FormSection } from '@/components/applications/FormSection';
import { ExportDataSection } from './ExportDataSection';
import { DeleteAccountSection } from './DeleteAccountSection';
import type { AccountDeletionRequest } from '@/types/application';

interface DataPrivacySectionProps {
  userEmail: string;
  initialDeletionRequest: AccountDeletionRequest | null;
}

export function DataPrivacySection({
  userEmail,
  initialDeletionRequest,
}: DataPrivacySectionProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <FormSection
        label="Export Your Data"
        description="Download a copy of all your data in JSON or CSV format"
      >
        <ExportDataSection />
      </FormSection>

      <FormSection
        label="Danger Zone"
        description="Irreversible actions that affect your account"
      >
        <DeleteAccountSection
          userEmail={userEmail}
          initialDeletionRequest={initialDeletionRequest}
        />
      </FormSection>
    </div>
  );
}
