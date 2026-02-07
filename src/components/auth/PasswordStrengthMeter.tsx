'use client';

import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  PASSWORD_MIN_LENGTH,
  HAS_UPPERCASE,
  HAS_LOWERCASE,
  HAS_NUMBER,
  getPasswordStrength,
} from '@/schemas/auth';

interface PasswordStrengthMeterProps {
  password: string;
}

const strengthConfig = {
  weak: { color: 'bg-red-500', value: 25, label: 'Weak' },
  fair: { color: 'bg-orange-500', value: 50, label: 'Fair' },
  good: { color: 'bg-yellow-500', value: 75, label: 'Good' },
  strong: { color: 'bg-green-500', value: 100, label: 'Strong' },
} as const;

export default function PasswordStrengthMeter({
  password,
}: PasswordStrengthMeterProps) {
  const strength = getPasswordStrength(password);
  const config = strengthConfig[strength];

  const rules = [
    {
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      label: 'One uppercase letter',
      met: HAS_UPPERCASE.test(password),
    },
    {
      label: 'One lowercase letter',
      met: HAS_LOWERCASE.test(password),
    },
    {
      label: 'One number',
      met: HAS_NUMBER.test(password),
    },
  ];

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={`font-medium ${
              strength === 'strong'
                ? 'text-green-600 dark:text-green-400'
                : strength === 'good'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : strength === 'fair'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-red-600 dark:text-red-400'
            }`}
          >
            {config.label}
          </span>
        </div>
        <div className="relative">
          <Progress value={config.value} className="h-2" />
          <div
            className={`absolute inset-0 h-2 rounded-full transition-all duration-300 ${config.color}`}
            style={{ width: `${config.value}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1">
        {rules.map((rule) => (
          <li key={rule.label} className="flex items-center gap-2 text-xs">
            {rule.met ? (
              <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            ) : (
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span
              className={
                rule.met
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-muted-foreground'
              }
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
