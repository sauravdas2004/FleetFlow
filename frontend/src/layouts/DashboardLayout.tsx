import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Bell,
  Menu,
  X,
  MapPin,
  DollarSign,
  Navigation,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout } from '@/redux/slices/authSlice';
import { toggleTheme } from '@/redux/slices/themeSlice';
import { Button } from '@/components/ui/button';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/fleet', icon: Truck, label: 'Live Fleet' },
  { to: '/admin/deliveries', icon: Package, label: 'Deliveries' },
  { to: '/admin/drivers', icon: Users, label: 'Drivers' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

const driverNav = [
  { to: '/driver', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/driver/deliveries', icon: Package, label: 'Deliveries' },
  { to: '/driver/earnings', icon: DollarSign, label: 'Earnings' },
  { to: '/driver/navigate', icon: Navigation, label: 'Navigate' },
];

const customerNav = [
  { to: '/customer', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customer/track', icon: MapPin, label: 'Track Delivery' },
  { to: '/customer/history', icon: Package, label: 'History' },
  { to: '/customer/profile', icon: Settings, label: 'Profile' },
];

export function DashboardLayout() {
  const { user } = useAppSelector((s) => s.auth);
  const { mode } = useAppSelector((s) => s.theme);
  const { unreadCount } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems =
    user?.role === 'admin' ? adminNav : user?.role === 'driver' ? driverNav : customerNav;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">FleetFlow</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{user?.role} Portal</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.endsWith('/admin') || item.to.endsWith('/driver') || item.to.endsWith('/customer')}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t space-y-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl px-4 lg:px-8 h-16 flex items-center justify-between">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => dispatch(toggleTheme())}>
              {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
