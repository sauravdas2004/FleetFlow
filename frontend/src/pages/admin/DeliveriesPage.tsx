import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { deliveryApi, fleetApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import type { Delivery, Driver } from '@/types';

export default function DeliveriesPage() {
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries', search],
    queryFn: async () => (await deliveryApi.getAll({ search, limit: 50 })).data.data as Delivery[],
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => (await fleetApi.getDrivers({ limit: 50 })).data.data as Driver[],
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, driverId }: { id: string; driverId: string }) => deliveryApi.assign(id, driverId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Driver assigned');
      setAssigning(null);
    },
    onError: () => toast.error('Assignment failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Deliveries</h1>
          <p className="text-muted-foreground">Manage and assign deliveries</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tracking..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>All Deliveries</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton rows={8} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3">Tracking</th>
                    <th className="text-left py-3">From → To</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">Priority</th>
                    <th className="text-left py-3">Fare</th>
                    <th className="text-left py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(deliveries || []).map((d) => (
                    <tr key={d._id} className="border-b border-border/50">
                      <td className="py-3 font-mono text-xs">{d.trackingNumber}</td>
                      <td className="py-3">{d.pickupAddress.city} → {d.deliveryAddress.city}</td>
                      <td className="py-3"><Badge status={d.status} /></td>
                      <td className="py-3 capitalize">{d.priority}</td>
                      <td className="py-3">{formatCurrency(d.fare)}</td>
                      <td className="py-3">
                        {d.status === 'pending' && (
                          assigning === d._id ? (
                            <select
                              className="text-xs border rounded px-2 py-1 bg-background"
                              onChange={(e) => assignMutation.mutate({ id: d._id, driverId: e.target.value })}
                              defaultValue=""
                            >
                              <option value="" disabled>Select driver</option>
                              {(drivers || []).filter((dr) => dr.isAvailable).map((dr) => {
                                const u = typeof dr.user === 'object' ? dr.user : null;
                                return <option key={dr._id} value={dr._id}>{u?.firstName} {u?.lastName}</option>;
                              })}
                            </select>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setAssigning(d._id)}>Assign</Button>
                          )
                        )}
                      </td>
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
