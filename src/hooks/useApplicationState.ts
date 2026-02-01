import { useReducer, useCallback } from 'react';
import type { ApplicationWithRelations } from '@/types/application';
import type { MatchAnalysis, FollowUpSuggestions } from '@/types/ai';
import type { Contact } from '@/types/contacts';

/**
 * Consolidated state for ApplicationDetail component
 * Replaces 9 separate useState calls with a single reducer
 */
interface ApplicationState {
  // UI state
  isEditing: Record<string, boolean>;

  // Application data (optimistically updated)
  matchScore: number | null;
  matchAnalysis: MatchAnalysis | null;
  analyzedAt: string | null;
  followUpSuggestions: FollowUpSuggestions | null;
  followupSuggestionsAt: string | null;

  // Related data
  referralContact: Contact | null;

  // Async operation states
  isLoadingContact: boolean;
  isAnalyzing: boolean;
  isGeneratingSuggestions: boolean;
}

type ApplicationAction =
  | { type: 'SET_EDITING'; field: string; value: boolean }
  | { type: 'SET_MATCH_DATA'; score: number; analysis: MatchAnalysis; analyzedAt: string }
  | { type: 'SET_SUGGESTIONS'; suggestions: FollowUpSuggestions; suggestionsAt: string }
  | { type: 'SET_REFERRAL_CONTACT'; contact: Contact | null }
  | { type: 'SET_LOADING_CONTACT'; value: boolean }
  | { type: 'SET_ANALYZING'; value: boolean }
  | { type: 'SET_GENERATING_SUGGESTIONS'; value: boolean }
  | { type: 'RESET_EDITING' };

function applicationReducer(state: ApplicationState, action: ApplicationAction): ApplicationState {
  switch (action.type) {
    case 'SET_EDITING':
      return {
        ...state,
        isEditing: {
          ...state.isEditing,
          [action.field]: action.value,
        },
      };

    case 'SET_MATCH_DATA':
      return {
        ...state,
        matchScore: action.score,
        matchAnalysis: action.analysis,
        analyzedAt: action.analyzedAt,
        isAnalyzing: false,
      };

    case 'SET_SUGGESTIONS':
      return {
        ...state,
        followUpSuggestions: action.suggestions,
        followupSuggestionsAt: action.suggestionsAt,
        isGeneratingSuggestions: false,
      };

    case 'SET_REFERRAL_CONTACT':
      return {
        ...state,
        referralContact: action.contact,
        isLoadingContact: false,
      };

    case 'SET_LOADING_CONTACT':
      return {
        ...state,
        isLoadingContact: action.value,
      };

    case 'SET_ANALYZING':
      return {
        ...state,
        isAnalyzing: action.value,
      };

    case 'SET_GENERATING_SUGGESTIONS':
      return {
        ...state,
        isGeneratingSuggestions: action.value,
      };

    case 'RESET_EDITING':
      return {
        ...state,
        isEditing: {},
      };

    default:
      return state;
  }
}

function initializeState(application: ApplicationWithRelations): ApplicationState {
  return {
    isEditing: {},
    matchScore: application.match_score,
    matchAnalysis: application.match_analysis as MatchAnalysis | null,
    analyzedAt: application.analyzed_at,
    followUpSuggestions: (application as any).follow_up_suggestions as FollowUpSuggestions | null,
    followupSuggestionsAt: (application as any).followup_suggestions_at || null,
    referralContact: null,
    isLoadingContact: false,
    isAnalyzing: false,
    isGeneratingSuggestions: false,
  };
}

/**
 * Consolidated state management hook for ApplicationDetail
 *
 * Replaces 9 useState calls with a single reducer for better:
 * - State organization
 * - Related state updates (atomic)
 * - Performance (single re-render)
 * - Testability
 *
 * @example
 * const { state, actions } = useApplicationState(application);
 *
 * // Set editing state
 * actions.setEditing('company', true);
 *
 * // Update match data (atomic)
 * actions.setMatchData(85, analysis, timestamp);
 */
export function useApplicationState(application: ApplicationWithRelations) {
  const [state, dispatch] = useReducer(
    applicationReducer,
    application,
    initializeState
  );

  // Memoized action creators for stable references
  const actions = {
    setEditing: useCallback((field: string, value: boolean) => {
      dispatch({ type: 'SET_EDITING', field, value });
    }, []),

    setMatchData: useCallback((score: number, analysis: MatchAnalysis, analyzedAt: string) => {
      dispatch({ type: 'SET_MATCH_DATA', score, analysis, analyzedAt });
    }, []),

    setSuggestions: useCallback((suggestions: FollowUpSuggestions, suggestionsAt: string) => {
      dispatch({ type: 'SET_SUGGESTIONS', suggestions, suggestionsAt });
    }, []),

    setReferralContact: useCallback((contact: Contact | null) => {
      dispatch({ type: 'SET_REFERRAL_CONTACT', contact });
    }, []),

    setLoadingContact: useCallback((value: boolean) => {
      dispatch({ type: 'SET_LOADING_CONTACT', value });
    }, []),

    setAnalyzing: useCallback((value: boolean) => {
      dispatch({ type: 'SET_ANALYZING', value });
    }, []),

    setGeneratingSuggestions: useCallback((value: boolean) => {
      dispatch({ type: 'SET_GENERATING_SUGGESTIONS', value });
    }, []),

    resetEditing: useCallback(() => {
      dispatch({ type: 'RESET_EDITING' });
    }, []),
  };

  return { state, actions };
}
