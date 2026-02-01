'use client';

import { useState } from 'react';
import type { Contact } from '@/types/contacts';
import { ContactSelectorDialog } from './ContactSelectorDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Linkedin, UserPlus, X } from 'lucide-react';
import { unlinkContactFromApplication } from '@/actions/contacts';
import { useToast } from '@/hooks/use-toast';

interface ContactLinkingSectionProps {
  applicationId: string;
  referralContact: Contact | null;
  onContactLinked: () => void;
}

export function ContactLinkingSection({
  applicationId,
  referralContact,
  onContactLinked,
}: ContactLinkingSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { toast } = useToast();

  const handleUnlink = async () => {
    if (!confirm('Remove this contact link?')) return;

    setIsUnlinking(true);
    const result = await unlinkContactFromApplication(applicationId);

    if (result.success) {
      toast({ title: 'Contact unlinked' });
      onContactLinked();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    }
    setIsUnlinking(false);
  };

  const handleContactSelected = () => {
    setIsDialogOpen(false);
    onContactLinked();
    toast({ title: 'Contact linked successfully' });
  };

  return (
    <div className="rounded-lg border bg-card p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Referral Contact</h3>
        {!referralContact && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Link Contact
          </Button>
        )}
      </div>

      {referralContact ? (
        <div className="space-y-4">
          {/* Contact Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{referralContact.name}</h4>
                {referralContact.contact_type && (
                  <Badge variant="secondary" className="text-xs">
                    {referralContact.contact_type.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              {referralContact.company && (
                <p className="text-sm text-muted-foreground">
                  {referralContact.position
                    ? `${referralContact.position} at ${referralContact.company}`
                    : referralContact.company}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnlink}
              disabled={isUnlinking}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {referralContact.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${referralContact.email}`}>
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </a>
              </Button>
            )}
            {referralContact.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${referralContact.phone}`}>
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </a>
              </Button>
            )}
            {referralContact.linkedin_url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={referralContact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-3 w-3 mr-1" />
                  LinkedIn
                </a>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-3">
            <UserPlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            No referral contact linked yet
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            Link Contact
          </Button>
        </div>
      )}

      <ContactSelectorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        applicationId={applicationId}
        onContactSelected={handleContactSelected}
      />
    </div>
  );
}
