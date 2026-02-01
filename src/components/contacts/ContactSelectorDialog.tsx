'use client';

import { useState, useEffect, useCallback } from 'react';
import { getContacts, linkContactToApplication } from '@/actions/contacts';
import type { ContactWithStats, ContactType } from '@/types/contacts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContactTypeBadge } from './ContactTypeBadge';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContactSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onContactSelected: () => void;
}

export function ContactSelectorDialog({
  open,
  onOpenChange,
  applicationId,
  onContactSelected,
}: ContactSelectorDialogProps) {
  const [contacts, setContacts] = useState<ContactWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    const filters = searchQuery ? { search: searchQuery } : {};
    const result = await getContacts(filters, { field: 'name', order: 'asc' }, 50, 0);

    if (result.success && result.contacts) {
      setContacts(result.contacts);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to load contacts',
      });
    }
    setIsLoading(false);
  }, [searchQuery, toast]);

  useEffect(() => {
    if (open) {
      loadContacts();
    }
  }, [open, loadContacts]);

  const handleSelectContact = async (contactId: string) => {
    setIsLinking(true);
    const result = await linkContactToApplication({
      applicationId,
      contactId,
    });

    if (result.success) {
      onContactSelected();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsLinking(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Referral Contact</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Contact List */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? `No contacts found matching "${searchQuery}"` : 'No contacts available'}
              </div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.id)}
                  disabled={isLinking}
                  className="w-full text-left p-4 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contact.name}</span>
                        <ContactTypeBadge type={contact.contact_type as ContactType | null} />
                      </div>
                      {(contact.company || contact.position) && (
                        <p className="text-sm text-muted-foreground">
                          {contact.position && contact.company
                            ? `${contact.position} at ${contact.company}`
                            : contact.position || contact.company}
                        </p>
                      )}
                      {contact.email && (
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
