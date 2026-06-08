import { useQuery } from '@tanstack/react-query';
import { FleetMap } from '@/components/map/FleetMap';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fleetApi } from '@/services/api';
import type { Driver } from '@/types';

export default function FleetPage() {
  const { data: fleet, isLoading } = useQuery({
    queryKey: ['fleet'],
    queryFn: async () => (await fleetApi.getFleet()).data.data as Driver[],
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Fleet</h1>
        <p className="text-muted-foreground">Realtime driver locations and status</p>
      </div>
      <FleetMap drivers={fleet || []} height="500px" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(fleet || []).map((driver) => {
          const user = typeof driver.user === 'object' ? driver.user : null;
          return (
            <Card key={driver._id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{user ? `${user.firstName} ${user.lastName}` : 'Driver'}</CardTitle>
                  <Badge status={driver.status} />
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Rating: {driver.rating} ★</p>
                <p>Deliveries: {driver.totalDeliveries}</p>
                <p>Speed: {driver.speed ?? 0} km/h</p>
                {driver.vehicle && typeof driver.vehicle === 'object' && (
                  <p>{driver.vehicle.make} {driver.vehicle.model} • {driver.vehicle.plateNumber}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && (!fleet || fleet.length === 0) && (
          <p className="text-muted-foreground col-span-full text-center py-8">No active drivers. Run seed script to populate data.</p>
        )}
      </div>
    </div>
  );
}
