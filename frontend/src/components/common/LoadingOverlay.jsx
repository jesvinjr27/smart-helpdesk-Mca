import React from 'react';

/**
 * InfinityLoader
 * Infinity loop animated SVG matching the exact vector and animation rules.
 * Uses CSS loop and raise animations for the 3D over-under infinity weave.
 */
export function InfinityLoader({ width = 110, height = 75, className = '' }) {
  return (
    <svg
      className={`finny ${className}`}
      viewBox="-1 -1 12 8"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'visible',
      }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Loading animation"
    >
      <defs>
        <path
          id="infinite"
          d="M5 3C4 2 3.1 1 2 1a2 2 0 000 4c1.1 0 2-1 3-2s1.9-2 3-2a2 2 0 010 4C6.9 5 6 4 5 3"
        />
        <radialGradient id="sgrad" gradientUnits="userSpaceOnUse" cx="5" cy="3" r="3.4">
          <stop offset=".25" stopColor="#000" />
          <stop offset=".9" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <path
          id="shad1"
          className="clip-shadow"
          d="M4.5 2.5C3.7 1.7 2.9 1 2 1m6 4c-1 0-1.7-.7-2.5-1.5"
        />
      </defs>
      <use href="#infinite" className="fbottom" />
      <use href="#shad1" className="shad even" />
      <g className="shad odd">
        <use href="#shad1" transform="translate(0 6) scale(1 , -1)" />
      </g>
      <use href="#infinite" className="ll" />
    </svg>
  );
}

/**
 * LoadingOverlay
 * Renders the centered animated infinity loader over a subtle semi-transparent backdrop.
 * Prevents accidental user interaction with the application while blocking requests are in flight.
 */
export function LoadingOverlay({
  isVisible = true,
  message = 'Processing...',
  width = 110,
  height = 75,
  blocking = true,
}) {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-200 ease-in-out ${
        blocking ? 'pointer-events-auto select-none' : 'pointer-events-none'
      } bg-slate-900/40 backdrop-blur-[2px]`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center justify-center px-8 py-6 rounded-2xl bg-[#F7F8F0]/95 dark:bg-[#1E293B]/95 shadow-2xl border border-[#355872]/20 dark:border-slate-700/60 max-w-xs mx-4 transform transition-transform duration-200 scale-100">
        <div className="relative flex items-center justify-center my-1">
          <InfinityLoader width={width} height={height} />
        </div>
        {message && (
          <p className="mt-3 text-xs font-semibold tracking-wider uppercase text-[#355872] dark:text-slate-300 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default LoadingOverlay;
