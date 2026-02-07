import { describe, expect, it } from 'vitest';
import type { GetApplicationsParams } from '@/actions/applications';
import {
  filtersToSearchParams,
  searchParamsToFilters,
  hasActiveFilters,
  mergeFilters,
} from '@/lib/filterQueryParams';

function roundTrip(filters: GetApplicationsParams): GetApplicationsParams {
  return searchParamsToFilters(filtersToSearchParams(filters));
}

describe('filterQueryParams', () => {
  describe('filtersToSearchParams', () => {
    it('serializes search filter', () => {
      const params = filtersToSearchParams({ search: 'frontend' });
      expect(params.get('search')).toBe('frontend');
    });

    it('serializes status array as comma-separated string', () => {
      const params = filtersToSearchParams({ status: ['applied', 'interviewing'] });
      expect(params.get('status')).toBe('applied,interviewing');
    });

    it('omits empty arrays', () => {
      const params = filtersToSearchParams({ status: [] });
      expect(params.has('status')).toBe(false);
    });

    it('serializes hasReferral=true as 1', () => {
      const params = filtersToSearchParams({ hasReferral: true });
      expect(params.get('hasReferral')).toBe('1');
    });

    it('serializes hasReferral=false as 0', () => {
      const params = filtersToSearchParams({ hasReferral: false });
      expect(params.get('hasReferral')).toBe('0');
    });

    it('serializes number 0 correctly', () => {
      const params = filtersToSearchParams({ salaryMin: 0 });
      expect(params.get('salaryMin')).toBe('0');
    });

    it('omits undefined values', () => {
      const params = filtersToSearchParams({
        search: undefined,
        location: undefined,
      });
      expect(params.toString()).toBe('');
    });

    it('omits blank strings', () => {
      const params = filtersToSearchParams({
        search: '   ',
        location: '',
      });
      expect(params.toString()).toBe('');
    });

    it('serializes pagination and sorting', () => {
      const params = filtersToSearchParams({
        page: 2,
        limit: 50,
        sortBy: 'company',
        sortOrder: 'asc',
      });

      expect(params.get('page')).toBe('2');
      expect(params.get('limit')).toBe('50');
      expect(params.get('sortBy')).toBe('company');
      expect(params.get('sortOrder')).toBe('asc');
    });

    it('serializes advanced arrays', () => {
      const params = filtersToSearchParams({
        jobType: ['full-time', 'remote'],
        tags: ['tag-1', 'tag-2'],
        priority: ['high', 'medium'],
      });

      expect(params.get('jobType')).toBe('full-time,remote');
      expect(params.get('tags')).toBe('tag-1,tag-2');
      expect(params.get('priority')).toBe('high,medium');
    });

    it('serializes advanced scalar fields', () => {
      const params = filtersToSearchParams({
        location: 'San Francisco',
        salaryMin: 120000,
        salaryMax: 180000,
        appliedDateFrom: '2026-01-01',
        appliedDateTo: '2026-02-01',
      });

      expect(params.get('location')).toBe('San Francisco');
      expect(params.get('salaryMin')).toBe('120000');
      expect(params.get('salaryMax')).toBe('180000');
      expect(params.get('appliedDateFrom')).toBe('2026-01-01');
      expect(params.get('appliedDateTo')).toBe('2026-02-01');
    });

    it('URL-encodes special characters', () => {
      const params = filtersToSearchParams({
        search: 'C++ & React/Next.js',
      });
      expect(params.toString()).toContain('search=');
      expect(params.get('search')).toBe('C++ & React/Next.js');
    });

    it.each([
      ['location', { location: 'Austin' }, 'location', 'Austin'],
      ['jobType', { jobType: ['contract'] }, 'jobType', 'contract'],
      ['salaryMin', { salaryMin: 100000 }, 'salaryMin', '100000'],
      ['salaryMax', { salaryMax: 250000 }, 'salaryMax', '250000'],
      ['appliedDateFrom', { appliedDateFrom: '2026-01-10' }, 'appliedDateFrom', '2026-01-10'],
      ['appliedDateTo', { appliedDateTo: '2026-01-25' }, 'appliedDateTo', '2026-01-25'],
      ['tags', { tags: ['uuid-1'] }, 'tags', 'uuid-1'],
      ['priority', { priority: ['low'] }, 'priority', 'low'],
    ])('serializes %s filter', (_label, filters, key, expected) => {
      const params = filtersToSearchParams(filters as GetApplicationsParams);
      expect(params.get(key)).toBe(expected);
    });
  });

  describe('searchParamsToFilters', () => {
    it('parses page and limit numbers', () => {
      const filters = searchParamsToFilters(new URLSearchParams('page=3&limit=25'));
      expect(filters.page).toBe(3);
      expect(filters.limit).toBe(25);
    });

    it('returns undefined for invalid numbers', () => {
      const filters = searchParamsToFilters(
        new URLSearchParams('page=abc&salaryMin=NaN&salaryMax=')
      );
      expect(filters.page).toBeUndefined();
      expect(filters.salaryMin).toBeUndefined();
      expect(filters.salaryMax).toBeUndefined();
    });

    it('parses status array from comma-separated string', () => {
      const filters = searchParamsToFilters(
        new URLSearchParams('status=applied,interviewing,rejected')
      );
      expect(filters.status).toEqual(['applied', 'interviewing', 'rejected']);
    });

    it('returns undefined for empty array param', () => {
      const filters = searchParamsToFilters(new URLSearchParams('status='));
      expect(filters.status).toBeUndefined();
    });

    it('parses hasReferral=true from 1', () => {
      const filters = searchParamsToFilters(new URLSearchParams('hasReferral=1'));
      expect(filters.hasReferral).toBe(true);
    });

    it('parses hasReferral=true from true', () => {
      const filters = searchParamsToFilters(new URLSearchParams('hasReferral=true'));
      expect(filters.hasReferral).toBe(true);
    });

    it('parses hasReferral=false from 0', () => {
      const filters = searchParamsToFilters(new URLSearchParams('hasReferral=0'));
      expect(filters.hasReferral).toBe(false);
    });

    it('parses hasReferral=false from false', () => {
      const filters = searchParamsToFilters(new URLSearchParams('hasReferral=false'));
      expect(filters.hasReferral).toBe(false);
    });

    it('parses sorting params', () => {
      const filters = searchParamsToFilters(
        new URLSearchParams('sortBy=created_at&sortOrder=desc')
      );
      expect(filters.sortBy).toBe('created_at');
      expect(filters.sortOrder).toBe('desc');
    });

    it('parses advanced arrays', () => {
      const filters = searchParamsToFilters(
        new URLSearchParams(
          'jobType=full-time,remote&tags=t1,t2,t3&priority=high,medium'
        )
      );
      expect(filters.jobType).toEqual(['full-time', 'remote']);
      expect(filters.tags).toEqual(['t1', 't2', 't3']);
      expect(filters.priority).toEqual(['high', 'medium']);
    });

    it('parses advanced scalar fields', () => {
      const filters = searchParamsToFilters(
        new URLSearchParams(
          'location=Seattle&salaryMin=110000&salaryMax=170000&appliedDateFrom=2026-01-01&appliedDateTo=2026-01-31'
        )
      );

      expect(filters.location).toBe('Seattle');
      expect(filters.salaryMin).toBe(110000);
      expect(filters.salaryMax).toBe(170000);
      expect(filters.appliedDateFrom).toBe('2026-01-01');
      expect(filters.appliedDateTo).toBe('2026-01-31');
    });

    it('treats whitespace-only strings as undefined', () => {
      const filters = searchParamsToFilters(
        new URLSearchParams('search=%20%20%20&location=')
      );
      expect(filters.search).toBeUndefined();
      expect(filters.location).toBeUndefined();
    });

    it('decodes URL-encoded values', () => {
      const params = new URLSearchParams();
      params.set('search', 'C++ & React');

      const filters = searchParamsToFilters(params);
      expect(filters.search).toBe('C++ & React');
    });

    it('ignores unknown query params', () => {
      const filters = searchParamsToFilters(
        new URLSearchParams('unknown=value&search=test')
      );
      expect(filters.search).toBe('test');
      expect((filters as Record<string, unknown>).unknown).toBeUndefined();
    });
  });

  describe('roundtrip conversion', () => {
    it('round-trips basic filters', () => {
      const original: GetApplicationsParams = {
        search: 'backend',
        status: ['applied', 'screening'],
      };
      expect(roundTrip(original)).toEqual(original);
    });

    it('round-trips advanced filters', () => {
      const original: GetApplicationsParams = {
        location: 'New York',
        jobType: ['full-time', 'contract'],
        salaryMin: 130000,
        salaryMax: 200000,
        appliedDateFrom: '2026-01-01',
        appliedDateTo: '2026-01-20',
        tags: ['uuid-1', 'uuid-2'],
        priority: ['high'],
      };
      expect(roundTrip(original)).toEqual(original);
    });

    it('round-trips pagination and sorting', () => {
      const original: GetApplicationsParams = {
        page: 4,
        limit: 10,
        sortBy: 'company',
        sortOrder: 'asc',
      };
      expect(roundTrip(original)).toEqual(original);
    });

    it('round-trips hasReferral=false', () => {
      const original: GetApplicationsParams = { hasReferral: false };
      expect(roundTrip(original)).toEqual(original);
    });

    it('round-trips hasReferral=true', () => {
      const original: GetApplicationsParams = { hasReferral: true };
      expect(roundTrip(original)).toEqual(original);
    });

    it('round-trips salaryMin=0', () => {
      const original: GetApplicationsParams = { salaryMin: 0 };
      expect(roundTrip(original)).toEqual(original);
    });

    it('drops empty arrays in roundtrip normalization', () => {
      const original: GetApplicationsParams = { status: [], tags: [] };
      expect(roundTrip(original)).toEqual({});
    });

    it('drops blank strings in roundtrip normalization', () => {
      const original: GetApplicationsParams = { search: '   ', location: '' };
      expect(roundTrip(original)).toEqual({});
    });

    it('round-trips a combined filter object', () => {
      const original: GetApplicationsParams = {
        search: 'engineer',
        status: ['offer'],
        hasReferral: true,
        location: 'Remote',
        jobType: ['remote'],
        priority: ['high', 'medium'],
      };
      expect(roundTrip(original)).toEqual(original);
    });

    it('round-trips encoded characters safely', () => {
      const original: GetApplicationsParams = {
        search: 'C# .NET + React',
        location: 'R&D HQ',
      };
      expect(roundTrip(original)).toEqual(original);
    });
  });

  describe('hasActiveFilters', () => {
    it('returns false for empty object', () => {
      expect(hasActiveFilters({})).toBe(false);
    });

    it('returns false when only pagination and sorting are present', () => {
      expect(
        hasActiveFilters({
          page: 1,
          limit: 20,
          sortBy: 'created_at',
          sortOrder: 'desc',
        })
      ).toBe(false);
    });

    it.each([
      [{ search: 'qa' }, true],
      [{ status: ['applied'] }, true],
      [{ hasReferral: false }, true],
      [{ location: 'Denver' }, true],
      [{ salaryMin: 0 }, true],
      [{ priority: ['low'] }, true],
      [{ tags: ['t1'] }, true],
      [{ status: [] }, false],
    ])('evaluates active filters correctly for %j', (filters, expected) => {
      expect(hasActiveFilters(filters as GetApplicationsParams)).toBe(expected);
    });
  });

  describe('mergeFilters', () => {
    it('merges multiple objects with last-write-wins behavior', () => {
      const merged = mergeFilters(
        { search: 'old', status: ['applied'] },
        { search: 'new' }
      );
      expect(merged).toEqual({ search: 'new', status: ['applied'] });
    });

    it('preserves false and 0 values', () => {
      const merged = mergeFilters({ hasReferral: false }, { salaryMin: 0 });
      expect(merged).toEqual({ hasReferral: false, salaryMin: 0 });
    });

    it('ignores undefined and null values', () => {
      const merged = mergeFilters(
        { search: 'engineer', location: 'Austin' },
        { search: undefined, location: null as unknown as string }
      );
      expect(merged).toEqual({ search: 'engineer', location: 'Austin' });
    });

    it('removes array fields when later value is empty array', () => {
      const merged = mergeFilters(
        { status: ['applied', 'screening'], tags: ['t1'] },
        { status: [], tags: [] }
      );
      expect(merged).toEqual({});
    });

    it('does not remove existing fields when later array is undefined', () => {
      const merged = mergeFilters({ tags: ['t1', 't2'] }, { tags: undefined });
      expect(merged).toEqual({ tags: ['t1', 't2'] });
    });

    it('supports merging three or more filter objects', () => {
      const merged = mergeFilters(
        { search: 'design', status: ['applied'] },
        { page: 2, limit: 20 },
        { status: ['offer'], priority: ['high'] }
      );

      expect(merged).toEqual({
        search: 'design',
        page: 2,
        limit: 20,
        status: ['offer'],
        priority: ['high'],
      });
    });

    it('returns empty object when all inputs are empty', () => {
      expect(mergeFilters({}, {}, {})).toEqual({});
    });

    it('does not mutate input objects', () => {
      const a: GetApplicationsParams = { search: 'original' };
      const b: GetApplicationsParams = { status: ['applied'] };

      const merged = mergeFilters(a, b);

      expect(a).toEqual({ search: 'original' });
      expect(b).toEqual({ status: ['applied'] });
      expect(merged).toEqual({ search: 'original', status: ['applied'] });
    });

    it('can clear one array while preserving others', () => {
      const merged = mergeFilters(
        { status: ['applied'], priority: ['high'] },
        { status: [] }
      );
      expect(merged).toEqual({ priority: ['high'] });
    });
  });
});
