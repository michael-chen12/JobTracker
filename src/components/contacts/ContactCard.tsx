'use client';

import type { ContactWithStats, ContactType } from '@/types/contacts';
import { ContactTypeBadge } from './ContactTypeBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Linkedin, Calendar, Trash2, Edit } from 'lucide-react';
import { deleteContact } from '@/actions/contacts';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ContactCardProps {
  contact: ContactWithStats;
  onUpdate: () => void;
  onDelete: () => void;
}

export function ContactCard({ contact, onUpdate, onDelete }: ContactCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm(`Delete ${contact.name}?`)) return;

    setIsDeleting(true);
    const result = await deleteContact(contact.id);

    if (result.success) {
      toast({ title: 'Contact deleted' });
      onDelete();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsDeleting(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{contact.name}</h3>
          {contact.company && (
            <p className="text-sm text-muted-foreground">{contact.company}</p>
          )}
          {contact.position && (
            <p className="text-sm text-muted-foreground">{contact.position}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ContactTypeBadge type={contact.contact_type as ContactType | null} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Contact Methods */}
        <div className="flex flex-wrap gap-2">
          {contact.email && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={`mailto:${contact.email}`}>
                <Mail className="h-3 w-3 mr-1" />
                Email
              </a>
            </Button>
          )}
          {contact.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${contact.phone}`}>
                <Phone className="h-3 w-3 mr-1" />
                Call
              </a>
            </Button>
          )}
          {contact.linkedin_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-3 w-3 mr-1" />
                LinkedIn
              </a>
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{contact.interaction_count} interactions</span>
          <span>{contact.applications_count} applications</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
