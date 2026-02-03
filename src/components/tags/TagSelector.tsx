'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { TagBadge } from './TagBadge';
import { getTags, createTag } from '@/actions/tags';
import type { Tag } from '@/types/application';
import { useToast } from '@/hooks/use-toast';

interface TagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  label?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

export function TagSelector({ selectedTagIds, onTagsChange, label = 'Tags' }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<string>(DEFAULT_COLORS[0] || '#3B82F6');
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const loadTags = useCallback(async () => {
    setLoading(true);
    const result = await getTags();
    if (result.data) {
      setTags(result.data);
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
    loadTags();
  }, [loadTags]);

  const handleToggleTag = (tagId: string) => {
    const newSelectedIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    onTagsChange(newSelectedIds);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name is required',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    const result = await createTag({
      name: newTagName.trim(),
      color: newTagColor,
    });

    if (result.data) {
      setTags([...tags, result.data]);
      setNewTagName('');
      setNewTagColor(DEFAULT_COLORS[0] || '#3B82F6');
      setShowCreateForm(false);
      toast({
        title: 'Success',
        description: 'Tag created successfully',
      });
    } else if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
    setCreating(false);
  };

  const selectedCount = selectedTagIds.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <TagIcon className="h-4 w-4" />
          {label}
          {selectedCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
              {selectedCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white">
            {label}
          </h4>

          {loading ? (
            <div className="text-sm text-gray-500">Loading tags...</div>
          ) : (
            <>
              {/* Tag list */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {tags.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No tags yet. Create your first tag!
                  </div>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTagIds.includes(tag.id)}
                        onChange={() => handleToggleTag(tag.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <TagBadge tag={tag} size="md" />
                    </label>
                  ))
                )}
              </div>

              {/* Create new tag form */}
              {showCreateForm ? (
                <div className="space-y-2 border-t pt-3">
                  <Input
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateTag();
                      }
                    }}
                    maxLength={50}
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`h-6 w-6 rounded-full border-2 ${
                            newTagColor === color
                              ? 'border-gray-900 dark:border-white'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewTagColor(color)}
                          aria-label={`Select ${color} color`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateTag}
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating ? 'Creating...' : 'Create'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewTagName('');
                        setNewTagColor(DEFAULT_COLORS[0] || '#3B82F6');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Tag
                </Button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
