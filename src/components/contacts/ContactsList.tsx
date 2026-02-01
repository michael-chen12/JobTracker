'use client';

import { useEffect, useState, useCallback } from 'react';
import { getContacts } from '@/actions/contacts';
import type { ContactWithStats, ContactFilters, ContactSortOptions } from '@/types/contacts';
import { EmptyContactsState } from './EmptyContactsState';
import { ContactFormDialog } from './ContactFormDialog';
import { ContactCard } from './ContactCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * ContactsList - List view with search and filtering
 *
 * **Optimized for performance:**
 * - Stable callbacks with useCallback (prevents ContactCard re-renders)
 * - Memoized child components (ContactCard)
 * - Efficient state management
 */
export function ContactsList() {
  const [contacts, setContacts] = useState<ContactWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    const filters: ContactFilters = searchQuery ? { search: searchQuery } : {};
    const sortOptions: ContactSortOptions = { field: 'name', order: 'asc' };

    const result = await getContacts(filters, sortOptions, 50, 0);

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
    loadContacts();
  }, [loadContacts]);

  // Stable callbacks for ContactCard (prevents unnecessary re-renders)
  const handleContactCreated = useCallback(() => {
    setIsFormOpen(false);
    loadContacts();
    toast({
      title: 'Success',
      description: 'Contact created successfully',
    });
  }, [loadContacts, toast]);

  const handleOpenForm = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
  }, []);

  // Stable callback passed to each ContactCard
  // All cards share the same function reference (better performance)
  const handleUpdate = useCallback(() => {
    loadContacts();
  }, [loadContacts]);

  const handleDelete = useCallback(() => {
    loadContacts();
  }, [loadContacts]);

  if (isLoading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }

  if (contacts.length === 0 && !searchQuery) {
    return (
      <>
        <EmptyContactsState onAddContact={handleOpenForm} />
        <ContactFormDialog
          open={isFormOpen}
          onOpenChange={handleCloseForm}
          onSuccess={handleContactCreated}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleOpenForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Contact List */}
      {contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No contacts found matching &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="grid gap-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ContactFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        onSuccess={handleContactCreated}
      />
    </div>
  );
}
