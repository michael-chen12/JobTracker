'use client';

import React from 'react';

/**
 * Confetti component - renders animated confetti particles
 * Used in celebration modals to create a festive effect
 */
export function Confetti() {
  // Generate 50 confetti particles with random positioning
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // Random horizontal position (0-100%)
    delay: Math.random() * 3, // Random animation delay (0-3s)
    color: [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-purple-500',
    ][Math.floor(Math.random() * 5)], // Random color from 5 options
  }));

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[100]"
      aria-hidden="true"
    >
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute w-2 h-2 ${piece.color} animate-confetti`}
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
