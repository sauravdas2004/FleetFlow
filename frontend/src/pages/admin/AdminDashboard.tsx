import { useQuery } from '@tanstack/react-query';
import { Package, Truck, DollarSign, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { FleetMap } from '@/components/map/FleetMap';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { fleetApi, deliveryApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Analytics, Delivery, Driver } from '@/types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await fleetApi.getAnalytics()).data.data as Analytics,
    refetchInterval: 30000,
  });

  const { data: fleet } = useQuery({
    queryKey: ['fleet'],
    queryFn: async () => (await fleetApi.getFleet()).data.data as Driver[],
    refetchInterval: 10000,
  });

  const { data: deliveries, isLoading: loadingDeliveries } = useQuery({
    queryKey: ['deliveries', 'recent'],
    queryFn: async () => (await deliveryApi.getAll({ limit: 8 })).data.data as Delivery[],
  });

  const overview = analytics?.overview;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Fleet overview and realtime metrics</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingAnalytics ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Deliveries" value={overview?.totalDeliveries ?? 0} icon={Package} change={`${overview?.completionRate ?? 0}% completion`} trend="up" />
            <StatCard title="Active Drivers" value={overview?.activeDrivers ?? 0} icon={Truck} change="Live on map" trend="neutral" />
            <StatCard title="Revenue" value={formatCurrency(overview?.totalRevenue ?? 0)} icon={DollarSign} change="Last 30 days" trend="up" />
            <StatCard title="New Customers" value={overview?.newCustomers ?? 0} icon={TrendingUp} change="This month" trend="up" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Live Fleet Map</CardTitle></CardHeader>
            <CardContent><FleetMap drivers={fleet || []} height="380px" /></CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={analytics?.dailyRevenue || []}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Deliveries</CardTitle></CardHeader>
        <CardContent>
          {loadingDeliveries ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 font-medium">Tracking</th>
                    <th className="text-left py-3 font-medium">Package</th>
                    <th className="text-left py-3 font-medium">Status</th>
                    <th className="text-left py-3 font-medium">Fare</th>
                    <th className="text-left py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(deliveries || []).map((d) => (
                    <tr key={d._id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 font-mono text-xs">{d.trackingNumber}</td>
                      <td className="py-3">{d.packageDescription}</td>
                      <td className="py-3"><Badge status={d.status} /></td>
                      <td className="py-3">{formatCurrency(d.fare)}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
