import React from 'react';

interface TwoColumnRowProps {
  children: React.ReactNode;
}

/**
 * TwoColumnRow - Responsive grid wrapper for side-by-side form fields
 * Stacks on mobile (< md breakpoint), two columns on desktop
 */
export function TwoColumnRow({ children }: TwoColumnRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  );
}
