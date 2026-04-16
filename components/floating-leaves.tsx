"use client"

import React, { useEffect, useState } from "react"

export function BackgroundParticles() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Crear un set de partículas estático para evitar re-renders innecesarios
  const particles = [...Array(50)].map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 3 + 1}px`,
    delay: `${Math.random() * 10}s`,
    duration: `${10 + Math.random() * 20}s`,
    opacity: Math.random() * 0.5 + 0.1,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-sparkle bg-foreground rounded-full"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes sparkle {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.1;
          }
          25% {
            opacity: 0.8;
            transform: translateY(-20px) translateX(10px) scale(1.2);
          }
          50% {
            opacity: 0.2;
            transform: translateY(-40px) translateX(-10px) scale(0.8);
          }
          75% {
            opacity: 0.6;
            transform: translateY(-20px) translateX(5px) scale(1.1);
          }
        }
        .animate-sparkle {
          animation: sparkle linear infinite;
        }
      `}</style>
    </div>
  )
}
