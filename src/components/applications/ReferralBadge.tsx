'use client';

import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReferralBadgeProps {
  contactId?: string;
  size?: 'sm' | 'md';
  className?: string;
}

interface ReferralBadgeFrameProps extends ReferralBadgeProps {
  ariaLabel: string;
  children: React.ReactNode;
}

interface ReferralContactBadgeProps extends ReferralBadgeProps {
  contactName: string;
}

function ReferralBadgeFrame({
  contactId,
  size = 'sm',
  className,
  ariaLabel,
  children,
}: ReferralBadgeFrameProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contactId) {
      router.push(`/dashboard/contacts/${contactId}`);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-teal-100 text-teal-800 border-teal-200',
        'dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
        'hover:bg-teal-200 dark:hover:bg-teal-800',
        'cursor-pointer transition-colors active:scale-95',
        sizeClasses[size],
        className
      )}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
    >
      {children}
    </Badge>
  );
}

export function ReferralBadge({
  contactId,
  size = 'sm',
  className,
}: ReferralBadgeProps) {
  return (
    <ReferralBadgeFrame
      contactId={contactId}
      size={size}
      className={className}
      ariaLabel="Referral. Click to view contact details."
    >
      <Users className="h-3 w-3 mr-1" />
      <span>Referral</span>
    </ReferralBadgeFrame>
  );
}

export function ReferralContactBadge({
  contactName,
  contactId,
  size = 'sm',
  className,
}: ReferralContactBadgeProps) {
  return (
    <ReferralBadgeFrame
      contactId={contactId}
      size={size}
      className={className}
      ariaLabel={`Referral from ${contactName}. Click to view contact details.`}
    >
      <Users className="h-3 w-3 mr-1" />
      <span className="sm:hidden">Referral</span>
      <span className="hidden sm:inline truncate max-w-[120px]">
        {contactName}
      </span>
    </ReferralBadgeFrame>
  );
}
