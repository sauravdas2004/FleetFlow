import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { deliveryApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Delivery } from '@/types';

export default function HistoryPage() {
  const { data: deliveries } = useQuery({
    queryKey: ['customer-deliveries'],
    queryFn: async () => (await deliveryApi.getAll({ limit: 50 })).data.data as Delivery[],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Delivery History</h1>
      <div className="space-y-3">
        {(deliveries || []).map((d) => (
          <Card key={d._id}>
            <CardContent className="flex justify-between items-center py-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{d.trackingNumber}</p>
                <p className="font-medium">{d.packageDescription}</p>
                <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
              </div>
              <div className="text-right">
                <Badge status={d.status} />
                <p className="mt-1 font-medium">{formatCurrency(d.fare)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
