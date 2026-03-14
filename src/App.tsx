import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './stores/useAuthStore';
import { ErrorBoundary } from './ui/ErrorBoundary';

const Home        = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Login       = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const WorldSelect = lazy(() => import('./pages/WorldSelect').then((m) => ({ default: m.WorldSelect })));
const Castle      = lazy(() => import('./pages/Castle').then((m) => ({ default: m.Castle })));
const World       = lazy(() => import('./pages/World').then((m) => ({ default: m.World })));
const Alliance    = lazy(() => import('./pages/Alliance').then((m) => ({ default: m.Alliance })));
const Profile     = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-castle-dark flex flex-col items-center justify-center gap-4">
      <div className="text-6xl animate-pulse-slow">??</div>
      <p className="font-medieval text-castle-gold text-xl">Carregando...</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user    = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  useAuth();
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/world-select"  element={<ProtectedRoute><WorldSelect /></ProtectedRoute>} />
        <Route path="/castle"        element={<ProtectedRoute><Castle /></ProtectedRoute>} />
        <Route path="/world"         element={<ProtectedRoute><World /></ProtectedRoute>} />
        <Route path="/alliance"      element={<ProtectedRoute><Alliance /></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
