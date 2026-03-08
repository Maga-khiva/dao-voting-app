import React from 'react';

export const Logo = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="glacier-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {/* Ice Block Shape */}
      <path 
        d="M50 10L85 30V70L50 90L15 70V30L50 10Z" 
        fill="url(#glacier-grad)" 
        fillOpacity="0.2"
        stroke="url(#glacier-grad)"
        strokeWidth="2"
      />
      {/* Inner Crystal */}
      <path 
        d="M50 25L75 40V60L50 75L25 60V40L50 25Z" 
        fill="url(#glacier-grad)"
        filter="url(#glow)"
      />
      {/* Shimmer Line */}
      <path 
        d="M30 35L50 25L70 35" 
        stroke="white" 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeOpacity="0.5"
      />
    </svg>
  );
};

export default Logo;