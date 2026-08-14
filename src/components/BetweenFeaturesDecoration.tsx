import React from 'react';

interface BetweenFeaturesDecorationProps {
  index: number; // to vary the styling or offset slightly if needed
}

export const BetweenFeaturesDecoration: React.FC<BetweenFeaturesDecorationProps> = ({ index }) => {
  // We can vary colors based on index to create an incredibly lively design rhythm!
  const isAltColor = index % 2 === 0;
  const primaryColor = isAltColor ? '#f97316' : '#ec4899'; // Orange-500 : Pink-500
  const secondaryColor = isAltColor ? '#3b82f6' : '#10b981'; // Blue-500 : Emerald-500
  const glowShadow = isAltColor ? 'rgba(249, 115, 22, 0.4)' : 'rgba(236, 72, 153, 0.4)';

  // Unique identifier to prevent style tags from stepping on each other
  const uniqueId = `decor-style-${index}`;

  return (
    <div className="relative h-0 select-none pointer-events-none overflow-visible w-full flex justify-center items-center z-30">
      {/* Scope-contained custom styling for coordinates & keyframe animation as requested */}
      <style>{`
        #${uniqueId} .anim-container {
          display: block;
          position: relative;
          width: 780px;
          height: 120px;
          margin: 0 auto;
        }

        #${uniqueId} .lightning-container {
          position: absolute;
          top: 50%;
          left: 40px;
          display: flex;
          transform: translateY(-50%);
          width: calc(100% - 80px);
        }

        #${uniqueId} .lightning {
          position: absolute;
          display: block;
          height: 10px;
          width: 10px;
          border-radius: 10px;
          transform-origin: 5px 5px;

          animation-name: woosh-${index};
          animation-duration: 2.2s;
          animation-iteration-count: infinite;
          animation-timing-function: cubic-bezier(0.445, 0.050, 0.550, 0.950);
          animation-direction: alternate;
        }

        #${uniqueId} .lightning.white {
          background-color: ${primaryColor};
          box-shadow: 0px 0px 14px 4px ${glowShadow};
        }

        #${uniqueId} .lightning.red {
          background-color: #ffffff;
          box-shadow: 0px 0px 10px 3px rgba(255, 255, 255, 0.9);
          animation-delay: 0.25s;
        }

        #${uniqueId} .boom-container {
          position: absolute;
          display: flex;
          width: 80px;
          height: 80px;
          text-align: center;
          align-items: center;
          transform: translateY(-50%);
          left: 190px;
          top: -20px;
        }

        #${uniqueId} .boom-container.second {
          left: 480px;
          top: 135px;
        }

        #${uniqueId} .shape {
          display: inline-block;
          position: relative;
          opacity: 0;
          transform-origin: center center;
        }

        #${uniqueId} .shape.triangle {
          width: 0;
          height: 0;
          border-style: solid;
          transform-origin: 50% 80%;
          animation-duration: 1s;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
          margin-left: -15px;
          border-width: 0 4px 8px 4px;
          border-color: transparent transparent ${secondaryColor} transparent;
          animation-name: boom-triangle-${index};
        }

        #${uniqueId} .shape.triangle.big {
          margin-left: -25px;
          border-width: 0 6px 12px 6px;
          border-color: transparent transparent #f59e0b transparent; /* Amber-500 */
          animation-name: boom-triangle-big-${index};
        }

        #${uniqueId} .shape.disc {
          width: 10px;
          height: 10px;
          border-radius: 100%;
          background-color: ${primaryColor};
          animation-name: boom-disc-${index};
          animation-duration: 1s;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
        }

        #${uniqueId} .shape.circle {
          width: 24px;
          height: 24px;
          animation-name: boom-circle-${index};
          animation-duration: 1s;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
          border-radius: 100%;
          margin-left: -35px;
        }

        #${uniqueId} .shape.circle.white {
          border: 1.5px solid ${primaryColor};
        }

        #${uniqueId} .shape.circle.big {
          width: 44px;
          height: 44px;
          margin-left: 0px;
        }

        #${uniqueId} .shape.circle.big.white {
          border: 2px solid #8b5cf6; /* Purple-500 */
        }

        #${uniqueId} .shape.triangle, 
        #${uniqueId} .shape.circle, 
        #${uniqueId} .shape.circle.big, 
        #${uniqueId} .shape.disc {
          animation-delay: 0.5s;
          animation-duration: 2.2s;
        }

        #${uniqueId} .shape.circle {
          animation-delay: 0.75s;
        }

        #${uniqueId} .boom-container.second .shape.triangle,
        #${uniqueId} .boom-container.second .shape.circle,
        #${uniqueId} .boom-container.second .shape.circle.big,
        #${uniqueId} .boom-container.second .shape.disc {
          animation-delay: 1.6s;
        }

        #${uniqueId} .boom-container.second .shape.circle {
          animation-delay: 1.85s;
        }

        @keyframes woosh-${index} {
          0% {
            width: 10px;
            transform: translate(0px, 0px) rotate(-22deg);
          }
          15% {
            width: 45px;
          }
          30% {
            width: 10px;
            transform: translate(170px, -70px) rotate(-22deg);
          }
          30.1% {
            transform: translate(170px, -70px) rotate(28deg);
          }
          50% {
            width: 90px;
          }
          70% {
            width: 10px;
            transform: translate(440px, 75px) rotate(28deg);
          }
          70.1% {
            transform: translate(440px, 75px) rotate(-24deg);
          }
          85% {
            width: 45px;
          }
          100% {
            width: 10px;
            transform: translate(680px, 0px) rotate(-24deg);
          }
        }

        @keyframes boom-circle-${index} {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          5% {
            opacity: 1;
          }
          40% {
            opacity: 0;
            transform: scale(2.4);
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes boom-triangle-big-${index} {
          0% {
            opacity: 0;
            transform: scale(0.8) translate(0, 0) rotate(0deg);
          }
          5% {
            opacity: 1;
          }
          50% {
            opacity: 0;
            transform: scale(2.2) translate(40px, -30px) rotate(180deg);
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes boom-triangle-${index} {
          0% {
            opacity: 0;
            transform: scale(0.8) translate(0, 0) rotate(0deg);
          }
          5% {
            opacity: 1;
          }
          40% {
            opacity: 0;
            transform: scale(2.5) translate(20px, 30px) rotate(240deg);
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes boom-disc-${index} {
          0% {
            opacity: 0;
            transform: scale(0.8) translate(0, 0);
          }
          5% {
            opacity: 1;
          }
          50% {
            opacity: 0;
            transform: scale(1.8) translate(-40px, -20px);
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>

      {/* Outer scaling wrapper so the 780px coordinate layout never overflows mobile screens */}
      <div 
        id={uniqueId} 
        className="absolute w-full flex justify-center scale-50 sm:scale-75 md:scale-95 lg:scale-100 transition-transform duration-300 origin-center"
      >
        <div className="anim-container">
          {/* Subtle curved connector link trace */}
          <svg className="absolute inset-0 w-full h-full text-slate-200/60" fill="none" viewBox="0 0 780 120">
            {/* The primary path matching the woosh trajectory coordinates */}
            <path 
              d="M 40 60 Q 125 15, 210 25 T 380 40 T 520 100 T 680 60 L 720 60" 
              className="stroke-slate-200/50" 
              strokeWidth="2" 
              strokeDasharray="4 6" 
            />
            {/* Ambient pulse node anchors */}
            <circle cx="40" cy="60" r="4" fill={primaryColor} />
            <circle cx="40" cy="60" r="10" stroke={primaryColor} strokeWidth="1.5" className="animate-ping" opacity="0.3" />
            <circle cx="720" cy="60" r="4" fill={secondaryColor} />
            <circle cx="720" cy="60" r="10" stroke={secondaryColor} strokeWidth="1.5" className="animate-ping" opacity="0.3" />
          </svg>

          {/* Lightning swoosh bolts */}
          <div className="lightning-container">
            <div className="lightning white"></div>
            <div className="lightning red"></div>
          </div>

          {/* First boom point (at coords connected to woosh trajectory) */}
          <div className="boom-container">
            <div className="shape circle white"></div>
            <div className="shape circle big white"></div>
            <div className="shape triangle"></div>
            <div className="shape triangle big"></div>
            <div className="shape disc"></div>
          </div>

          {/* Second boom point */}
          <div className="boom-container second">
            <div className="shape circle white"></div>
            <div className="shape circle big white"></div>
            <div className="shape triangle animate-bounce"></div>
            <div className="shape triangle big"></div>
            <div className="shape disc"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
