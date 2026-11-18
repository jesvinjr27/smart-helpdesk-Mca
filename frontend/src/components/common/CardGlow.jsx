import React from 'react';

/**
 * CardGlow - Reusable card component featuring the official four-edge
 * radial gradient glow (rgb(25, 67, 80) and rgb(53, 88, 114)) with
 * a pure cream center (rgb(247, 248, 240)).
 */
export const CardGlow = ({
  children,
  className = '',
  interactive = false,
  padding = 'p-5 sm:p-6',
  onClick,
  ...props
}) => {
  const baseClass = interactive ? 'card-glow-interactive' : 'card-glow';

  return (
    <div
      onClick={onClick}
      className={`${baseClass} ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default CardGlow;
