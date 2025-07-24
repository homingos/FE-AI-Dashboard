"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface Line {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const NUM_STARS = 100;
const CONNECTION_DISTANCE = 150;

export const AnimatedBackground = () => {
  const [stars, setStars] = React.useState<Star[]>([]);
  const [lines, setLines] = React.useState<Line[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- THIS IS THE NEW LOGIC FOR THE CURSOR LAG EFFECT ---
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  // Create spring-animated values that will "chase" the mouse position
  const springConfig = { damping: 40, stiffness: 200, mass: 2 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Transform the spring values into a CSS radial-gradient string
  const background = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(600px at ${x}px ${y}px, rgba(29, 78, 216, 0.15), transparent 80%)`
  );

  useEffect(() => {
    // Initialize stars
    const newStars: Star[] = [];
    for (let i = 0; i < NUM_STARS; i++) {
      newStars.push({ id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 1.5 + 0.5 });
    }
    setStars(newStars);

    // Update motion values on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    // This effect can remain the same
    const newLines: Line[] = [];
    if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const star1 = stars[i];
            const star2 = stars[j];
            const x1_px = (star1.x / 100) * width;
            const y1_px = (star1.y / 100) * height;
            const x2_px = (star2.x / 100) * width;
            const y2_px = (star2.y / 100) * height;
            const distance = Math.sqrt(Math.pow(x1_px - x2_px, 2) + Math.pow(y1_px - y2_px, 2));
            if (distance < CONNECTION_DISTANCE) {
              newLines.push({ id: `${star1.id}-${star2.id}`, x1: star1.x, y1: star1.y, x2: star2.x, y2: star2.y });
            }
          }
        }
    }
    setLines(newLines);
  }, [stars]);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 h-full w-full bg-black overflow-hidden">
      <div className="aurora-bg" />
      <div className="grid-bg" />
      <svg className="absolute inset-0 h-full w-full mix-blend-screen">
        {stars.map((star) => ( <motion.circle key={star.id} cx={`${star.x}vw`} cy={`${star.y}vh`} r={star.size} className="star" style={{ '--delay': `${Math.random() * 5}s` } as React.CSSProperties} /> ))}
        {lines.map((line) => ( <motion.line key={line.id} x1={`${line.x1}vw`} y1={`${line.y1}vh`} x2={`${line.x2}vw`} y2={`${line.y2}vh`} className="constellation-line" style={{ '--delay': `${Math.random() * 3}s` } as React.CSSProperties} /> ))}
      </svg>
      {/* This motion.div now uses the "background" motion value which is spring-animated */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-30"
        style={{ background }}
      />
    </div>
  );
};