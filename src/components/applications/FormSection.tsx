import React from 'react';

interface FormSectionProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * FormSection - Visual grouping component for form fields
 * Provides consistent spacing and visual hierarchy
 */
export function FormSection({ label, description, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-2">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
          {label}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
