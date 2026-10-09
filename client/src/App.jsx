import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RequireRole } from './routes/RequireRole';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BusinessDashboard } from './pages/business/BusinessDashboard';
import { CountersPage } from './pages/business/CountersPage';
import { BusinessSettingsPage } from './pages/business/BusinessSettingsPage';
import { DiscoverPage } from './pages/customer/DiscoverPage';
import { MyQueuePage } from './pages/customer/MyQueuePage';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/discover" element={<DiscoverPage />} />

              {/* Customer Protected Routes */}
              <Route
                path="/my-queue"
                element={
                  <RequireRole role="customer">
                    <MyQueuePage />
                  </RequireRole>
                }
              />

              {/* Business Staff / Owner Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <RequireRole role={['owner', 'staff']}>
                    <BusinessDashboard />
                  </RequireRole>
                }
              />
              <Route
                path="/dashboard/counters"
                element={
                  <RequireRole role={['owner', 'staff']}>
                    <CountersPage />
                  </RequireRole>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <RequireRole role="owner">
                    <BusinessSettingsPage />
                  </RequireRole>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Minimalist Footer */}
          <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p>© {new Date().getFullYear()} QueueFlow. Stop Waiting. Start Flowing.</p>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Phase 0 & 1 Complete</span>
                <span>•</span>
                <span className="text-indigo-400 font-mono">Module 1 (Auth & Business Basics)</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
