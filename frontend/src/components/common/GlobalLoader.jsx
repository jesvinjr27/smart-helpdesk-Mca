import React from 'react';
import { useLoading } from '../../context/LoadingContext';
import { LoadingOverlay } from './LoadingOverlay';

/**
 * GlobalLoader
 * Singleton component placed at the application root (App.jsx) that automatically
 * toggles the LoadingOverlay whenever API requests are in progress.
 */
export function GlobalLoader() {
  const { isLoading } = useLoading();

  return (
    <LoadingOverlay
      isVisible={isLoading}
      message="Processing..."
      width={110}
      height={75}
      blocking={true}
    />
  );
}

export default GlobalLoader;
