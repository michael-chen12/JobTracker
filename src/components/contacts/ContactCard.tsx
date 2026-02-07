'use client';

import React, { useCallback } from 'react';
import type { ContactWithStats, ContactType } from '@/types/contacts';
import { ContactTypeBadge } from './ContactTypeBadge';
import { RelationshipStrengthBadge } from './RelationshipStrengthBadge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Linkedin, Trash2, Eye } from 'lucide-react';
import { deleteContact } from '@/actions/contacts';
import { useOptimisticAction } from '@/hooks/useOptimisticAction';
import { compareContacts } from '@/lib/utils/memo-utils';
import Link from 'next/link';

interface ContactCardProps {
  contact: ContactWithStats;
  onUpdate: () => void;
  onDelete: () => void;
}

/**
 * ContactCard - Display component for a contact
 *
 * Optimizations applied:
 * - React.memo with custom comparison (only re-renders when contact data changes)
 * - useOptimisticAction for delete with automatic rollback
 * - Stable callbacks with useCallback
 * - No data fetching (relationship strength passed as prop)
 *
 * Following Vercel React best practices:
 * - Memoized with custom comparator
 * - Optimistic updates with rollback
 * - No useEffect for data fetching
 */
function ContactCardComponent({ contact, onUpdate, onDelete }: ContactCardProps) {
  // Optimistic delete with automatic rollback
  const { execute: handleDelete, isPending: isDeleting } = useOptimisticAction({
    action: async (id: string) => {
      return await deleteContact(id);
    },
    successMessage: 'Contact deleted',
    refreshOnSuccess: false, // Parent handles refresh via onDelete
  });

  // Stable callback reference
  const onDeleteClick = useCallback(async () => {
    if (!confirm(`Delete ${contact.name}?`)) return;

    const result = await handleDelete(contact.id);
    if (result.success) {
      onDelete();
    }
  }, [contact.id, contact.name, handleDelete, onDelete]);

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
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span>{contact.interaction_count} interactions</span>
          <span>{contact.applications_count} applications</span>
          {/* Relationship strength badge - data fetched by parent (optional) */}
          {contact.relationship_strength !== undefined && (
            <RelationshipStrengthBadge
              strengthData={{
                strength: contact.relationship_strength,
                recentInteractionCount: contact.interaction_count,
              }}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Link href={`/dashboard/contacts/${contact.id}`} className="flex-1">
            <Button variant="default" size="sm" className="w-full">
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteClick}
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

/**
 * Memoized ContactCard - only re-renders when contact data changes
 * Uses custom comparison function from memo-utils
 */
export const ContactCard = React.memo(ContactCardComponent, compareContacts);
