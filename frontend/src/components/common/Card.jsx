import React from 'react';

/**
 * Card - Reusable card component featuring the refined, subtle four-edge
 * radial gradient glow (rgb(25, 67, 80) and rgb(53, 88, 114)) calibrated
 * at ~35-45% intensity, with a pure cream center (rgb(247, 248, 240)).
 */
export const Card = ({
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

export default Card;
