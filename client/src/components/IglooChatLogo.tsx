import React from 'react';

interface IglooChatLogoProps {
  className?: string;
  size?: number;
  withGradient?: boolean;
}

export const IglooChatLogo: React.FC<IglooChatLogoProps> = ({
  className = 'w-7 h-7',
  size = 28,
  withGradient = true
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="iglooIceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="iglooDoorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <filter id="iglooFrostGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38BDF8" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Main Igloo Chat Bubble Body */}
      <path
        d="M 50 16 C 28 16 14 34 14 56 C 14 66 18 74 24 78 L 16 90 L 32 84 C 37 86 43 87 50 87 C 72 87 86 69 86 56 C 86 34 72 16 50 16 Z"
        fill={withGradient ? 'url(#iglooIceGrad)' : 'currentColor'}
        filter="url(#iglooFrostGlow)"
      />

      {/* Ice Block Seams / Lines */}
      {/* Upper ring seam */}
      <path
        d="M 28 40 Q 50 34 72 40"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      {/* Lower ring seam */}
      <path
        d="M 20 58 Q 50 50 80 58"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />

      {/* Vertical seams (staggered bricks) */}
      <path d="M 50 17 L 50 36" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
      <path d="M 38 38 L 38 53" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
      <path d="M 62 38 L 62 53" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />
      <path d="M 27 57 L 27 75" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.75" />

      {/* Igloo Arch Tunnel Entrance */}
      <path
        d="M 46 87 L 46 64 C 46 58 64 58 64 64 L 64 87 Z"
        fill="url(#iglooDoorGrad)"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.9"
      />

      {/* Inner Entrance Cozy Frost Light */}
      <ellipse
        cx="55"
        cy="76"
        rx="5"
        ry="7"
        fill="#38BDF8"
        opacity="0.9"
      />
      <circle
        cx="55"
        cy="76"
        r="2.5"
        fill="#FFFFFF"
      />
    </svg>
  );
};
