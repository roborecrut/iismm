import React, { useState, useEffect } from 'react';

export default function LiquidGlassBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse positions (-1 to 1) for a gentle parallax shift
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Hardware-accelerated sliding custom pastel gradient canvas (Kayac concept) */}
      <div 
        className="absolute inset-x-0 top-0 transition-transform duration-1000 ease-out"
        style={{
          height: '1000vh',
          transform: `translate(${mousePos.x * -11}px, calc(${-450 + mousePos.y * -11}vh + 450vh))`
        }}
      >
        <div className="kayac-pastel-gradient-canvas" />
      </div>

      {/* Glass Frosting Grid Overlay */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_72%)]"
      />
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.73)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.73)_1px,transparent_1px)] bg-[size:32px_32px]"
      />
    </div>
  );
}
