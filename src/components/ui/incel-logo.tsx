import React from 'react';

interface IncelLogoProps {
  className?: string;
  size?: number;
  variant?: 'icon' | 'full'; // 'icon' for just circles, 'full' for logo with text
}

/**
 * IncelGlobal Logo Component
 * Displays the full IncelGlobal logo with four circles, "IncelGlobal" text, and "...adding value" tagline
 * Supports both size prop and className (for Tailwind w-* h-* classes)
 * Background is completely transparent
 */
export function IncelLogo({ className = '', size, variant = 'full' }: IncelLogoProps) {
  // Extract size from className if provided (e.g., "w-6 h-6" -> 24px)
  let finalSize = size;
  if (!finalSize && className) {
    const widthMatch = className.match(/w-(\d+)/);
    const heightMatch = className.match(/h-(\d+)/);
    if (widthMatch) {
      finalSize = parseInt(widthMatch[1]) * 4; // Tailwind: w-6 = 24px (6 * 4)
    } else if (heightMatch) {
      finalSize = parseInt(heightMatch[1]) * 4;
    }
  }
  
  // Default size if neither size prop nor className size found
  if (!finalSize) {
    finalSize = variant === 'full' ? 200 : 32; // Larger default for full logo
  }
  
  // For full logo, use fixed viewBox dimensions for consistent scaling
  // For icon, use square dimensions
  const logoWidth = variant === 'full' ? 200 : finalSize;
  const logoHeight = variant === 'full' ? 75 : finalSize; // Increased height with padding to show full tagline
  
  // Circle dimensions - scale based on variant
  const circleSize = variant === 'full' ? 40 : finalSize / 2;
  const gap = circleSize * 0.1; // Small gap between circles
  
  // Text positioning for full logo - adjusted to fit within viewBox with proper spacing
  const textX = variant === 'full' ? 60 : 0;
  const textY = variant === 'full' ? 28 : 0;
  const taglineY = variant === 'full' ? 52 : 0; // Positioned with room for descenders
  
  // Calculate actual rendered dimensions - for full logo, maintain aspect ratio
  const renderedWidth = variant === 'full' ? (size || 200) : logoWidth;
  const renderedHeight = variant === 'full' ? ((size || 200) * logoHeight / logoWidth) : logoHeight;
  
  return (
    <svg
      width={renderedWidth}
      height={renderedHeight}
      viewBox={`0 0 ${logoWidth} ${logoHeight}`}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ backgroundColor: 'transparent' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Four circles in 2x2 grid */}
      {/* Top-left circle - dark gray */}
      <circle
        cx={circleSize / 2 + gap}
        cy={circleSize / 2 + gap}
        r={circleSize / 2 - gap}
        fill="#4A4A4A"
      />
      {/* Top-right circle - red */}
      <circle
        cx={circleSize * 1.5 + gap}
        cy={circleSize / 2 + gap}
        r={circleSize / 2 - gap}
        fill="#DC2626"
      />
      {/* Bottom-left circle - orange/brown */}
      <circle
        cx={circleSize / 2 + gap}
        cy={circleSize * 1.5 + gap}
        r={circleSize / 2 - gap}
        fill="#D97706"
      />
      {/* Bottom-right circle - dark gray */}
      <circle
        cx={circleSize * 1.5 + gap}
        cy={circleSize * 1.5 + gap}
        r={circleSize / 2 - gap}
        fill="#4A4A4A"
      />
      
      {/* Full logo text - only show if variant is 'full' */}
      {variant === 'full' && (
        <>
          {/* "IncelGlobal" text - dark gray serif, I and G capitalized */}
          <text
            x={textX}
            y={textY}
            fontSize="22"
            fontFamily="Georgia, serif"
            fill="#4A4A4A"
            fontWeight="400"
          >
            I<tspan>ncel</tspan>G<tspan>lobal</tspan>
          </text>
          
          {/* "...adding value" tagline - red italicized serif */}
          <text
            x={textX + 8}
            y={taglineY}
            fontSize="11"
            fontFamily="Georgia, serif"
            fontStyle="italic"
            fill="#DC2626"
            fontWeight="400"
          >
            ...adding value
          </text>
        </>
      )}
    </svg>
  );
}

