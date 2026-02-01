import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyContactsStateProps {
  onAddContact: () => void;
}

export function EmptyContactsState({ onAddContact }: EmptyContactsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Users className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        Start building your professional network by adding recruiters, hiring managers, and referrals
      </p>
      <Button onClick={onAddContact}>
        <Users className="h-4 w-4 mr-2" />
        Add Your First Contact
      </Button>
    </div>
  );
}
