/**
 * ContactDetail Component
 * Ticket #17: Interaction History Tracking
 *
 * Full page component for contact detail view
 * Displays contact info, relationship strength, stats, and interaction timeline
 */

'use client';

import { ArrowLeft, Mail, Phone, Linkedin, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContactTypeBadge } from './ContactTypeBadge';
import { RelationshipStrengthBadge } from './RelationshipStrengthBadge';
import { InteractionsSection } from './InteractionsSection';
import type { ContactWithDetails, ContactType } from '@/types/contacts';

interface ContactDetailProps {
  contact: ContactWithDetails;
}

export function ContactDetail({ contact }: ContactDetailProps) {
  const roleLine =
    contact.position && contact.company
      ? `${contact.position} at ${contact.company}`
      : contact.position || contact.company;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <Link href="/dashboard/contacts">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Button>
      </Link>

      {/* Header */}
      <div className="space-y-4">
        {/* Name & Relationship Strength */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {contact.name}
            </h1>
            {roleLine && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                {roleLine}
              </p>
            )}
          </div>
          <RelationshipStrengthBadge
            strengthData={contact.relationshipStrength}
          />
        </div>

        {/* Contact methods */}
        <div className="flex flex-wrap gap-2">
          {contact.email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${contact.email}`} className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </a>
            </Button>
          )}
          {contact.phone && (
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${contact.phone}`} className="gap-2">
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
          )}
          {contact.linkedin_url && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            </Button>
          )}
        </div>

        {/* Type badge */}
        {contact.contact_type && (
          <div>
            <ContactTypeBadge type={contact.contact_type as ContactType | null} />
          </div>
        )}

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Interactions
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {contact.totalInteractionCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last 30 Days
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {contact.relationshipStrength.recentInteractionCount}
            </p>
          </div>
        </div>

        {/* Referral Stats */}
        {contact.referralStats && contact.referralStats.totalReferrals > 0 && (
          <div className="p-4 border border-teal-200 dark:border-teal-700 rounded-lg bg-teal-50 dark:bg-teal-900/20">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              Referral Impact
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {contact.referralStats.totalReferrals}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {contact.referralStats.activeReferrals}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Offers</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                  {contact.referralStats.offersReceived}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conversion</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                  {contact.referralStats.conversionRate.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Notes
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {contact.notes}
            </p>
          </div>
        )}
      </div>

      {/* Interactions timeline */}
      <InteractionsSection
        contactId={contact.id}
        initialInteractions={contact.interactions}
      />
    </div>
  );
}
