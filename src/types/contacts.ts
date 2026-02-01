/**
 * Contact Management Types
 * Ticket #16: Contact Management CRUD
 *
 * Type definitions for contacts, interactions, and related operations
 */

import type { Database } from './database';

// =============================================
// DATABASE TYPES
// =============================================

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];

export type ContactInteraction = Database['public']['Tables']['contact_interactions']['Row'];
export type ContactInteractionInsert = Database['public']['Tables']['contact_interactions']['Insert'];
export type ContactInteractionUpdate = Database['public']['Tables']['contact_interactions']['Update'];

// =============================================
// ENUMS
// =============================================

/**
 * Contact types matching database constraint
 */
export type ContactType =
  | 'recruiter'
  | 'hiring_manager'
  | 'referral'
  | 'colleague'
  | 'other';

/**
 * Interaction types matching database constraint
 */
export type InteractionType =
  | 'email'
  | 'call'
  | 'meeting'
  | 'linkedin_message'
  | 'other';

// =============================================
// EXTENDED TYPES
// =============================================

/**
 * Contact with computed statistics
 * Used in list views to show interaction count and linked applications
 */
export interface ContactWithStats extends Contact {
  /** Number of interactions recorded for this contact */
  interaction_count: number;
  /** Number of applications linked to this contact as referral */
  applications_count: number;
  /** Relationship strength (optional - fetched separately for performance) */
  relationship_strength?: RelationshipStrength;
}

/**
 * Contact with full interaction history
 * Used in detail views
 */
export interface ContactWithInteractions extends Contact {
  interactions: ContactInteraction[];
}

/**
 * Filter options for interaction history queries
 */
export interface InteractionFilters {
  /** Filter by interaction types (e.g., only show emails and calls) */
  types?: InteractionType[];
  /** Filter by start date (inclusive) - ISO 8601 format */
  dateFrom?: string;
  /** Filter by end date (inclusive) - ISO 8601 format */
  dateTo?: string;
}

/**
 * Relationship strength categories based on recent interaction frequency
 */
export type RelationshipStrength = 'cold' | 'warm' | 'strong';

/**
 * Relationship strength calculation result
 */
export interface RelationshipStrengthResult {
  /** Calculated strength category */
  strength: RelationshipStrength;
  /** Number of interactions in last 30 days */
  recentInteractionCount: number;
  /** Date of most recent interaction (null if never contacted) */
  lastInteractionDate?: string;
}

/**
 * Referral statistics for a contact
 * Tracks effectiveness of referrals from this contact
 */
export interface ReferralStats {
  /** Total number of applications referred by this contact */
  totalReferrals: number;
  /** Number of active referrals (not rejected/withdrawn) */
  activeReferrals: number;
  /** Number of referrals that resulted in offers */
  offersReceived: number;
  /** Conversion rate (offers / total referrals) as percentage */
  conversionRate: number;
}

/**
 * Contact with full details for detail page
 * Includes interactions, relationship metrics, and statistics
 */
export interface ContactWithDetails extends Omit<Contact, 'tags' | 'last_interaction_date'> {
  /** Full interaction history */
  interactions: ContactInteraction[];
  /** Relationship strength metrics */
  relationshipStrength: RelationshipStrengthResult;
  /** Total number of interactions (all time) */
  totalInteractionCount: number;
  /** Tags for categorization (from migration 20260202) */
  tags?: string[];
  /** Last interaction date (from migration 20260202) */
  last_interaction_date?: string | null;
  /** Referral tracking statistics (from Ticket #18) */
  referralStats?: ReferralStats;
}

// =============================================
// SEARCH & FILTER TYPES
// =============================================

/**
 * Filter options for contact list queries
 */
export interface ContactFilters {
  /** Full-text search across name, company, position, notes */
  search?: string;
  /** Filter by contact type */
  contactType?: ContactType;
  /** Filter by tags (array overlap - matches any tag) */
  tags?: string[];
  /** Filter by company name (exact match) */
  company?: string;
}

/**
 * Sort field options
 */
export type ContactSortField =
  | 'name'
  | 'company'
  | 'last_interaction_date'
  | 'created_at';

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort options for contact list queries
 */
export interface ContactSortOptions {
  field: ContactSortField;
  order: SortOrder;
}

// =============================================
// SERVER ACTION RESULT TYPES
// =============================================

/**
 * Result type for single contact operations (create, get, update)
 */
export interface ContactResult {
  success: boolean;
  contact?: Contact;
  error?: string;
}

/**
 * Result type for contact list operations (getContacts)
 */
export interface ContactsListResult {
  success: boolean;
  contacts?: ContactWithStats[];
  total?: number;
  error?: string;
}

/**
 * Result type for delete operations
 */
export interface DeleteContactResult {
  success: boolean;
  error?: string;
}

/**
 * Result type for contact interaction operations
 */
export interface ContactInteractionResult {
  success: boolean;
  interaction?: ContactInteraction;
  error?: string;
}

/**
 * Result type for interaction list operations
 */
export interface ContactInteractionsListResult {
  success: boolean;
  interactions?: ContactInteraction[];
  error?: string;
}

/**
 * Result type for relationship strength calculation
 */
export interface RelationshipStrengthQueryResult {
  success: boolean;
  data?: RelationshipStrengthResult;
  error?: string;
}

/**
 * Result type for contact with details operation
 */
export interface ContactWithDetailsResult {
  success: boolean;
  data?: ContactWithDetails;
  error?: string;
}

// =============================================
// INPUT TYPES (FOR VALIDATION)
// =============================================

/**
 * Input type for creating a new contact
 * Validated by contactFormSchema in schemas/contact.ts
 */
export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  linkedin_url?: string;
  contact_type?: ContactType;
  notes?: string;
  tags?: string[];
}

/**
 * Input type for updating an existing contact
 * All fields optional except id (partial update)
 */
export interface UpdateContactInput extends Partial<CreateContactInput> {
  /** Contact ID (required for updates) */
  id: string;
}

/**
 * Input type for linking a contact to an application as referral
 */
export interface LinkContactToApplicationInput {
  /** Application ID */
  applicationId: string;
  /** Contact ID */
  contactId: string;
}

/**
 * Input type for creating a contact interaction
 */
export interface CreateContactInteractionInput {
  /** Contact ID */
  contactId: string;
  /** Type of interaction */
  interactionType: InteractionType;
  /** When the interaction occurred */
  interactionDate?: string; // ISO 8601 format
  /** Notes about the interaction */
  notes?: string;
}

// =============================================
// UI STATE TYPES
// =============================================

/**
 * Contact form state (for client-side form handling)
 */
export interface ContactFormState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  editingContact?: Contact;
}

/**
 * Contact selector state (for linking contacts to applications)
 */
export interface ContactSelectorState {
  isOpen: boolean;
  selectedContactId?: string;
  searchQuery: string;
}
