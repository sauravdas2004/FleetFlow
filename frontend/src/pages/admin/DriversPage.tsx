import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { fleetApi } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import type { Driver } from '@/types';

export default function DriversPage() {
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => (await fleetApi.getDrivers({ limit: 50 })).data.data as Driver[],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Drivers</h1>
        <p className="text-muted-foreground">Manage your fleet drivers</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />) : (
          (drivers || []).map((driver) => {
            const user = typeof driver.user === 'object' ? driver.user : null;
            return (
              <Card key={driver._id} className="card-hover">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                      <CardTitle className="text-base">{user?.firstName} {user?.lastName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge status={driver.status} /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span>{driver.rating} ★</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Deliveries</span><span>{driver.totalDeliveries}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Earnings</span><span>{formatCurrency(driver.totalEarnings)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">License</span><span className="font-mono text-xs">{driver.licenseNumber}</span></div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
