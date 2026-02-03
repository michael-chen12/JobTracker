import type { GetApplicationsParams } from '@/actions/applications';

export interface FilterPreset {
  id: string;
  user_id: string;
  name: string;
  filters: GetApplicationsParams;
  created_at: string;
  updated_at: string;
}

export type FilterPresetInsert = Omit<FilterPreset, 'id' | 'created_at' | 'updated_at'>;
export type FilterPresetUpdate = Partial<Omit<FilterPreset, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
