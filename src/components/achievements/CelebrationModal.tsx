'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';
import { markAchievementCelebrated } from '@/actions/achievements';
import type { CelebrationData } from '@/types/achievements';

interface CelebrationModalProps {
  celebrationData: CelebrationData | null;
  onClose: () => void;
}

/**
 * CelebrationModal - Full-screen modal that celebrates user achievements
 *
 * Features:
 * - Confetti animation (auto-stops after 5s)
 * - Large emoji icon with achievement title
 * - Personalized message
 * - Auto-marks achievement as celebrated when closed
 * - Keyboard accessible (Escape to close)
 */
export function CelebrationModal({
  celebrationData,
  onClose,
}: CelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Trigger confetti when modal opens
  useEffect(() => {
    if (celebrationData) {
      setShowConfetti(true);

      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [celebrationData]);

  // Handle close and mark as celebrated
  const handleClose = async () => {
    if (celebrationData) {
      // Mark achievement as celebrated (fire-and-forget)
      markAchievementCelebrated(celebrationData.id).catch((error) => {
        console.error('Failed to mark achievement as celebrated:', error);
      });
    }

    onClose();
  };

  if (!celebrationData) {
    return null;
  }

  return (
    <>
      {/* Confetti overlay */}
      {showConfetti && <Confetti />}

      {/* Celebration dialog */}
      <Dialog open={!!celebrationData} onOpenChange={handleClose}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            {/* Large emoji icon */}
            <div className="flex justify-center mb-4">
              <span className="text-6xl" role="img" aria-label="celebration">
                {celebrationData.icon}
              </span>
            </div>

            {/* Achievement title */}
            <DialogTitle className="text-2xl font-bold text-center">
              {celebrationData.title}
            </DialogTitle>

            {/* Achievement message */}
            <DialogDescription className="text-base text-center mt-2">
              {celebrationData.message}
            </DialogDescription>
          </DialogHeader>

          {/* Action button */}
          <DialogFooter className="flex justify-center mt-4">
            <Button onClick={handleClose} size="lg" className="min-w-[150px]">
              Awesome! 🎉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
