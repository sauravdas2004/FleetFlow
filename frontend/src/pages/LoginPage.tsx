import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { authApi } from '@/services/api';
import { useAppDispatch } from '@/redux/hooks';
import { setCredentials } from '@/redux/slices/authSlice';
import { toast } from '@/components/ui/toast';

const demos = [
  { label: 'Admin', email: 'admin@fleetflow.io', password: 'Admin@12345' },
  { label: 'Driver', email: 'driver1@fleetflow.io', password: 'Driver@12345' },
  { label: 'Customer', email: 'john@example.com', password: 'Customer@123' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('admin@fleetflow.io');
  const [password, setPassword] = useState('Admin@12345');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      const { user, accessToken, refreshToken } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success('Welcome back!', `Signed in as ${user.firstName}`);
      const path = user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/customer';
      navigate(path);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error('Login failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-hero-gradient items-center justify-center p-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">FleetFlow</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Fleet intelligence at your fingertips</h2>
          <p className="text-white/60">Track deliveries, manage drivers, and optimize routes — all in realtime.</p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-muted-foreground mb-8">Sign in to your FleetFlow account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input id="password" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-muted-foreground mb-3 text-center">Quick demo login</p>
            <div className="flex gap-2">
              {demos.map((d) => (
                <Button key={d.label} variant="outline" size="sm" className="flex-1" onClick={() => { setEmail(d.email); setPassword(d.password); }}>
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            <Link to="/" className="hover:underline">← Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
