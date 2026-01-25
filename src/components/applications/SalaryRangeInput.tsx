'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreateApplicationInput } from '@/schemas/application';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SalaryRangeInputProps {
  form: UseFormReturn<CreateApplicationInput>;
}

const currencies = [
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'CAD', label: '$ CAD' },
  { value: 'AUD', label: '$ AUD' },
];

/**
 * SalaryRangeInput - Compound input for salary range (min, max, currency)
 * Integrates with React Hook Form for validation and state management
 */
export function SalaryRangeInput({ form }: SalaryRangeInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Salary Range
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Minimum Salary */}
        <FormField
          control={form.control}
          name="salary_range.min"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  type="number"
                  placeholder="Min"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? Number(value) : undefined);
                  }}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <span className="self-center text-gray-500 hidden sm:block">to</span>

        {/* Maximum Salary */}
        <FormField
          control={form.control}
          name="salary_range.max"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  type="number"
                  placeholder="Max"
                  inputMode="numeric"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? Number(value) : undefined);
                  }}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Currency */}
        <FormField
          control={form.control}
          name="salary_range.currency"
          render={({ field }) => (
            <FormItem className="w-full sm:w-32">
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || 'USD'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
