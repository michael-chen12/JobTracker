import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface ApplicationRow {
  id: string;
  company: string;
  position: string;
  status: string;
  location: string | null;
  applied_date: string | null;
  created_at: string;
  updated_at: string;
}

export const columns: ColumnDef<ApplicationRow>[] = [
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
    cell: ({ row }) => (
      <div className="font-medium text-gray-900 dark:text-white">
        {row.getValue('company')}
      </div>
    ),
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
    cell: ({ row }) => (
      <div className="text-gray-900 dark:text-white">{row.getValue('position')}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'location',
    header: 'Location',
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
