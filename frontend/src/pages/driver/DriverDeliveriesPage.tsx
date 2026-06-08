import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deliveryApi } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import type { Delivery } from '@/types';

export default function DriverDeliveriesPage() {
  const { data: deliveries } = useQuery({
    queryKey: ['driver-deliveries'],
    queryFn: async () => (await deliveryApi.getAll({ limit: 50 })).data.data as Delivery[],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Deliveries</h1>
      <div className="space-y-3">
        {(deliveries || []).map((d) => (
          <Card key={d._id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-mono">{d.trackingNumber}</CardTitle>
                <Badge status={d.status} />
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>{d.packageDescription}</p>
              <p className="text-muted-foreground">Pickup: {d.pickupAddress.street}, {d.pickupAddress.city}</p>
              <p className="text-muted-foreground">Drop: {d.deliveryAddress.street}, {d.deliveryAddress.city}</p>
              <p className="font-medium">{formatCurrency(d.fare)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
