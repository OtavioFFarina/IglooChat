import React from 'react';

interface ConcordLogoProps {
  className?: string;
  size?: number;
  withGradient?: boolean;
}

export const ConcordLogo: React.FC<ConcordLogoProps> = ({
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
        <linearGradient id="concordGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#5865F2" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient id="concordWingGrad" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDE1FF" />
        </linearGradient>
        <filter id="concordGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#5865F2" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer Stylized Aerodynamic Harmonic "C" Ring */}
      <path
        d="M68 22 C 55 12, 35 14, 24 25 C 11 38, 11 62, 24 75 C 35 86, 55 88, 68 78 C 73 74, 73 67, 68 63 C 64 59, 58 60, 54 64 C 45 71, 33 69, 26 62 C 18 53, 18 37, 26 28 C 33 21, 45 19, 54 26 C 58 30, 64 31, 68 27 C 73 23, 73 16, 68 22 Z"
        fill={withGradient ? 'url(#concordGrad)' : 'currentColor'}
        filter="url(#concordGlow)"
      />

      {/* Supersonic Harmonic Forward Wings / Sound Resonance Chevrons */}
      {/* Wave 1: Central Vocal Core */}
      <path
        d="M48 38 C 43 43, 43 57, 48 62 C 51 65, 56 65, 59 61 C 62 57, 61 52, 57 49 C 55 47, 55 43, 58 40 C 61 37, 60 32, 56 30 C 52 28, 49 34, 48 38 Z"
        fill={withGradient ? 'url(#concordGrad)' : 'currentColor'}
        opacity="0.9"
      />

      {/* Wave 2: Supersonic Wing Crest (Aerodynamic Arrow Node) */}
      <path
        d="M74 38 L88 50 L74 62 C 70 65, 65 62, 65 57 L65 43 C 65 38, 70 35, 74 38 Z"
        fill={withGradient ? 'url(#concordGrad)' : 'currentColor'}
      />

      {/* Inner Resonance Center Dot */}
      <circle
        cx="44"
        cy="50"
        r="4.5"
        fill={withGradient ? '#FFFFFF' : 'currentColor'}
      />
    </svg>
  );
};
