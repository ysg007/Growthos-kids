"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export default function AnimatedCounter({
  value, duration = 1200, decimals = 0, suffix = "", prefix = "", className = ""
}: Props) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const startValRef = useRef<number>(0);

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    const startVal = display;
    startValRef.current = startVal;
    startRef.current = 0;

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(startVal + (value - startVal) * ease);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={`count-animate ${className}`}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
