import { useEffect, useRef } from 'react';

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  duration?: number;
}

/**
 * Simple confetti effect using CSS animations
 * Creates falling particles when triggered
 */
export function useConfetti() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const trigger = (options: ConfettiOptions = {}) => {
    const {
      particleCount = 50,
      spread = 360,
      origin = { x: 0.5, y: 0.5 },
      colors = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444'],
      duration = 3000,
    } = options;

    if (!containerRef.current) {
      // Create container if it doesn't exist
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '9999';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);
      containerRef.current = container;
    }

    const container = containerRef.current;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 8 + 4;
      const startX = origin.x * window.innerWidth;
      const startY = origin.y * window.innerHeight;
      const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
      const velocity = Math.random() * 400 + 200;
      const endX = startX + Math.cos(angle) * velocity;
      const endY = startY + Math.sin(angle) * velocity + Math.random() * 400 + 200;
      const rotation = Math.random() * 720 - 360;

      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = color;
      particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
      particle.style.opacity = '1';
      particle.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;

      container.appendChild(particle);

      // Trigger animation
      requestAnimationFrame(() => {
        particle.style.left = `${endX}px`;
        particle.style.top = `${endY}px`;
        particle.style.opacity = '0';
        particle.style.transform = `rotate(${rotation}deg) scale(0.5)`;
      });

      // Remove particle after animation
      setTimeout(() => {
        particle.remove();
      }, duration);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.remove();
        containerRef.current = null;
      }
    };
  }, []);

  return { trigger };
}
