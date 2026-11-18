import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './context/ToastContext';
import { LoadingProvider } from './context/LoadingContext';
import { GlobalLoader } from './components/common/GlobalLoader';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <LoadingProvider>
          <AuthProvider>
            <AppRoutes />
            <GlobalLoader />
          </AuthProvider>
        </LoadingProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
