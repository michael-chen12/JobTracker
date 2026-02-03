import { describe, it, expect } from 'vitest';
import {
  filtersToSearchParams,
  searchParamsToFilters,
  hasActiveFilters,
  mergeFilters,
} from '@/lib/filterQueryParams';
import type { GetApplicationsParams } from '@/actions/applications';

describe('Filter Query Params Utilities', () => {
  describe('filtersToSearchParams', () => {
    it('should convert basic filters to URL params', () => {
      const filters: GetApplicationsParams = {
        search: 'engineer',
        page: 2,
        limit: 20,
      };

      const params = filtersToSearchParams(filters);

      expect(params.get('search')).toBe('engineer');
      expect(params.get('page')).toBe('2');
      expect(params.get('limit')).toBe('20');
    });

    it('should convert array filters to comma-separated strings', () => {
      const filters: GetApplicationsParams = {
        status: ['applied', 'screening', 'interviewing'],
        jobType: ['full-time', 'remote'],
      };

      const params = filtersToSearchParams(filters);

      expect(params.get('status')).toBe('applied,screening,interviewing');
      expect(params.get('jobType')).toBe('full-time,remote');
    });

    it('should convert boolean to 1/0', () => {
      const filtersTrue: GetApplicationsParams = { hasReferral: true };
      const filtersFalse: GetApplicationsParams = { hasReferral: false };

      const paramsTrue = filtersToSearchParams(filtersTrue);
      const paramsFalse = filtersToSearchParams(filtersFalse);

      expect(paramsTrue.get('hasReferral')).toBe('1');
      expect(paramsFalse.get('hasReferral')).toBe('0');
    });

    it('should skip undefined and null values', () => {
      const filters: GetApplicationsParams = {
        search: 'test',
        location: undefined,
        salaryMin: undefined,
      };

      const params = filtersToSearchParams(filters);

      expect(params.has('search')).toBe(true);
      expect(params.has('location')).toBe(false);
      expect(params.has('salaryMin')).toBe(false);
    });

    it('should skip empty strings', () => {
      const filters: GetApplicationsParams = {
        search: '',
        location: '   ', // Will be trimmed to empty
      };

      const params = filtersToSearchParams(filters);

      expect(params.has('search')).toBe(false);
      expect(params.has('location')).toBe(false);
    });

    it('should skip empty arrays', () => {
      const filters: GetApplicationsParams = {
        status: [],
        tags: [],
      };

      const params = filtersToSearchParams(filters);

      expect(params.has('status')).toBe(false);
      expect(params.has('tags')).toBe(false);
    });

    it('should handle comprehensive filter object', () => {
      const filters: GetApplicationsParams = {
        search: 'software',
        status: ['applied'],
        hasReferral: true,
        location: 'San Francisco',
        jobType: ['full-time'],
        salaryMin: 100000,
        salaryMax: 150000,
        appliedDateFrom: '2024-01-01',
        appliedDateTo: '2024-12-31',
        tags: ['uuid-1', 'uuid-2'],
        priority: ['high'],
      };

      const params = filtersToSearchParams(filters);

      expect(params.toString()).toContain('search=software');
      expect(params.toString()).toContain('status=applied');
      expect(params.toString()).toContain('hasReferral=1');
      expect(params.toString()).toContain('location=San');
      expect(params.toString()).toContain('salaryMin=100000');
      expect(params.toString()).toContain('tags=uuid-1%2Cuuid-2');
    });
  });

  describe('searchParamsToFilters', () => {
    it('should parse basic URL params to filters', () => {
      const params = new URLSearchParams('search=engineer&page=2&limit=20');
      const filters = searchParamsToFilters(params);

      expect(filters.search).toBe('engineer');
      expect(filters.page).toBe(2);
      expect(filters.limit).toBe(20);
    });

    it('should parse comma-separated values to arrays', () => {
      const params = new URLSearchParams('status=applied,screening&jobType=full-time,remote');
      const filters = searchParamsToFilters(params);

      expect(filters.status).toEqual(['applied', 'screening']);
      expect(filters.jobType).toEqual(['full-time', 'remote']);
    });

    it('should parse 1/0 to boolean', () => {
      const paramsTrue = new URLSearchParams('hasReferral=1');
      const paramsFalse = new URLSearchParams('hasReferral=0');

      const filtersTrue = searchParamsToFilters(paramsTrue);
      const filtersFalse = searchParamsToFilters(paramsFalse);

      expect(filtersTrue.hasReferral).toBe(true);
      expect(filtersFalse.hasReferral).toBe(false);
    });

    it('should parse true/false strings to boolean', () => {
      const params = new URLSearchParams('hasReferral=true');
      const filters = searchParamsToFilters(params);

      expect(filters.hasReferral).toBe(true);
    });

    it('should handle missing params', () => {
      const params = new URLSearchParams('search=test');
      const filters = searchParamsToFilters(params);

      expect(filters.search).toBe('test');
      expect(filters.status).toBeUndefined();
      expect(filters.location).toBeUndefined();
    });

    it('should skip empty string params', () => {
      const params = new URLSearchParams('search=&location=');
      const filters = searchParamsToFilters(params);

      expect(filters.search).toBeUndefined();
      expect(filters.location).toBeUndefined();
    });

    it('should handle invalid number params', () => {
      const params = new URLSearchParams('salaryMin=invalid&salaryMax=150000');
      const filters = searchParamsToFilters(params);

      expect(filters.salaryMin).toBeUndefined();
      expect(filters.salaryMax).toBe(150000);
    });

    it('should filter out empty array elements', () => {
      const params = new URLSearchParams('status=applied,,screening');
      const filters = searchParamsToFilters(params);

      expect(filters.status).toEqual(['applied', 'screening']);
    });
  });

  describe('Roundtrip Conversion', () => {
    it('should preserve data through roundtrip conversion', () => {
      const original: GetApplicationsParams = {
        search: 'engineer',
        status: ['applied', 'screening'],
        hasReferral: true,
        location: 'Remote',
        salaryMin: 100000,
        salaryMax: 150000,
        priority: ['high', 'medium'],
      };

      const params = filtersToSearchParams(original);
      const restored = searchParamsToFilters(params);

      expect(restored.search).toBe(original.search);
      expect(restored.status).toEqual(original.status);
      expect(restored.hasReferral).toBe(original.hasReferral);
      expect(restored.location).toBe(original.location);
      expect(restored.salaryMin).toBe(original.salaryMin);
      expect(restored.salaryMax).toBe(original.salaryMax);
      expect(restored.priority).toEqual(original.priority);
    });

    it('should handle special characters in search', () => {
      const original: GetApplicationsParams = {
        search: 'C++ Developer @ Google',
      };

      const params = filtersToSearchParams(original);
      const restored = searchParamsToFilters(params);

      expect(restored.search).toBe(original.search);
    });

    it('should handle UUID arrays', () => {
      const original: GetApplicationsParams = {
        tags: [
          '550e8400-e29b-41d4-a716-446655440000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        ],
      };

      const params = filtersToSearchParams(original);
      const restored = searchParamsToFilters(params);

      expect(restored.tags).toEqual(original.tags);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for empty filters', () => {
      expect(hasActiveFilters({})).toBe(false);
    });

    it('should return false for pagination-only filters', () => {
      const filters: GetApplicationsParams = {
        page: 2,
        limit: 20,
        sortBy: 'company',
        sortOrder: 'asc',
      };

      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true for search filter', () => {
      const filters: GetApplicationsParams = { search: 'engineer' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true for status filter', () => {
      const filters: GetApplicationsParams = { status: ['applied'] };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true for advanced filters', () => {
      const filters: GetApplicationsParams = { location: 'Remote' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return false for empty arrays', () => {
      const filters: GetApplicationsParams = { status: [], tags: [] };
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true for boolean false', () => {
      const filters: GetApplicationsParams = { hasReferral: false };
      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('mergeFilters', () => {
    it('should merge multiple filter objects', () => {
      const filters1: GetApplicationsParams = { search: 'engineer' };
      const filters2: GetApplicationsParams = { status: ['applied'] };
      const filters3: GetApplicationsParams = { location: 'Remote' };

      const merged = mergeFilters(filters1, filters2, filters3);

      expect(merged.search).toBe('engineer');
      expect(merged.status).toEqual(['applied']);
      expect(merged.location).toBe('Remote');
    });

    it('should override earlier values with later ones', () => {
      const filters1: GetApplicationsParams = { search: 'old' };
      const filters2: GetApplicationsParams = { search: 'new' };

      const merged = mergeFilters(filters1, filters2);

      expect(merged.search).toBe('new');
    });

    it('should remove properties with empty arrays', () => {
      const filters1: GetApplicationsParams = { status: ['applied'] };
      const filters2: GetApplicationsParams = { status: [] };

      const merged = mergeFilters(filters1, filters2);

      expect(merged.status).toBeUndefined();
    });

    it('should skip undefined and null values', () => {
      const filters1: GetApplicationsParams = { search: 'test', location: 'SF' };
      const filters2: GetApplicationsParams = { search: undefined, location: undefined };

      const merged = mergeFilters(filters1, filters2);

      expect(merged.search).toBe('test');
      expect(merged.location).toBe('SF');
    });

    it('should handle empty filter objects', () => {
      const merged = mergeFilters({}, {}, {});
      expect(Object.keys(merged).length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL-encoded special characters', () => {
      const params = new URLSearchParams('search=C%2B%2B+Developer');
      const filters = searchParamsToFilters(params);

      expect(filters.search).toBe('C++ Developer');
    });

    it('should handle very long search strings', () => {
      const longSearch = 'a'.repeat(500);
      const filters: GetApplicationsParams = { search: longSearch };

      const params = filtersToSearchParams(filters);
      const restored = searchParamsToFilters(params);

      expect(restored.search).toBe(longSearch);
    });

    it('should handle date strings in ISO format', () => {
      const filters: GetApplicationsParams = {
        appliedDateFrom: '2024-01-01',
        appliedDateTo: '2024-12-31',
      };

      const params = filtersToSearchParams(filters);
      const restored = searchParamsToFilters(params);

      expect(restored.appliedDateFrom).toBe('2024-01-01');
      expect(restored.appliedDateTo).toBe('2024-12-31');
    });

    it('should handle array with single element', () => {
      const filters: GetApplicationsParams = { status: ['applied'] };

      const params = filtersToSearchParams(filters);
      const restored = searchParamsToFilters(params);

      expect(restored.status).toEqual(['applied']);
    });
  });
});
