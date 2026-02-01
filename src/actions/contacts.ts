'use server';

/**
 * Server Actions: Contact Management CRUD
 *
 * Ticket #16: Contact Management
 *
 * Provides server-side operations for managing contacts with:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Advanced search with full-text search
 * - Sorting by name, company, last interaction date
 * - Linking contacts to applications as referrals
 * - Tag-based filtering
 * - PII protection in logging (GDPR compliance)
 * - IDOR protection for referral linking
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  contactFormSchema,
  updateContactSchema,
  linkContactSchema,
  contactInteractionSchema,
  interactionFilterSchema,
} from '@/schemas/contact';
import type {
  ContactResult,
  ContactsListResult,
  DeleteContactResult,
  CreateContactInput,
  UpdateContactInput,
  ContactFilters,
  ContactSortOptions,
  LinkContactToApplicationInput,
  ContactWithStats,
  ContactInteractionResult,
  ContactInteractionsListResult,
  RelationshipStrengthQueryResult,
  ContactWithDetailsResult,
  CreateContactInteractionInput,
  InteractionFilters,
  RelationshipStrength,
} from '@/types/contacts';

// =============================================
// SECURITY: PII REDACTION UTILITY
// =============================================

/**
 * Redact Personally Identifiable Information (PII) for logging
 *
 * GDPR/CCPA Compliance: Never log PII in plaintext
 *
 * @param data - Object containing potential PII
 * @returns Redacted version safe for logging
 */
function redactPII(data: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...data };

  // Redact email (show domain only)
  if (redacted.email && typeof redacted.email === 'string') {
    const parts = redacted.email.split('@');
    redacted.email = parts.length === 2 ? `***@${parts[1]}` : '[REDACTED]';
  }

  // Redact phone (show last 4 digits only)
  if (redacted.phone && typeof redacted.phone === 'string') {
    const digits = redacted.phone.replace(/\D/g, '');
    redacted.phone =
      digits.length >= 4 ? `***-***-${digits.slice(-4)}` : '[REDACTED]';
  }

  // Redact LinkedIn URL (completely hidden)
  if (redacted.linkedin_url) {
    redacted.linkedin_url = '[REDACTED]';
  }

  return redacted;
}

// =============================================
// HELPER: AUTHENTICATE USER
// =============================================

/**
 * Authenticate current user and get database user ID
 *
 * Pattern from generate-followups.ts:
 * 1. Get auth user via supabase.auth.getUser()
 * 2. Map auth_id to database user_id
 * 3. Return supabase client + user info
 */
async function authenticateUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null, dbUser: null, error: 'Unauthorized' };
  }

  // Get database user ID
  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single();

  if (userError || !dbUser) {
    console.error('User lookup failed:', redactPII({ auth_id: user.id }));
    return { supabase, user: null, dbUser: null, error: 'User not found' };
  }

  return { supabase, user, dbUser, error: null };
}

// =============================================
// CREATE CONTACT
// =============================================

/**
 * Create a new contact
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate input with Zod schema
 * 3. Insert contact with user_id (RLS enforces ownership)
 * 4. Return created contact
 *
 * Security:
 * - Input validated by contactFormSchema (strict LinkedIn URL, email format)
 * - PII redacted in logs
 * - RLS policy ensures user_id matches auth.uid()
 */
