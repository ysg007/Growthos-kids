"use client";
import { useCallback } from "react";

const COLORS = ["#6E51FF","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4"];

export function useConfetti() {
  return useCallback((originX?: number, originY?: number) => {
    const x = originX ?? window.innerWidth / 2;
    const y = originY ?? window.innerHeight / 2;
    Array.from({ length: 24 }).forEach((_, i) => {
      const el = document.createElement("div");
      el.className = "confetti-particle";
      const size = 6 + Math.random() * 8;
      el.style.cssText = `
        width:${size}px; height:${size}px;
        background:${COLORS[i % COLORS.length]};
        left:${x + (Math.random() - 0.5) * 80}px;
        top:${y + (Math.random() - 0.5) * 40}px;
        animation-delay:${Math.random() * 0.15}s;
        animation-duration:${0.8 + Math.random() * 0.6}s;
        transform-origin: center;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    });
  }, []);
}

export default function ConfettiBurst({ x, y, trigger }: { x: number; y: number; trigger: boolean }) {
  const fire = useConfetti();
  if (trigger) fire(x, y);
  return null;
}
