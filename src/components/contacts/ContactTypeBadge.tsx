import { Badge } from '@/components/ui/badge';
import { Briefcase, UserCheck, Users, Phone, MoreHorizontal } from 'lucide-react';
import type { ContactType } from '@/types/contacts';

interface ContactTypeBadgeProps {
  type: ContactType | null;
  className?: string;
}

export function ContactTypeBadge({ type, className }: ContactTypeBadgeProps) {
  if (!type) return null;

  const configs = {
    recruiter: {
      label: 'Recruiter',
      icon: Briefcase,
      className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
    },
    hiring_manager: {
      label: 'Hiring Manager',
      icon: UserCheck,
      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
    },
    referral: {
      label: 'Referral',
      icon: Users,
      className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
    },
    colleague: {
      label: 'Colleague',
      icon: Phone,
      className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300',
    },
    other: {
      label: 'Other',
      icon: MoreHorizontal,
      className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} ${className || ''}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
