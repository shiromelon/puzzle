/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Particle, ChocolateType } from '../types';
import { CHOCOLATE_DICTIONARY } from '../utils/chocolateData';

export interface ParticleLayerRef {
  spawnSparkles: (row: number, col: number, type: ChocolateType) => void;
}

export const ParticleLayer = forwardRef<ParticleLayerRef, {}>((_, ref) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Particle updates loop - runs on requestAnimationFrame at 60fps
  useEffect(() => {
    if (particles.length === 0) return;

    const frame = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity effect
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0)
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [particles]);

  const spawnSparkles = (row: number, col: number, type: ChocolateType) => {
    const info = CHOCOLATE_DICTIONARY[type];
    const newParticles: Particle[] = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: `particle_${row}_${col}_${i}_${Date.now()}_${Math.random()}`,
        x: col * 60 + 30 + (Math.random() - 0.5) * 15, // approx grid X in px
        y: row * 60 + 30 + (Math.random() - 0.5) * 15, // approx grid Y in px
        color: type === ChocolateType.COCOA_BEAN ? '#78716c' : info?.accentColor || '#f59e0b',
        emoji: Math.random() > 0.6 ? info?.emoji : undefined,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // initial upward burst
        life: 25 + Math.floor(Math.random() * 20),
        maxLife: 45,
        size: 3 + Math.random() * 6,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  };

  useImperativeHandle(ref, () => ({
    spawnSparkles,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-2xl">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            transform: `translate(-50%, -50%) scale(${p.life / p.maxLife})`,
            color: p.color,
            fontSize: `${p.size + 12}px`,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {p.emoji ? p.emoji : <Sparkles className="w-4 h-4 fill-current text-yellow-300" />}
        </div>
      ))}
    </div>
  );
});

ParticleLayer.displayName = 'ParticleLayer';
