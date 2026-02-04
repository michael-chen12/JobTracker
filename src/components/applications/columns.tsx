import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from './StatusBadge';
import { MatchScoreBadge } from './MatchScoreBadge';
import { ReferralBadge } from './ReferralBadge';

export interface ApplicationRow {
  id: string;
  company: string;
  position: string;
  status: string;
  location: string | null;
  applied_date: string | null;
  created_at: string;
  updated_at: string;
  match_score: number | null;
  match_analysis: any | null;
  analyzed_at: string | null;
  job_description: string | null;
  job_url: string | null;
  referral_contact_id: string | null;
  referral_contact_name?: string | null;
}

type ColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const hideOnSm: ColumnMeta = {
  headerClassName: 'hidden sm:table-cell',
  cellClassName: 'hidden sm:table-cell',
};

const hideOnMd: ColumnMeta = {
  headerClassName: 'hidden md:table-cell',
  cellClassName: 'hidden md:table-cell',
};

const hideOnLg: ColumnMeta = {
  headerClassName: 'hidden lg:table-cell',
  cellClassName: 'hidden lg:table-cell',
};

export const columns: ColumnDef<ApplicationRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'company',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Company
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const company = row.getValue('company') as string;
      const position = row.getValue('position') as string;
      const location = row.getValue('location') as string | null;
      return (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {company}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:hidden truncate">
            {position}
            {location ? ` • ${location}` : ''}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'position',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Position
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    meta: hideOnSm,
    cell: ({ row }) => (
      <div className="text-gray-900 dark:text-white truncate">
        {row.getValue('position')}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'match_score',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Match
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    meta: hideOnLg,
    cell: ({ row }) => {
      const matchScore = row.getValue('match_score') as number | null;
      const hasJobInfo = row.original.job_description || row.original.job_url;

      if (!matchScore && !hasJobInfo) {
        return <div className="text-sm text-gray-400 dark:text-gray-600">—</div>;
      }

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <MatchScoreBadge
            applicationId={row.original.id}
            matchScore={matchScore}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'referral_contact_id',
    header: 'Referral',
    meta: hideOnLg,
    cell: ({ row }) => {
      const referralContactId = row.getValue('referral_contact_id') as string | null;
      const referralContactName = row.original.referral_contact_name;

      if (!referralContactId) {
        return <div className="text-sm text-gray-400 dark:text-gray-600">—</div>;
      }

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <ReferralBadge
            contactId={referralContactId}
            contactName={referralContactName || undefined}
            size="md"
            showContactName={true}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    meta: hideOnMd,
    cell: ({ row }) => {
      const location = row.getValue('location') as string | null;
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {location || '—'}
        </div>
      );
    },
  },
  {
    accessorKey: 'applied_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Applied Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    meta: hideOnMd,
    cell: ({ row }) => {
      const date = row.getValue('applied_date') as string | null;
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {date ? new Date(date).toLocaleDateString() : '—'}
        </div>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Last Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    meta: hideOnLg,
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {new Date(date).toLocaleDateString()}
        </div>
      );
    },
  },
];
