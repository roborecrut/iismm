import React from 'react';
import { motion } from 'motion/react';

interface ShinyLogoProps {
  height?: number;
  className?: string;
  largeHero?: boolean;
}

export default function ShinyLogo({ height = 40, className = '', largeHero = false }: ShinyLogoProps) {
  // Direct transparent image URL from file storage (ID 9)
  const logoUrl = "/file/9/iismmlogo.png";
  
  // Real aspect ratio of the 1058x262 image is ~4.038
  const actualHeight = largeHero ? 96 : height;
  const width = Math.round(actualHeight * 4.038); 

  return (
    <div 
      className={`relative select-none flex items-center justify-center overflow-hidden ${className}`} 
      style={{ 
        height: `${actualHeight}px`, 
        width: `${width}px`,
        maxWidth: '100%'
      }}
    >
      {/* Base transparent logo image (always guarantees crisp display of the original PNG) */}
      <img
        src={logoUrl}
        alt="ИИSMM"
        referrerPolicy="no-referrer"
        style={{ width: '100%', height: '100%' }}
        className="object-contain"
      />

      {/* Glossy Overlay - Animate a diagonal shine bar using absolute position and CSS masking */}
      {/* The mask guarantees that the shine ONLY appears on the non-transparent pixels of the logo image! */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          WebkitMaskImage: `url(${logoUrl})`,
          maskImage: `url(${logoUrl})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      >
        {/* Sliding shimmering hot glow */}
        <motion.div
          className="absolute h-full w-2/3 top-0"
          style={{
            background: 'linear-gradient(110deg, rgba(255, 255, 255, 0) 10%, rgba(255, 255, 255, 0.2) 25%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 255, 255, 0.25) 75%, rgba(255, 255, 255, 0) 90%)',
            mixBlendMode: 'overlay',
          }}
          animate={{
            left: ['-100%', '150%']
          }}
          transition={{
            duration: 3.5, // Sweep animation speed
            repeat: Infinity,
            repeatDelay: 1.5, // Periodic pause
            ease: "easeInOut"
          }}
        />

        {/* Second faint gold sparkle follow-up */}
        <motion.div
          className="absolute h-full w-1/2 top-0"
          style={{
            background: 'linear-gradient(110deg, rgba(255, 215, 0, 0) 10%, rgba(255, 215, 0, 0.15) 30%, rgba(255, 240, 150, 0.8) 55%, rgba(255, 215, 0, 0.1) 80%, rgba(255, 215, 0, 0) 90%)',
            mixBlendMode: 'color-dodge',
          }}
          animate={{
            left: ['-100%', '160%']
          }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            repeatDelay: 1.2,
            ease: "easeInOut"
          }}
        />
      </div>
    </div>
  );
}
