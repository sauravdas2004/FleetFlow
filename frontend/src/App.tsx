import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { store } from '@/redux/store';
import { useAppSelector } from '@/redux/hooks';
import { connectSocket } from '@/services/socket';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ToastContainer, useToast } from '@/components/ui/toast';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import FleetPage from '@/pages/admin/FleetPage';
import DeliveriesPage from '@/pages/admin/DeliveriesPage';
import DriversPage from '@/pages/admin/DriversPage';
import AnalyticsPage from '@/pages/admin/AnalyticsPage';
import DriverDashboard from '@/pages/driver/DriverDashboard';
import DriverDeliveriesPage from '@/pages/driver/DriverDeliveriesPage';
import EarningsPage from '@/pages/driver/EarningsPage';
import NavigatePage from '@/pages/driver/NavigatePage';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import TrackPage from '@/pages/customer/TrackPage';
import HistoryPage from '@/pages/customer/HistoryPage';
import ProfilePage from '@/pages/customer/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function AppRoutes() {
  const { toasts, remove } = useToast();
  const { isAuthenticated, accessToken } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated && accessToken) connectSocket(accessToken);
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/fleet" element={<FleetPage />} />
            <Route path="/admin/deliveries" element={<DeliveriesPage />} />
            <Route path="/admin/drivers" element={<DriversPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['driver']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/driver/deliveries" element={<DriverDeliveriesPage />} />
            <Route path="/driver/earnings" element={<EarningsPage />} />
            <Route path="/driver/navigate" element={<NavigatePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/customer" element={<CustomerDashboard />} />
            <Route path="/customer/track" element={<TrackPage />} />
            <Route path="/customer/history" element={<HistoryPage />} />
            <Route path="/customer/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}

function AppWithStore() {
  return <AppRoutes />;
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppWithStore />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
