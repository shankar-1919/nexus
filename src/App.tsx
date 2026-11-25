import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/ToastContainer';
import { LandingPage } from './pages/LandingPage';
import { DemoLoginPage } from './pages/DemoLoginPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { ReportProblemPage } from './pages/ReportProblemPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { CommunityMapPage } from './pages/CommunityMapPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { FieldOfficerDashboardPage } from './pages/FieldOfficerDashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpSupportPage } from './pages/HelpSupportPage';

const LandingOrAutostart: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { role, loginAsRole } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('autostart') === '1') {
      if (!role) loginAsRole('citizen');
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, role, loginAsRole, navigate]);

  return <LandingPage />;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingOrAutostart />} />
          <Route path="/login" element={<DemoLoginPage />} />
          <Route path="/dashboard" element={<CitizenDashboardPage />} />
          <Route path="/report" element={<ReportProblemPage />} />
          <Route path="/my-reports" element={<MyReportsPage />} />
          <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="/map" element={<CommunityMapPage />} />
          <Route path="/insights" element={<AIInsightsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/field-tasks" element={<FieldOfficerDashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpSupportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
