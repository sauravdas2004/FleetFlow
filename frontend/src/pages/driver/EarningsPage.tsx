import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, Star } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { driverApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function EarningsPage() {
  const { data } = useQuery({
    queryKey: ['earnings'],
    queryFn: async () => (await driverApi.getEarnings()).data.data,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Earnings</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="Total Earnings" value={formatCurrency(data?.totalEarnings ?? 0)} icon={DollarSign} />
        <StatCard title="Deliveries" value={data?.totalDeliveries ?? 0} icon={Package} />
        <StatCard title="Rating" value={`${data?.rating ?? 5} ★`} icon={Star} />
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Completed</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(data?.recentDeliveries || []).map((d: { _id: string; trackingNumber: string; fare: number; actualDeliveryTime?: string }) => (
            <div key={d._id} className="flex justify-between py-2 border-b border-border/50">
              <span className="font-mono text-xs">{d.trackingNumber}</span>
              <span>{formatCurrency(d.fare * 0.7)}</span>
              <span className="text-muted-foreground text-xs">{d.actualDeliveryTime ? formatDate(d.actualDeliveryTime) : '-'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
