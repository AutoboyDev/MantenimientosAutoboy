import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { NotFound } from './components/NotFound';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<'ADMIN' | '404'>('ADMIN');

  if (!isAuthenticated) {
    return <Login />;
  }

  if (view === '404') {
    return <NotFound onGoToQuery={() => setView('ADMIN')} />;
  }

  return <AdminPanel onGoTo404={() => setView('404')} />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
