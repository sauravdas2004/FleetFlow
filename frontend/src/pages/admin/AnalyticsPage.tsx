import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { Package, DollarSign, TrendingUp, XCircle } from 'lucide-react';
import { fleetApi } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import type { Analytics } from '@/types';

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#22c55e', '#eab308', '#ef4444'];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => (await fleetApi.getAnalytics(30)).data.data as Analytics,
  });

  const overview = analytics?.overview;
  const statusData = Object.entries(analytics?.statusBreakdown || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Delivery and revenue insights</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : (
          <>
            <StatCard title="Total Deliveries" value={overview?.totalDeliveries ?? 0} icon={Package} />
            <StatCard title="Revenue" value={formatCurrency(overview?.totalRevenue ?? 0)} icon={DollarSign} trend="up" />
            <StatCard title="Completion Rate" value={`${overview?.completionRate ?? 0}%`} icon={TrendingUp} trend="up" />
            <StatCard title="Cancelled" value={overview?.cancelledDeliveries ?? 0} icon={XCircle} trend="down" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Daily Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics?.dailyRevenue || []}>
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
