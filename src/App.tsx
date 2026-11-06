import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './components/HomeScreen';
import { useKeyboard } from './hooks/useKeyboard';

export const App: React.FC = () => {
  const [showHome, setShowHome] = useState(true);

  // Hook keyboard listeners only when inside workspace or globally
  useKeyboard();

  useEffect(() => {
    const handleOpenHome = () => setShowHome(true);
    window.addEventListener('cardboardcad:open-home', handleOpenHome);
    return () => window.removeEventListener('cardboardcad:open-home', handleOpenHome);
  }, []);

  if (showHome) {
    return (
      <HomeScreen
        onEnterWorkspace={() => setShowHome(false)}
        onCreateProject={() => setShowHome(false)}
      />
    );
  }

  return <AppShell />;
};

export default App;
