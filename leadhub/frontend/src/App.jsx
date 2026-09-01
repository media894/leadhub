import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import EmailInbox from './pages/EmailInbox';
import WhatsappLink from './pages/WhatsappLink';
import BulkMail from './pages/BulkMail';
import Settings from './pages/Settings';

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function OnboardingGate({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [completed, setCompleted] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      if (!user) {
        if (isMounted) setChecking(false);
        return;
      }
      try {
        const { data } = await api.get('/settings/status');
        if (isMounted) {
          setCompleted(data.isCompleted);
        }
      } catch (err) {
        if (isMounted) setCompleted(false);
      } finally {
        if (isMounted) setChecking(false);
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [user, location.pathname]);

  if (!user) return <Navigate to="/login" replace />;

  if (user.email?.toLowerCase() === 'natasha@oddinfotech.com') {
    return children;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-slate text-sm font-medium">
        Verifying system configuration...
      </div>
    );
  }

  if (!completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/onboarding"
        element={
          <Protected>
            <Onboarding />
          </Protected>
        }
      />
      <Route
        path="/dashboard"
        element={
          <OnboardingGate>
            <Dashboard />
          </OnboardingGate>
        }
      />
      <Route
        path="/inbox"
        element={
          <Protected>
            <EmailInbox />
          </Protected>
        }
      />
      <Route
        path="/whatsapp-link"
        element={
          <Protected>
            <WhatsappLink />
          </Protected>
        }
      />
      <Route
        path="/bulk-mail"
        element={
          <Protected>
            <BulkMail />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <Settings />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
