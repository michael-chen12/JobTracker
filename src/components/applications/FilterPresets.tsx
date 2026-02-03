'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Star, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  getFilterPresets,
  saveFilterPreset,
  deleteFilterPreset,
  updateFilterPreset,
} from '@/actions/filter-presets';
import type { FilterPreset } from '@/types/filters';
import type { GetApplicationsParams } from '@/actions/applications';
import { useToast } from '@/hooks/use-toast';
import { hasActiveFilters } from '@/lib/filterQueryParams';

interface FilterPresetsProps {
  currentFilters: GetApplicationsParams;
  onLoadPreset: (filters: GetApplicationsParams) => void;
}

export function FilterPresets({ currentFilters, onLoadPreset }: FilterPresetsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { toast } = useToast();

  const loadPresets = useCallback(async () => {
    setLoading(true);
    const result = await getFilterPresets();
    if (result.data) {
      setPresets(result.data);
    } else if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      toast({
        title: 'Error',
        description: 'Preset name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!hasActiveFilters(currentFilters)) {
      toast({
        title: 'Error',
        description: 'No filters to save. Apply some filters first.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const result = await saveFilterPreset(newPresetName.trim(), currentFilters);

    if (result.data) {
      setPresets([...presets, result.data]);
      setNewPresetName('');
      setShowSaveForm(false);
      toast({
        title: 'Success',
        description: 'Filter preset saved successfully',
      });
    } else if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    setSaving(false);
  };

  const handleDeletePreset = async (id: string) => {
    const result = await deleteFilterPreset(id);

    if (result.success) {
      setPresets(presets.filter((p) => p.id !== id));
      toast({
        title: 'Success',
        description: 'Filter preset deleted',
      });
    } else if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleStartEdit = (preset: FilterPreset) => {
    setEditingId(preset.id);
    setEditingName(preset.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) {
      toast({
        title: 'Error',
        description: 'Preset name is required',
        variant: 'destructive',
      });
      return;
    }

    const result = await updateFilterPreset(id, editingName.trim());

    if (result.data) {
      setPresets(presets.map((p) => (p.id === id ? result.data! : p)));
      setEditingId(null);
      setEditingName('');
      toast({
        title: 'Success',
        description: 'Preset renamed successfully',
      });
    } else if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    onLoadPreset(preset.filters);
    toast({
      title: 'Success',
      description: `Loaded preset: ${preset.name}`,
    });
  };

  const canSave = hasActiveFilters(currentFilters);

  return (
    <div className="flex flex-wrap gap-2">
      {/* Save Current Filters Button */}
      <Popover open={showSaveForm} onOpenChange={setShowSaveForm}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!canSave}
            title={!canSave ? 'Apply some filters first' : 'Save current filters as preset'}
          >
            <Save className="h-4 w-4" />
            Save Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Save Filter Preset</h4>
            <Input
              placeholder="Preset name (e.g., Remote Tech Jobs)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSavePreset();
                }
              }}
              maxLength={50}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSavePreset}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowSaveForm(false);
                  setNewPresetName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Load Presets Button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Star className="h-4 w-4" />
            Presets
            {presets.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                {presets.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Filter Presets</h4>

            {loading ? (
              <div className="text-sm text-gray-500">Loading presets...</div>
            ) : presets.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No saved presets yet.
                <br />
                Apply some filters and save them!
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {editingId === preset.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(preset.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleSaveEdit(preset.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          className="flex-1 text-left text-sm font-medium truncate"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          {preset.name}
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(preset)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDeletePreset(preset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
