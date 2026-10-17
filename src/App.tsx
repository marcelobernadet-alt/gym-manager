import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { ClientShell } from './components/Client/ClientShell';
import { OwnerShell } from './components/Owner/OwnerShell';
import { FullScreenSpinner } from './components/ui/Spinner';

const App: React.FC = () => {
  const { session, profile, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!session) return <LoginScreen />;
  if (!profile) return <FullScreenSpinner />;

  return profile.role === 'owner' ? <OwnerShell /> : <ClientShell />;
};

export default App;