export async function createContact(
  input: CreateContactInput
): Promise<ContactResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Validate input with Zod
    const validation = contactFormSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }

    const validatedData = validation.data;

    // 3. Insert contact (RLS enforces ownership)
    const { data: contact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        user_id: dbUser.id,
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        position: validatedData.position || null,
        linkedin_url: validatedData.linkedin_url || null,
        contact_type: validatedData.contact_type || null,
        notes: validatedData.notes || null,
        tags: validatedData.tags || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        'Contact creation failed:',
        redactPII({ user_id: dbUser.id, error: insertError.message })
      );
      return { success: false, error: 'Failed to create contact' };
    }

    // 4. Return success (PII redacted in response to user, but full data returned)
    return { success: true, contact };
  } catch (error) {
    console.error('Unexpected error in createContact:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================
// GET CONTACTS (LIST WITH FILTERS & SEARCH)
// =============================================

/**
 * Get contacts with optional filtering, searching, and sorting
 *
 * Flow:
 * 1. Authenticate user
 * 2. Build query with user_id filter (RLS automatic)
 * 3. Apply search (full-text via ilike, leverages GIN index)
 * 4. Apply filters (contact_type, tags, company)
 * 5. Apply sorting (name, company, last_interaction_date)
 * 6. Execute query with stats (interaction count, applications count)
 * 7. Return results
 *
 * Performance:
 * - Uses GIN index for full-text search (idx_contacts_search)
 * - Uses composite indexes for filtering (idx_contacts_user_type, idx_contacts_tags)
 * - Uses index for sorting (idx_contacts_last_interaction)
 */
export async function getContacts(
  filters?: ContactFilters,
  sortOptions?: ContactSortOptions,
  limit = 50,
  offset = 0
): Promise<ContactsListResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Build base query (RLS handles ownership automatically)
    let query = supabase
      .from('contacts')
      .select(
        `
        *,
        interaction_count:contact_interactions(count),
        applications_count:applications!applications_referral_contact_id_fkey(count)
      `,
        { count: 'exact' }
      )
      .eq('user_id', dbUser.id);

    // 3. Apply full-text search if provided
    if (filters?.search && filters.search.trim().length > 0) {
      const searchTerm = filters.search.trim();
      // Use ilike for case-insensitive search across multiple fields
      query = query.or(
        `name.ilike.%${searchTerm}%,` +
          `company.ilike.%${searchTerm}%,` +
          `position.ilike.%${searchTerm}%,` +
          `notes.ilike.%${searchTerm}%`
      );
    }

    // 4. Apply filters
    if (filters?.contactType) {
      query = query.eq('contact_type', filters.contactType);
    }

    if (filters?.company) {
      query = query.eq('company', filters.company);
    }

    if (filters?.tags && filters.tags.length > 0) {
      // Match any of the provided tags (array overlap)
      query = query.overlaps('tags', filters.tags);
    }

    // 5. Apply sorting
    const sortField = sortOptions?.field || 'name';
    const sortOrder = sortOptions?.order || 'asc';

    if (sortField === 'last_interaction_date') {
      // NULLS LAST for interaction date (contacts without interactions appear last)
      query = query.order(sortField, {
        ascending: sortOrder === 'asc',
        nullsFirst: false,
      });
    } else {
      query = query.order(sortField, { ascending: sortOrder === 'asc' });
    }

    // 6. Apply pagination
    query = query.range(offset, offset + limit - 1);

    // 7. Execute query
    const { data: contacts, error: queryError, count } = await query;

    if (queryError) {
      console.error(
        'Contact fetch failed:',
        redactPII({ user_id: dbUser.id, error: queryError.message })
      );
      return { success: false, error: 'Failed to fetch contacts' };
    }

    // Transform to include stats (handle Supabase's count array format)
    const contactsWithStats: ContactWithStats[] = (contacts || []).map(
      (contact) => ({
        ...contact,
        interaction_count: Array.isArray(contact.interaction_count)
          ? contact.interaction_count[0]?.count || 0
          : 0,
        applications_count: Array.isArray(contact.applications_count)
          ? contact.applications_count[0]?.count || 0
          : 0,
      })
    );

    return {
      success: true,
      contacts: contactsWithStats,
      total: count || 0,
    };
  } catch (error) {
    console.error('Unexpected error in getContacts:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================
// GET SINGLE CONTACT BY ID
// =============================================

/**
 * Get a single contact by ID
 *
 * Security:
 * - RLS policy prevents access to other users' contacts
 * - Explicit user_id check for defense-in-depth
 */
export async function getContact(contactId: string): Promise<ContactResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Fetch contact with ownership verification
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', dbUser.id) // Explicit ownership check
      .single();

    if (fetchError || !contact) {
      // Return generic error (don't reveal if contact exists for other users)
      return { success: false, error: 'Contact not found' };
    }

    return { success: true, contact };
  } catch (error) {
    console.error('Unexpected error in getContact:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================
// UPDATE CONTACT
// =============================================

/**
 * Update an existing contact
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate input with Zod schema (partial update)
 * 3. Verify ownership (fetch contact first)
 * 4. Update contact
 * 5. Return updated contact
 *
 * Security:
 * - Validates input (only update provided fields)
 * - Verifies ownership before update
 * - RLS policy ensures user_id matches
 */
export async function updateContact(
  input: UpdateContactInput
): Promise<ContactResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Validate input with Zod
    const validation = updateContactSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }

    const validatedData = validation.data;

    // 3. Verify ownership (fetch contact first)
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', validatedData.id)
      .eq('user_id', dbUser.id)
      .single();

    if (fetchError || !existingContact) {
      return { success: false, error: 'Contact not found or access denied' };
    }

    // 4. Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined)
      updateData.phone = validatedData.phone || null;
    if (validatedData.company !== undefined)
      updateData.company = validatedData.company || null;
    if (validatedData.position !== undefined)
      updateData.position = validatedData.position || null;
    if (validatedData.linkedin_url !== undefined)
      updateData.linkedin_url = validatedData.linkedin_url || null;
    if (validatedData.contact_type !== undefined)
      updateData.contact_type = validatedData.contact_type;
    if (validatedData.notes !== undefined)
      updateData.notes = validatedData.notes || null;
    if (validatedData.tags !== undefined)
      updateData.tags = validatedData.tags;

    // 5. Update contact
    const { data: contact, error: updateError } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', validatedData.id)
      .eq('user_id', dbUser.id) // Double-check ownership
      .select()
      .single();

    if (updateError) {
      console.error(
        'Contact update failed:',
        redactPII({
          contact_id: validatedData.id,
          user_id: dbUser.id,
          error: updateError.message,
        })
      );
      return { success: false, error: 'Failed to update contact' };
    }

    return { success: true, contact };
  } catch (error) {
    console.error('Unexpected error in updateContact:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================
// DELETE CONTACT
// =============================================

/**
 * Delete a contact
 *
 * Flow:
 * 1. Authenticate user
 * 2. Verify ownership
 * 3. Delete contact (CASCADE will delete interactions)
 * 4. Applications with referral_contact_id will have it SET NULL
 * 5. Return success
 *
 * Note: ON DELETE SET NULL in migration ensures applications are unlinked
 */
export async function deleteContact(
  contactId: string
): Promise<DeleteContactResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Delete contact (RLS + explicit ownership check)
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .eq('user_id', dbUser.id);

    if (deleteError) {
      console.error(
        'Contact deletion failed:',
        redactPII({
          contact_id: contactId,
          user_id: dbUser.id,
          error: deleteError.message,
        })
      );
      return { success: false, error: 'Failed to delete contact' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteContact:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================
// LINK CONTACT TO APPLICATION (IDOR PROTECTION)
// =============================================

/**
 * Link a contact to an application as a referral
 *
 * Flow:
 * 1. Authenticate user
 * 2. Verify user owns the application (IDOR protection)
 * 3. Verify user owns the contact (IDOR protection)
 * 4. Update application.referral_contact_id
 * 5. Return success
 *
 * SECURITY (Critical): IDOR Protection
 * - Without this check, user A could link user B's contact to user A's application
 * - This would allow user A to see contact details owned by user B
 * - We verify ownership of BOTH application and contact before linking
 */
export async function linkContactToApplication(
  input: LinkContactToApplicationInput
): Promise<DeleteContactResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Validate input
    const validation = linkContactSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }

    const { applicationId, contactId } = validation.data;

    // 3. Verify ownership of BOTH application and contact (IDOR protection)
    const [{ data: application }, { data: contact }] = await Promise.all([
      supabase
        .from('applications')
        .select('id, user_id')
        .eq('id', applicationId)
        .eq('user_id', dbUser.id)
        .single(),
      supabase
        .from('contacts')
        .select('id, user_id')
        .eq('id', contactId)
        .eq('user_id', dbUser.id)
        .single(),
    ]);

    if (!application) {
      return { success: false, error: 'Application not found or access denied' };
    }

    if (!contact) {
      return { success: false, error: 'Contact not found or access denied' };
    }

    // 4. Update application with referral_contact_id
    const { error: updateError } = await supabase
      .from('applications')
      .update({ referral_contact_id: contactId })
      .eq('id', applicationId)
      .eq('user_id', dbUser.id); // Triple-check ownership

    if (updateError) {
      console.error(
        'Contact linking failed:',
        redactPII({
          application_id: applicationId,
          contact_id: contactId,
          user_id: dbUser.id,
          error: updateError.message,
        })
      );
      return { success: false, error: 'Failed to link contact' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in linkContactToApplication:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================
// UNLINK CONTACT FROM APPLICATION
// =============================================

/**
 * Unlink a contact from an application
 *
 * Flow:
 * 1. Authenticate user
 * 2. Verify ownership of application
 * 3. Set referral_contact_id to NULL
 * 4. Return success
 */
export async function unlinkContactFromApplication(
  applicationId: string
): Promise<DeleteContactResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Update application to remove referral_contact_id
    const { error: updateError } = await supabase
      .from('applications')
      .update({ referral_contact_id: null })
      .eq('id', applicationId)
      .eq('user_id', dbUser.id); // Verify ownership

    if (updateError) {
      console.error(
        'Contact unlinking failed:',
        redactPII({
          application_id: applicationId,
          user_id: dbUser.id,
          error: updateError.message,
        })
      );
      return { success: false, error: 'Failed to unlink contact' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in unlinkContactFromApplication:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =============================================
// INTERACTION HISTORY TRACKING (Ticket #17)
// =============================================

/**
 * Create a contact interaction
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate input with Zod schema
 * 3. Verify user owns the contact (IDOR protection)
 * 4. Insert interaction into contact_interactions table
 * 5. Trigger auto-updates contacts.last_interaction_date
 * 6. Return new interaction
 *
 * Security:
 * - IDOR protection: verify contact ownership before creating interaction
 * - Input validated (no future dates, 1000 char limit on notes)
 * - RLS policy ensures contact belongs to user
 */
export async function createContactInteraction(
  input: CreateContactInteractionInput
): Promise<ContactInteractionResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Validate input with Zod
    const validation = contactInteractionSchema.safeParse(input);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
      };
    }

    const validatedData = validation.data;

    // 3. Verify ownership of contact (IDOR protection)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', validatedData.contactId)
      .eq('user_id', dbUser.id)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found or access denied' };
    }

    // 4. Insert interaction (database trigger handles last_interaction_date update)
    const { data: interaction, error: insertError } = await supabase
      .from('contact_interactions')
      .insert({
        contact_id: validatedData.contactId,
        interaction_type: validatedData.interactionType,
        interaction_date: validatedData.interactionDate,
        notes: validatedData.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        'Interaction creation failed:',
        redactPII({
          contact_id: validatedData.contactId,
          user_id: dbUser.id,
          error: insertError.message,
        })
      );
      return { success: false, error: 'Failed to create interaction' };
    }

    // 5. Revalidate contact detail pages
    revalidatePath('/dashboard/contacts');

    return { success: true, interaction };
  } catch (error) {
    console.error('Unexpected error in createContactInteraction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get contact interactions with optional filtering
 *
 * Flow:
 * 1. Authenticate user
 * 2. Verify ownership of contact
 * 3. Apply filters (types, date range)
 * 4. Order by interaction_date DESC (newest first)
 * 5. Return interactions
 *
 * Performance:
 * - Uses idx_contact_interactions_contact_date composite index
 * - Type filter uses idx_contact_interactions_type
 */
export async function getContactInteractions(
  contactId: string,
  filters?: InteractionFilters
): Promise<ContactInteractionsListResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Verify ownership
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', contactId)
      .eq('user_id', dbUser.id)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found or access denied' };
    }

    // 3. Validate filters
    const validation = interactionFilterSchema.safeParse(filters || {});
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Invalid filters',
      };
    }

    const validatedFilters = validation.data;

    // 4. Build query
    let query = supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId);

    // Apply type filter (IN clause)
    if (validatedFilters.types && validatedFilters.types.length > 0) {
      query = query.in('interaction_type', validatedFilters.types);
    }

    // Apply date range filters
    if (validatedFilters.dateFrom) {
      query = query.gte('interaction_date', validatedFilters.dateFrom);
    }

    if (validatedFilters.dateTo) {
      query = query.lte('interaction_date', validatedFilters.dateTo);
    }

    // 5. Order by date DESC (newest first)
    query = query.order('interaction_date', { ascending: false });

    // 6. Execute query
    const { data: interactions, error: queryError } = await query;

    if (queryError) {
      console.error(
        'Interaction fetch failed:',
        redactPII({
          contact_id: contactId,
          user_id: dbUser.id,
          error: queryError.message,
        })
      );
      return { success: false, error: 'Failed to fetch interactions' };
    }

    return { success: true, interactions: interactions || [] };
  } catch (error) {
    console.error('Unexpected error in getContactInteractions:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete a contact interaction
 *
 * Flow:
 * 1. Authenticate user
 * 2. Verify nested ownership (user → contact → interaction)
 * 3. Delete interaction
 * 4. Trigger recalculates last_interaction_date
 * 5. Return success
 *
 * Security:
 * - Nested ownership verification prevents IDOR attacks
 * - Can't delete other users' interactions
 */
export async function deleteContactInteraction(
  interactionId: string,
  contactId: string
): Promise<DeleteContactResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Verify nested ownership (user → contact → interaction)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id')
      .eq('id', contactId)
      .eq('user_id', dbUser.id)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found or access denied' };
    }

    // Verify interaction belongs to this contact
    const { data: interaction, error: interactionError } = await supabase
      .from('contact_interactions')
      .select('id, contact_id')
      .eq('id', interactionId)
      .eq('contact_id', contactId)
      .single();

    if (interactionError || !interaction) {
      return {
        success: false,
        error: 'Interaction not found or access denied',
      };
    }

    // 3. Delete interaction (trigger handles last_interaction_date recalc)
    const { error: deleteError } = await supabase
      .from('contact_interactions')
      .delete()
      .eq('id', interactionId)
      .eq('contact_id', contactId);

    if (deleteError) {
      console.error(
        'Interaction deletion failed:',
        redactPII({
          interaction_id: interactionId,
          contact_id: contactId,
          user_id: dbUser.id,
          error: deleteError.message,
        })
      );
      return { success: false, error: 'Failed to delete interaction' };
    }

    // 4. Revalidate contact detail pages
    revalidatePath('/dashboard/contacts');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in deleteContactInteraction:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Calculate relationship strength based on recent interactions
 *
 * Formula:
 * - Cold: 0 interactions in last 30 days
 * - Warm: 1-2 interactions in last 30 days
 * - Strong: 3+ interactions in last 30 days
 *
 * Flow:
 * 1. Authenticate user
 * 2. Verify ownership of contact
 * 3. Count interactions in last 30 days
 * 4. Get last_interaction_date from contact
 * 5. Calculate strength category
 * 6. Return result
 */
export async function calculateRelationshipStrength(
  contactId: string
): Promise<RelationshipStrengthQueryResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Verify ownership and get last_interaction_date
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id, last_interaction_date')
      .eq('id', contactId)
      .eq('user_id', dbUser.id)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found or access denied' };
    }

    // 3. Count interactions in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count, error: countError } = await supabase
      .from('contact_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contactId)
      .gte('interaction_date', thirtyDaysAgo.toISOString());

    if (countError) {
      console.error(
        'Interaction count failed:',
        redactPII({
          contact_id: contactId,
          user_id: dbUser.id,
          error: countError.message,
        })
      );
      return { success: false, error: 'Failed to calculate strength' };
    }

    const recentInteractionCount = count || 0;

    // 4. Calculate strength category
    let strength: RelationshipStrength = 'cold';
    if (recentInteractionCount >= 3) {
      strength = 'strong';
    } else if (recentInteractionCount >= 1) {
      strength = 'warm';
    }

    return {
      success: true,
      data: {
        strength,
        recentInteractionCount,
        lastInteractionDate: contact.last_interaction_date || undefined,
      },
    };
  } catch (error) {
    console.error('Unexpected error in calculateRelationshipStrength:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get contact with full details (interactions, stats, relationship strength)
 *
 * Flow:
 * 1. Authenticate user
 * 2. Fetch contact with ownership verification
 * 3. Fetch all interactions
 * 4. Calculate relationship strength
 * 5. Count total interactions
 * 6. Return ContactWithDetails
 *
 * Used by: Contact detail page (/dashboard/contacts/[id])
 */
export async function getContactWithDetails(
  contactId: string
): Promise<ContactWithDetailsResult> {
  try {
    // 1. Authenticate
    const { supabase, dbUser, error: authError } = await authenticateUser();
    if (authError || !dbUser) {
      return { success: false, error: authError || 'Authentication failed' };
    }

    // 2. Fetch contact with ownership verification
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', dbUser.id)
      .single();

    if (contactError || !contact) {
      return { success: false, error: 'Contact not found or access denied' };
    }

    // 3. Fetch all interactions (ordered by date DESC)
    const { data: interactions, error: interactionsError } = await supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('interaction_date', { ascending: false });

    if (interactionsError) {
      console.error(
        'Interactions fetch failed:',
        redactPII({
          contact_id: contactId,
          user_id: dbUser.id,
          error: interactionsError.message,
        })
      );
      return { success: false, error: 'Failed to fetch interactions' };
    }

    // 4. Calculate relationship strength
    const strengthResult = await calculateRelationshipStrength(contactId);
    if (!strengthResult.success || !strengthResult.data) {
      return {
        success: false,
        error: strengthResult.error || 'Failed to calculate strength',
      };
    }

    // 5. Count total interactions
    const totalInteractionCount = interactions?.length || 0;

    // 6. Return full contact details
    return {
      success: true,
      data: {
        ...contact,
        interactions: interactions || [],
        relationshipStrength: strengthResult.data,
        totalInteractionCount,
      },
    };
  } catch (error) {
    console.error('Unexpected error in getContactWithDetails:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
