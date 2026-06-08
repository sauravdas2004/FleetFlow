import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Eye, EyeOff, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { authApi } from '@/services/api';
import { useAppDispatch } from '@/redux/hooks';
import { setCredentials } from '@/redux/slices/authSlice';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('customer');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (role === 'driver' && !licenseNumber.trim()) {
      toast.error('License number is required for drivers');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        firstName,
        lastName,
        email,
        password,
        role,
      };
      if (phone) payload.phone = phone;
      if (role === 'driver') payload.licenseNumber = licenseNumber;

      const { data } = await authApi.register(payload);
      const { user, accessToken, refreshToken } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success('Account created!', `Welcome to FleetFlow, ${user.firstName}`);
      const path = user.role === 'driver' ? '/driver' : '/customer';
      navigate(path);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed';
      toast.error('Sign up failed', msg);
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
          <h2 className="text-3xl font-bold text-white mb-4">Join the fleet network</h2>
          <p className="text-white/60 mb-8">
            Create an account to ship packages, drive deliveries, or manage your logistics — all in one platform.
          </p>
          <div className="space-y-4">
            {[
              { icon: Package, title: 'Customers', desc: 'Book and track deliveries in realtime' },
              { icon: Truck, title: 'Drivers', desc: 'Accept jobs and earn on your schedule' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 glass rounded-xl p-4">
                <item.icon className="w-5 h-5 text-violet-300 mt-0.5" />
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-sm text-white/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-muted-foreground mb-6">Get started with FleetFlow in minutes</p>

          <div className="flex gap-2 p-1 rounded-lg bg-muted mb-6">
            {(['customer', 'driver'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all capitalize',
                  role === r
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {r === 'customer' ? <Package className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5"
                placeholder="+1-555-0000"
              />
            </div>

            {role === 'driver' && (
              <div>
                <Label htmlFor="license">Driver license number</Label>
                <Input
                  id="license"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="mt-1.5"
                  placeholder="DL-XXXX-XXXX"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            <Link to="/" className="hover:underline">
              ← Back to home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
