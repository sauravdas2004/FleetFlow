import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, DollarSign, Star, MapPin } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deliveryApi, driverApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import type { Delivery } from '@/types';

const STATUS_FLOW = ['assigned', 'picked_up', 'in_transit', 'delivered'];

export default function DriverDashboard() {
  const qc = useQueryClient();

  const { data: deliveries } = useQuery({
    queryKey: ['driver-deliveries'],
    queryFn: async () => (await deliveryApi.getAll({ limit: 20 })).data.data as Delivery[],
    refetchInterval: 15000,
  });

  const { data: earnings } = useQuery({
    queryKey: ['earnings'],
    queryFn: async () => (await driverApi.getEarnings()).data.data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => deliveryApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver-deliveries'] }); toast.success('Status updated'); },
  });

  const toggleOnline = async () => {
    await driverApi.updateStatus({ status: 'online', isAvailable: true });
    toast.success('You are now online');
  };

  const active = (deliveries || []).filter((d) => !['delivered', 'cancelled', 'pending'].includes(d.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Driver Dashboard</h1>
          <p className="text-muted-foreground">Your deliveries and earnings</p>
        </div>
        <Button variant="gradient" onClick={toggleOnline}><MapPin className="w-4 h-4" /> Go Online</Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard title="Active Deliveries" value={active.length} icon={Package} />
        <StatCard title="Total Earnings" value={formatCurrency(earnings?.totalEarnings ?? 0)} icon={DollarSign} />
        <StatCard title="Rating" value={`${earnings?.rating ?? 5} ★`} icon={Star} />
      </div>

      <Card>
        <CardHeader><CardTitle>Assigned Deliveries</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {(deliveries || []).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No deliveries assigned yet</p>
          ) : (deliveries || []).map((d) => (
            <div key={d._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{d.trackingNumber}</p>
                <p className="font-medium">{d.packageDescription}</p>
                <p className="text-sm text-muted-foreground">{d.pickupAddress.city} → {d.deliveryAddress.city}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={d.status} />
                {STATUS_FLOW.includes(d.status) && d.status !== 'delivered' && (
                  <Button size="sm" onClick={() => {
                    const idx = STATUS_FLOW.indexOf(d.status);
                    if (idx < STATUS_FLOW.length - 1) statusMutation.mutate({ id: d._id, status: STATUS_FLOW[idx + 1] });
                  }}>
                    Update Status
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
